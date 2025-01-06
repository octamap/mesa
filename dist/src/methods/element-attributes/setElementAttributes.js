import getElementAttributes from "./getElementAttributes.js";
export default function setElementAttributes(elementStr, newAttrs) {
    // Regular expression to match the opening tag
    // It captures:
    // 1. The entire opening tag
    // 2. Tag name
    // 3. Attributes string
    // 4. Self-closing slash if present
    const openingTagRegex = /^<\s*([^\s/>]+)([^>]*)\/?>(.*)$/s;
    const match = elementStr.match(openingTagRegex);
    if (!match) {
        // If no opening tag is found, return the original string unmodified
        return elementStr;
    }
    const fullMatch = match[0];
    const tagName = match[1];
    const attributesString = match[2];
    const selfClosing = elementStr.trim().endsWith('/>');
    // Parse existing attributes
    const existingAttrs = getElementAttributes(fullMatch);
    // Merge existing attributes with new attributes
    // New attributes will overwrite existing ones with the same name
    const updatedAttrs = { ...existingAttrs, ...newAttrs };
    // Build the new attributes string
    const attrsArray = [];
    for (const [key, value] of Object.entries(updatedAttrs)) {
        if (value === "") {
            // For boolean attributes or attributes without a value
            attrsArray.push(`${key}`);
        }
        else {
            // Use double quotes for attribute values
            attrsArray.push(`${key}="${value}"`);
        }
    }
    const newAttributesString = attrsArray.length > 0 ? ' ' + attrsArray.join(' ') : '';
    // Reconstruct the opening tag
    const newOpeningTag = selfClosing
        ? `<${tagName}${newAttributesString}/>`
        : `<${tagName}${newAttributesString}>`;
    // Replace the old opening tag with the new one
    const updatedHtml = elementStr.replace(fullMatch, newOpeningTag + match[3]);
    return updatedHtml;
}
