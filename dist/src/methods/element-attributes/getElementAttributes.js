export default function getElementAttributes(elementStr) {
    // Regular expression to match the opening tag
    // It captures:
    // 1. Tag name (e.g., 'element')
    // 2. Attributes string (e.g., ' someProp="value" id="abc"')
    const openingTagRegex = /^<\s*([^\s/>]+)([^>]*)\/?>/;
    const openingTagMatch = elementStr.match(openingTagRegex);
    if (!openingTagMatch) {
        // If no opening tag is found, return an empty object
        return {};
    }
    const attributesString = openingTagMatch[2];
    const attributes = {};
    // Regular expression to match attribute name and value
    // It handles:
    // - Double-quoted values: someProp="value"
    // - Single-quoted values: someProp='value'
    // - Unquoted values: someProp=value
    const attrRegex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let match;
    while ((match = attrRegex.exec(attributesString)) !== null) {
        const attrName = match[1];
        // The value can be in one of the capturing groups 2, 3, or 4
        const attrValue = match[2] || match[3] || match[4] || "";
        attributes[attrName] = attrValue;
    }
    return attributes;
}
