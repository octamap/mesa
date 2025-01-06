import ElementAttributes from "../types/ElementAttributes.js";


export default function getAttributesOfChildElements(parent: Element): ElementAttributes[] {
    const result: ElementAttributes[] = [];
    for (const child of Array.from(parent.children)) {
        result.push({
            tagName: child.tagName.toLowerCase(),
            innerHtml: child.innerHTML,
            attributes: Array.from(child.attributes),
        });
    }

    return result;
}