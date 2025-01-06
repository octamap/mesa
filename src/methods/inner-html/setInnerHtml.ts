
/**
 * Sets or updates the inner HTML of the first HTML element in the provided HTML string.
 * @param html - The HTML string containing the element.
 * @param newInnerHTML - The new inner HTML to set within the element.
 * @returns A new HTML string with the inner HTML of the first element updated.
 */
export default function setInnerHTML(html: string, newInnerHTML: string): string {
    // Regular expression to match the first HTML element
    // It captures:
    // 1. Tag name
    // 2. Attributes string
    // 3. Inner HTML (if any)
    // 4. Self-closing slash if present
    const elementRegex = /^<\s*([^\s/>]+)([^>]*)>([\s\S]*?)<\/\1\s*>$|^<\s*([^\s/>]+)([^>]*)\/\s*>$/;

    const match = html.match(elementRegex);

    if (!match) {
        // If no valid HTML element is found, return the original string
        return html;
    }

    // Determine if it's a self-closing tag or paired tag
    if (match[4]) {
        // It's a self-closing tag: <tag .../>
        const tagName = match[4];
        const attributes = match[5] || '';

        // Convert to paired tag with new inner HTML
        // Trim attributes and ensure proper spacing
        const trimmedAttributes = attributes.trim();
        const space = trimmedAttributes.length > 0 ? ' ' : '';
        const newElement = `<${tagName}${space}${trimmedAttributes}>${newInnerHTML}</${tagName}>`;

        return newElement;
    } else {
        // It's a paired tag: <tag ...>...</tag>
        const tagName = match[1];
        const attributes = match[2] || '';
        // Replace existing inner HTML with newInnerHTML
        const trimmedAttributes = attributes.trim();
        const space = trimmedAttributes.length > 0 ? ' ' : '';
        const newElement = `<${tagName}${space}${trimmedAttributes}>${newInnerHTML}</${tagName}>`;

        return newElement;
    }
}