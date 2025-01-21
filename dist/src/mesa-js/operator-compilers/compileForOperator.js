import traverseElementChildren from '../../helpers/traverseElementChildren.js';
export default function compileForOperator(dom, element, variables) {
    const forDirective = element.getAttribute("m-for");
    if (!forDirective)
        return;
    // Enhanced regex to handle spaces
    const { itemVar, indexVar, arrayName } = (() => {
        const match = forDirective.match(/\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+in\s+(\w+)/);
        if (match) {
            const [, itemVar, indexVar, arrayName] = match;
            return { itemVar: itemVar == "_" ? null : itemVar, indexVar: indexVar == "_" ? null : indexVar, arrayName };
        }
        // The for is most probably somthing like "point in points"
        const regex = /^\s*\(?\s*(\w+)\s+in\s+(\w+)\s*\)?\s*$/;
        // Execute the regex on the string
        const nonIndexMatch = forDirective.match(regex);
        if (nonIndexMatch) {
            const [, itemVar, arrayName] = nonIndexMatch;
            return { itemVar: itemVar == "_" ? null : itemVar, arrayName, indexVar: null };
        }
        throw new Error(`Invalid :for directive: "${forDirective}"`);
    })();
    // Find the variable that matches the arrayName
    const variable = variables.find((v) => v.name === arrayName);
    if (!variable || variable.type !== "array") {
        throw new Error(`Variable "${arrayName}" is not defined or not an array.`);
    }
    const newElements = repeatElement(dom, element, variable.elements, itemVar, indexVar, arrayName);
    element.replaceWith(...newElements);
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
export function repeatElement(dom, element, items, itemVar, indexVar, arrayName) {
    const output = [];
    // Remove the :for attribute to prevent it from appearing in the output
    element.removeAttribute('m-for');
    let elementsToClone = [element];
    // Deep clone the template element
    if (element.tagName.toLowerCase() == "template") {
        if ("content" in element) {
            elementsToClone = Array.from(element.content.children);
        }
    }
    items.forEach((dataItem, i) => {
        let clones = elementsToClone.map(x => x.cloneNode(true));
        // We need to compile everything that relates to the "for" context
        // m-if takes care of evaluating
        function compile(value, wrapStrings) {
            // Replace index variable with actual index
            if (indexVar) {
                const indexRegex = new RegExp(`\\b${indexVar}\\b`, 'g');
                value = value.replaceAll(indexRegex, String(i));
            }
            if (itemVar) {
                value = compileVariables(value, itemVar, dataItem, wrapStrings);
            }
            if (arrayName && value.includes(arrayName)) {
                // Convert arrayName.length into array length
                value = value.replaceAll(`${arrayName}.length`, items.length.toString());
                // Replace patterns of arrayName[5] with "abc"
                const pattern = /\[[^\]]*\]/g;
                const matches = value.matchAll(pattern);
                const integerPattern = /^\[\d+\]$/; // Regex to check for a single integer within brackets
                const filtered = Array.from(matches)
                    .filter(match => integerPattern.test(match[0])); // Filter to include only single integer values
                for (const match of filtered.reverse()) {
                    const startIndex = match.index;
                    const endIndex = startIndex + match[0].length;
                    const arrayIndex = parseInt(match[0].slice(1, -1));
                    const stringBefore = value.slice(0, startIndex);
                    if (stringBefore.endsWith(arrayName)) {
                        value = value.slice(0, startIndex - arrayName.length) + JSON.stringify(items[arrayIndex]) + value.slice(endIndex);
                    }
                }
                // Replace all remaining occurrances of arrayName with the items stringified
                if (value.includes(arrayName)) {
                    const stringified = JSON.stringify(items);
                    value = value.replaceAll(arrayName, stringified);
                }
            }
            return value;
        }
        for (const cloned of clones) {
            // Process all attributes
            function processAttributes(element) {
                element.getAttributeNames().forEach(attrName => {
                    let attrValue = element.getAttribute(attrName) || '';
                    attrValue = compile(attrValue, true);
                    element.setAttribute(attrName, attrValue);
                });
            }
            processAttributes(cloned);
            traverseElementChildren(cloned, x => {
                processAttributes(x);
            });
            const regex = /{{\s*(.*?)\s*}}/g;
            cloned.innerHTML = cloned.innerHTML.replace(regex, (match, content) => {
                return "{{" + compile(content, true) + "}}";
            });
            output.push(cloned);
        }
    });
    return output;
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
export function compileVariables(code, baseName, variables, wrapStrings) {
    // A helper to retrieve nested values from `variables`
    function getNestedValue(path) {
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
    return code.replaceAll(regex, (_match, capture) => {
        const value = getNestedValue(capture);
        // Convert value to a string representation, quoting strings
        if (typeof value === "string") {
            return wrapStrings ? `\`${value}\`` : value;
        }
        return String(value);
    });
}
