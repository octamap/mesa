import { JSDOM } from "jsdom";
import getAttributesOfChildElements from "./getAttributesOfChildElements.js";
import ComponentsMap from "../types/ComponentsMap.js";
import getHtmForSource from "./getHtmlForSource.js";
import findElementsWithTags from "./findElementsWithTags.js";
import getInnerHTML from "./inner-html/getInnerHtml.js";
import setInnerHTML from "./inner-html/setInnerHtml.js";

function decodeSyntax(html: string) {
    return html.replace(/@([\w-]+)=/g, 'data-event-$1=');
}

function encodeSyntax(html: string) {
    return html.replace(/data-event-([\w-]+)=/g, '@$1=');
}

// Processes HTML with provided components
export default async function processHtml(html: string, components: ComponentsMap): Promise<{ html: string, componentsUsed: string[] }> {
    const tagNames = Object.keys(components)
    const uncompiledElements = findElementsWithTags(tagNames, html)

    if (uncompiledElements.length == 0) return { html, componentsUsed: [] }
    const allComponentsUsed: string[] = []

    // Compile the new elements
    const compiledContents = await Promise.all(uncompiledElements.map(async uncompiledElement => {
        // Find the html of the component
        const source = components[uncompiledElement.tag];
        let compiledContent = await getHtmForSource(source).then(x => x!)

        // Process the html of the component (in case the component is using a component)
        // We exclude the current tag to prevent infinite loops in case the component references itself
        const componentsExcludingCurrent = { ...components }
        delete componentsExcludingCurrent[uncompiledElement.tag]
        const { html: processedComponentHtml, componentsUsed } = await processHtml(compiledContent, componentsExcludingCurrent)
        compiledContent = processedComponentHtml
        allComponentsUsed.push(...componentsUsed)
        allComponentsUsed.push(uncompiledElement.tag)

        // Process the html
        let uncompiledContent = html.slice(uncompiledElement.from, uncompiledElement.to)
        const innerHtml = getInnerHTML(uncompiledContent)
        if (innerHtml) {
            const { html: processedInnerHtml, componentsUsed } = await processHtml(innerHtml, components)
            allComponentsUsed.push(...componentsUsed)
            uncompiledContent = setInnerHTML(uncompiledContent, processedInnerHtml)
        }

        // Apply the attributes set on the uncompiled content to the component html
        const dom = new JSDOM(`<body>${decodeSyntax(uncompiledContent)}</body>`);
        const doc = dom.window.document;
        const parent = doc.body.firstElementChild;
        const elements = parent ? getAttributesOfChildElements(parent) : [];
        const defaultAttributes = parent ? Array.from(parent.attributes) : []

        if ((elements.length > 0) || defaultAttributes.length > 0) {
            const compiledContentDom = new JSDOM(`<div>${decodeSyntax(compiledContent)}</div>`);
            const compiledContentDoc = compiledContentDom.window.document;
            const compiledContentElements = Array.from(compiledContentDoc.querySelectorAll('*'))

            for (const element of elements) {
                const compiledElement = compiledContentElements.find(x => x.hasAttribute(`#${element.tagName}`))
                if (compiledElement) {
                    // Remove unless we have default attributes on the parent to apply later
                    if (!(element.tagName == "default" && defaultAttributes.length > 0)) {
                        compiledElement.removeAttribute(`#${element.tagName}`)
                    }
                    for (const attribute of element.attributes) {
                        compiledElement.setAttribute(attribute.name, attribute.value);
                    }
                    if (element.innerHtml.trim().length > 0) {
                        compiledElement.innerHTML = element.innerHtml
                    }
                }
            }
            if (defaultAttributes.length > 0) {
                let defaultElment = compiledContentElements.find(x => x.hasAttribute(`#default`))
                if (!defaultElment) {
                    // If compiled content has one root element, then this is default by default 
                    const rootChildren = compiledContentDoc.body.firstElementChild?.children ?? []
                    if (rootChildren.length == 1) {
                        defaultElment = rootChildren[0]
                    }
                }
                if (defaultElment) {
                    defaultElment.removeAttribute('#default');
                    for (const attribute of defaultAttributes) {
                        defaultElment.setAttribute(attribute.name, attribute.value)
                    }
                }
            }
            if (compiledContentDoc.body.firstElementChild) {
                compiledContent = encodeSyntax(compiledContentDoc.body.firstElementChild.innerHTML)
            }
        }
        return compiledContent
    }))

    // Replace the old elements with the compiled 
    const indicies = Array.from({ length: uncompiledElements.length }, (_, index) => index)
    for (const index of indicies.reverse()) {
        const { from, to } = uncompiledElements[index]
        html = html.slice(0, from) + compiledContents[index] + html.slice(to)
    }
    return { html: html, componentsUsed: allComponentsUsed }
}