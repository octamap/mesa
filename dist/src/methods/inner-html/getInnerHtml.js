/**
 * Extracts the inner HTML from an HTML-like string.
 * @param html The HTML string to parse.
 * @returns The inner HTML or null if there's no inner content.
 */
export default function getInnerHTML(html) {
    // Trim the input string to remove leading/trailing whitespace and newlines
    const trimmedHtml = html.trim();
    // Updated regex to handle tag names with hyphens and colons
    const match = trimmedHtml.match(/^<([a-zA-Z][a-zA-Z0-9\-:]*)\s*([^>]*)>([\s\S]*?)<\/\1\s*>$|^<([a-zA-Z][a-zA-Z0-9\-:]*)\s*([^>]*)\/>$/);
    if (!match) {
        return null; // Invalid or malformed HTML
    }
    // Check if it's a self-closing tag by verifying if group 4 is present
    if (match[4]) {
        return null; // Self-closing tag has no inner HTML
    }
    // Extract the inner content from the third capturing group
    const innerContent = match[3]?.trim();
    return innerContent ? innerContent : null; // Return null if inner content is empty
}
