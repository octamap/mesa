import { JSDOM } from "jsdom";
import getAttributesOfChildElements from "./getAttributesOfChildElements.js";
import getHtmlForSource from "./getHtmlForSource.js";
import findElementsWithTags from "./findElementsWithTags.js";
import getInnerHTML from "./inner-html/getInnerHtml.js";
import setInnerHTML from "./inner-html/setInnerHtml.js";
import SyntaxCoding from "../helpers/SyntaxCoding.js";
import path from "path";
import { stat } from "fs/promises";
import setAttr from "./setAttr.js";
import setSlot from "./setSlot.js";
import log from "../log.js";
import murmurhash from "murmurhash";
import chalk from "chalk";
import { ProcessHtmlCache } from "./ProcessHtmlCache.js";
// Processes HTML with provided components
// options
// - parentModule: The module that should be set as parent to the components within the html 
// - server: The server to use for updating module graph
// - originalComponents: Helps getHtmlForSource in figuring out the original file path of the component (necessary to create modules)
export default async function processHtml(html, components, options) {
    const start = Date.now();
    const tagNames = Object.keys(components);
    const shortHash = murmurhash.v3(html).toString(36).slice(0, 4);
    let key = `${options?.identifier ?? "uknown"}-${tagNames.length}-${html.length}-${shortHash}`;
    if (options?.constructionHash) {
        key += `-${options.constructionHash}`;
    }
    if (options?.parentPath) {
        key += `-${options.parentPath}`;
    }
    const existing = await ProcessHtmlCache.cache.get(key);
    if (existing?.componentsUsed.every(x => ProcessHtmlCache.IsNotModified.has(x)) && (options?.identifier ? ProcessHtmlCache.IsNotModified.has(options.identifier) : true)) {
        const caller = options?.caller ? ` (caller: ${options.caller})` : ``;
        log(`Processing ${chalk.blue(options?.identifier ?? `unknown`)} took ${chalk.blue(Date.now() - start)} - from ${chalk.green(`cache`)}${caller}`, "debug");
        return existing;
    }
    const newTask = createProcessHtmlTask(html, components, tagNames, options);
    ProcessHtmlCache.cache.set(key, newTask);
    await newTask;
    if (options?.identifier) {
        ProcessHtmlCache.IsNotModified.add(options.identifier);
    }
    setTimeout(() => {
        ProcessHtmlCache.cache.delete(key);
    }, 1000 * 60 * 4);
    return newTask;
}
async function createProcessHtmlTask(html, components, tagNames, options) {
    const start = Date.now();
    const uncompiledElements = findElementsWithTags(tagNames, html);
    options ??= {};
    if (uncompiledElements.length == 0)
        return { html, componentsUsed: [] };
    const allComponentsUsed = new Set();
    const mondoTextsDirectoryPaths = [];
    const parentPath = (options.parentPath ?? "") + `/${options.identifier ?? `unknown`}`;
    // Compile the new elements
    const compiledContents = await Promise.all(uncompiledElements.map(async (uncompiledElement) => {
        // Find the html of the component
        const source = components[uncompiledElement.tag];
        let { data: compiledContent, path: componentPath } = await getHtmlForSource(source, options.originalComponents?.[uncompiledElement.tag]).then(x => x);
        if (componentPath && options.hasMondo && compiledContent.includes("@")) {
            // Lets check if the directory of the component contains a folder named @texts
            mondoTextsDirectoryPaths.push(findTextsFolder(componentPath));
        }
        // Process the html of the component (in case the component is using a component)
        // We exclude the current tag to prevent infinite loops in case the component references itself
        const componentsExcludingCurrent = { ...components };
        delete componentsExcludingCurrent[uncompiledElement.tag];
        const constructionHash = murmurhash.v3(uncompiledElement.text).toString(36).slice(0, 4);
        const { html: processedComponentHtml, componentsUsed } = await processHtml(compiledContent, componentsExcludingCurrent, { ...options, parentPath, identifier: uncompiledElement.tag, constructionHash });
        compiledContent = processedComponentHtml;
        componentsUsed.forEach(x => allComponentsUsed.add(x));
        allComponentsUsed.add(uncompiledElement.tag);
        // Process the html
        let uncompiledContent = html.slice(uncompiledElement.from, uncompiledElement.to);
        let innerHtml = getInnerHTML(uncompiledContent);
        if (innerHtml) {
            const { html: processedInnerHtml, componentsUsed } = await processHtml(innerHtml, components, { ...options, parentPath, constructionHash, identifier: "Inner html of " + uncompiledElement.tag });
            componentsUsed.forEach(x => allComponentsUsed.add(x));
            uncompiledContent = setInnerHTML(uncompiledContent, processedInnerHtml);
            innerHtml = processedInnerHtml;
        }
        // Apply the attributes set on the uncompiled content to the component html
        const dom = new JSDOM(`<body>${SyntaxCoding.decode(uncompiledContent)}</body>`);
        const doc = dom.window.document;
        const parent = doc.body.firstElementChild;
        const elements = parent ? getAttributesOfChildElements(parent) : [];
        const defaultAttributes = parent ? Array.from(parent.attributes) : [];
        let parentInnerHtml = parent?.innerHTML.trim();
        if ((parentInnerHtml?.length ?? 0) == 0)
            parentInnerHtml = undefined;
        if ((elements.length > 0) || defaultAttributes.length > 0 || parentInnerHtml) {
            const compiledContentDom = new JSDOM(`<div>${SyntaxCoding.decode(compiledContent)}</div>`);
            const compiledContentDoc = compiledContentDom.window.document;
            const compiledContentElements = Array.from(compiledContentDoc.querySelectorAll('*'));
            const rootElementOfCompiled = (() => {
                // If compiled content has one root element, then this is default by default 
                const rootChildren = compiledContentDoc.body.firstElementChild?.children ?? [];
                if (rootChildren.length == 1) {
                    return rootChildren[0];
                }
                return undefined;
            })();
            let matchingElements = 0;
            for (const element of elements) {
                const current = `#${element.tagName}`;
                let compiledElement = compiledContentElements.find(x => x.hasAttribute(current));
                if (compiledElement == undefined && current == "#default") {
                    // Its the root element 
                    compiledElement = rootElementOfCompiled;
                }
                if (compiledElement) {
                    matchingElements += 1;
                    // Remove unless we have default attributes on the parent to apply later
                    if (!(element.tagName == "default" && defaultAttributes.length > 0)) {
                        compiledElement.removeAttribute(current);
                    }
                    for (const attribute of element.attributes) {
                        setAttr(attribute, compiledElement);
                    }
                    if (element.innerHtml.trim().length > 0) {
                        setSlot(compiledElement, element.innerHtml);
                        compiledElement.removeAttribute("m-slot");
                    }
                }
            }
            if (matchingElements == 0 && innerHtml) {
                // The user has not specified slots. The user has specified what should be put in the default slot
                const defaultElement = compiledContentElements.find(x => x.hasAttribute(`#default`)) ?? rootElementOfCompiled;
                if (defaultElement) {
                    setSlot(defaultElement, innerHtml);
                    defaultElement.removeAttribute("m-slot");
                }
            }
            if (defaultAttributes.length > 0) {
                const defaultElment = compiledContentElements.find(x => x.hasAttribute(`#default`)) ?? rootElementOfCompiled;
                if (defaultElment) {
                    defaultElment.removeAttribute('#default');
                    for (const attribute of defaultAttributes) {
                        setAttr(attribute, defaultElment);
                    }
                }
            }
            if (compiledContentDoc.body.firstElementChild) {
                compiledContent = SyntaxCoding.encode(compiledContentDoc.body.firstElementChild.innerHTML);
            }
        }
        return compiledContent;
    }));
    // Replace the old elements with the compiled 
    const indicies = Array.from({ length: uncompiledElements.length }, (_, index) => index);
    for (const index of indicies.reverse()) {
        const { from, to } = uncompiledElements[index];
        html = html.slice(0, from) + compiledContents[index] + html.slice(to);
    }
    const textLinks = (await Promise.all(mondoTextsDirectoryPaths)).filter(x => x != null);
    if (textLinks.length) {
        const linksText = textLinks.map(x => {
            return `<link rel="text" href="${x}">`;
        }).join("\n");
        html = insertIntoHtml(html, linksText);
    }
    const caller = options.caller ? ` (caller: ${options.caller})` : ``;
    log(`Processing ${chalk.blue(options.identifier ?? `unknown`)} took ${chalk.blue(Date.now() - start)}${caller}`, "debug");
    return { html: html, componentsUsed: Array.from(allComponentsUsed) };
}
let cachedTextFolderResults = new Map();
async function findTextsFolder(filePath) {
    const expectedPath = path.join(path.dirname(filePath), "@texts");
    const cache = cachedTextFolderResults.get(expectedPath);
    if (cache != undefined) {
        return cache.then(x => x ? expectedPath : null);
    }
    const newProcess = (async () => {
        try {
            const info = await stat(expectedPath);
            if (info.isDirectory()) {
                return true;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    })();
    cachedTextFolderResults.set(expectedPath, newProcess);
    await newProcess;
    setTimeout(() => {
        cachedTextFolderResults.delete(expectedPath);
    }, 1000 * 30);
    return newProcess.then(x => x ? expectedPath : null);
}
function insertIntoHtml(html, contentToInsert) {
    // Regex that matches the <head> tag and captures it for use in the replacement
    const headRegex = /(<head[^>]*>)/i;
    // Replace the <head> tag with itself followed by the content to insert
    const replaced = html.replace(headRegex, `$1${contentToInsert}`);
    if (replaced.includes(contentToInsert)) {
        return replaced;
    }
    return `${contentToInsert}\n${html}`;
}
