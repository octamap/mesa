export default function getAttributesOfChildElements(parent) {
    const result = [];
    for (const child of Array.from(parent.children)) {
        result.push({
            tagName: child.tagName.toLowerCase(),
            innerHtml: child.innerHTML,
            attributes: Array.from(child.attributes),
        });
    }
    return result;
}
