/**
 * Converts specific self-closing tags (e.g. <div />) into non-self-closing tags (<div></div>).
 * Only modifies tags listed in `tags` and leaves all other tags (including self-closing ones like <img />) unchanged.
 *
 * @param originalHtml The HTML string to process.
 * @param tags An array of tag names to convert to non-self-closing form.
 * @returns The modified HTML string.
 */
export default function convertToNonSelfClosing(html: string, tags: string[]): string;
