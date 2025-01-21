import { JSDOM } from "jsdom";
import getAttributesOfChildElements from "./getAttributesOfChildElements.js";
import getHtmForSource from "./getHtmlForSource.js";
import findElementsWithTags from "./findElementsWithTags.js";
import getInnerHTML from "./inner-html/getInnerHtml.js";
import setInnerHTML from "./inner-html/setInnerHtml.js";
import SyntaxCoding from "../helpers/SyntaxCoding.js";
// Processes HTML with provided components
export default async function processHtml(html, components, options) {
    const tagNames = Object.keys(components);
    const uncompiledElements = findElementsWithTags(tagNames, html);
    options ??= {};
    if (uncompiledElements.length == 0)
        return { html, componentsUsed: [] };
    const allComponentsUsed = [];
    // Compile the new elements
    const compiledContents = await Promise.all(uncompiledElements.map(async (uncompiledElement) => {
        // Find the html of the component
        const source = components[uncompiledElement.tag];
        let compiledContent = await getHtmForSource(source).then(x => x);
        // Process the html of the component (in case the component is using a component)
        // We exclude the current tag to prevent infinite loops in case the component references itself
        const componentsExcludingCurrent = { ...components };
        delete componentsExcludingCurrent[uncompiledElement.tag];
        const { html: processedComponentHtml, componentsUsed } = await processHtml(compiledContent, componentsExcludingCurrent, { ...options });
        compiledContent = processedComponentHtml;
        allComponentsUsed.push(...componentsUsed);
        allComponentsUsed.push(uncompiledElement.tag);
        // Process the html
        let uncompiledContent = html.slice(uncompiledElement.from, uncompiledElement.to);
        const innerHtml = getInnerHTML(uncompiledContent);
        if (innerHtml) {
            const { html: processedInnerHtml, componentsUsed } = await processHtml(innerHtml, components, { ...options });
            allComponentsUsed.push(...componentsUsed);
            uncompiledContent = setInnerHTML(uncompiledContent, processedInnerHtml);
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
                        compiledElement.setAttribute(attribute.name, attribute.value);
                    }
                    if (element.innerHtml.trim().length > 0) {
                        compiledElement.innerHTML = element.innerHtml;
                    }
                }
            }
            if (matchingElements == 0 && innerHtml) {
                // The user has not specified slots. The user has specified what should be put in the default slot
                const defaultElment = compiledContentElements.find(x => x.hasAttribute(`#default`)) ?? rootElementOfCompiled;
                if (defaultElment) {
                    defaultElment.innerHTML = innerHtml;
                }
            }
            if (defaultAttributes.length > 0) {
                const defaultElment = compiledContentElements.find(x => x.hasAttribute(`#default`)) ?? rootElementOfCompiled;
                if (defaultElment) {
                    defaultElment.removeAttribute('#default');
                    for (const attribute of defaultAttributes) {
                        defaultElment.setAttribute(attribute.name, attribute.value);
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
    return { html: html, componentsUsed: allComponentsUsed };
}
