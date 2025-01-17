import { JSDOM } from 'jsdom';

export default function forOperatorCompile(
    htmlText: string,
    variables: { type: "array"; name: string; elements: any[] }[]
): string {
    const dom = new JSDOM(htmlText);
    const doc = dom.window.document;

    const forElements = doc.querySelectorAll("[\\:for]");
    if (forElements.length == 0) return htmlText

    forElements.forEach((element) => {
        const forDirective = element.getAttribute(":for");
        if (!forDirective) return;

        // Enhanced regex to handle spaces
        const {itemVar, indexVar, arrayName} = (() => {
            const match = forDirective.match(/\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+in\s+(\w+)/);
            if (match) {
                const [, itemVar, indexVar, arrayName] = match;
                return {itemVar: itemVar == "_" ? null : itemVar, indexVar: indexVar == "_" ? null : indexVar, arrayName}
            }
            // The for is most probably somthing like "point in points"
            const regex = /^\s*\(?\s*(\w+)\s+in\s+(\w+)\s*\)?\s*$/

            // Execute the regex on the string
            const nonIndexMatch = forDirective.match(regex);
            if (nonIndexMatch) {
                const [, itemVar, arrayName] = nonIndexMatch;
                return {itemVar: itemVar == "_" ? null : itemVar, arrayName, indexVar: null}
            }
            throw new Error(`Invalid :for directive: "${forDirective}"`);
        })()

        
        // Find the variable that matches the arrayName
        const variable = variables.find((v) => v.name === arrayName);
        if (!variable || variable.type !== "array") {
            throw new Error(`Variable "${arrayName}" is not defined or not an array.`);
        }

        const newElements = repeatElement(dom, element, variable.elements, itemVar, indexVar)
        element.replaceWith(...newElements);
    });

    if (htmlText.includes("<body")) {
        const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '';
        return doctype + doc.documentElement.outerHTML;
    }
    // Return the compiled HTML
    return doc.body.innerHTML;
}

interface ItemData {
    [key: string]: any;
}

/**
 * Transforms an element with :for="(itemVar, indexVar) in data" 
 * into an array of cloned and replaced elements.
 *
 * @param element  The element node containing the :for directive.
 * @param items    The array of data objects to iterate over.
 * @param itemVar  The variable name representing each item in the array. E.g. 'segment'
 * @param indexVar The variable name representing the array index. E.g. 'index'
 * @returns        An array of cloned elements with all references replaced.
 */
export function repeatElement(
    dom: JSDOM,
    element: Element,
    items: ItemData[],
    itemVar: string | null,
    indexVar: string | null
): Element[] {
    const output: Element[] = [];

    // Remove the :for attribute to prevent it from appearing in the output
    element.removeAttribute(':for');

    items.forEach((dataItem, i) => {
        // Deep clone the template element
        const cloned = element.cloneNode(true) as Element;

        function compile(value: string, wrapStrings: boolean) {
            // Replace index variable with actual index
            if (indexVar) {
                const indexRegex = new RegExp(`\\b${indexVar}\\b`, 'g');
                value = value.replace(indexRegex, String(i));
            }
            if (itemVar) {
                value = compileVariables(value, itemVar, dataItem, wrapStrings)
            }
            return value
        }
   
        // Process all attributes
        cloned.getAttributeNames().forEach(attrName => {
            let attrValue = cloned.getAttribute(attrName) || '';

            // The value should only be wrapped in quotes if the attrValue is code 
            const codeIdentifiers = [
                "x-",
                ":",
                ":",
                "v-",
                "@",
                "data-",
                "for-",
                "bind:",
                "if-",    
                "for-",     
                "model:",
                "on",        
            ]

            attrValue = compile(attrValue, codeIdentifiers.some(x => attrName.startsWith(x)));

            // Update the attribute with the replaced value
            cloned.setAttribute(attrName, attrValue);
        });

        // Replace variables in text content
        walkTextNodes(dom, cloned, (text) => {
            return compile(text, false)
        });

        output.push(cloned);
    });

    return output;
}

/**
 * Walks the text nodes of a given parent, allowing you to transform 
 * each text node's content with a callback.
 */
function walkTextNodes(dom: JSDOM, parent: Node, transform: (txt: string) => string) {
    const document = parent.ownerDocument || (parent as Document);
    const NodeFilter = document.defaultView?.NodeFilter; // Access NodeFilter from the document's window
    if (!NodeFilter) {
        throw new Error('NodeFilter is not available');
    }
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null);

    while (walker.nextNode()) {
        // Collect text nodes first to avoid modifying them while we walk
        const node = walker.currentNode;
        if (node.nodeType === dom.window.Node.TEXT_NODE) {
            node.nodeValue = transform(node.nodeValue || '');
        }
    }

}

// A function that takes:
// code: play(segment.video, segment.index, segment.application.name)
// baseName: "segment"
// variables: { video: "movie.mp4", index: 5, application: { name: "main" } }
// --> play("movie.mp4", 5, "main")

// code: publication = post.article.split(" ")[0]
// baseName: "post"
// variables: { article: "2025 Best Films" }
// --> publication = "2025 Best Films".split(" ")[0]
export function compileVariables(
    code: string,
    baseName: string,
    variables: Record<string, any>,
    wrapStrings: boolean
): string {
    // A helper to retrieve nested values from `variables`
    function getNestedValue(path: string): unknown {
        return path.split(".").reduce((acc, key) => {
            if (acc && typeof acc === "object" && key in acc) {
                return acc[key];
            }
            // If path doesn't exist, return undefined or handle error
            return undefined;
        }, variables);
    }

    // Create a RegExp that matches baseName followed by a dot and
    // any valid characters for JS object keys (you can adjust if needed).
    const regex = new RegExp(`${baseName}\\.([a-zA-Z0-9_\\.]+)`, "g");

    // Replace all occurrences of "segment.xxx" with the corresponding value from `variables`
    return code.replace(regex, (_match, capture: string) => {
        const value = getNestedValue(capture);
        // Convert value to a string representation, quoting strings
        if (typeof value === "string") {
            return wrapStrings ? `\'${value}\'` : value
        }
        return String(value);
    });
}