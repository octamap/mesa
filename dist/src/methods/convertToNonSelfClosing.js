/**
 * Converts specific self-closing tags (e.g. <div />) into non-self-closing tags (<div></div>).
 * Only modifies tags listed in `tags` and leaves all other tags (including self-closing ones like <img />) unchanged.
 *
 * @param originalHtml The HTML string to process.
 * @param tags An array of tag names to convert to non-self-closing form.
 * @returns The modified HTML string.
 */
export default function convertToNonSelfClosing(html, tags) {
    // If there is no "/>" at all, there's no need to proceed
    if (!html.includes("/>"))
        return html;
    // Filter out tags that do not appear at all in the HTML (tiny optimization)
    const tagsInHtml = tags.filter(tag => html.includes(tag));
    if (tagsInHtml.length === 0)
        return html;
    // This "processedHtml" is only used for safe indexing
    // so that "/>" inside quotes doesn't confuse us.
    // We'll do final string replacements on the original HTML.
    let processedHtml = html;
    // 1. Neutralize anything between quotes by replacing it with spaces of the same length.
    //    That way, if "/>" appears inside quotes, it won't be detected as a real self-closing delimiter.
    processedHtml = processedHtml.replace(/(["'`])([^]*?)\1/g, (match, quoteChar, content) => {
        // Keep the starting and ending quote but turn the content into spaces of the same length
        return quoteChar + " ".repeat(content.length) + quoteChar;
    });
    // We'll store all the replacements we want to make: which segment to replace and what text to replace it with.
    // Each item in `replacements` will have the form { start, end, text }:
    // - start, end are indices in the ORIGINAL string (same as processedHtml since length is unchanged).
    // - text is the new text we want to insert in place of [start..end).
    const replacements = [];
    let searchIndex = 0; // We'll move through the document from left to right
    while (true) {
        // Step A: find the next occurrence of one of our target tags, e.g. <div, <span, etc.
        let openingTagIndex = null;
        let openingTag = null;
        for (const tag of tagsInHtml) {
            const idx = processedHtml.indexOf(`<${tag}`, searchIndex);
            // idx != -1 => found
            if (idx !== -1 && (openingTagIndex === null || idx < openingTagIndex)) {
                openingTagIndex = idx;
                openingTag = tag;
            }
        }
        // If we cannot find any more target tags, we are done
        if (openingTagIndex === null)
            break;
        // Step B: look for the "/>" that might close this same tag
        const selfClosingIndex = processedHtml.indexOf("/>", openingTagIndex);
        // If there is no "/>" at all after this tag, we are done
        if (selfClosingIndex === -1)
            break;
        // Step C: check whether there's another "<" before that "/>".
        //         That would indicate a new tag starting before we close this one,
        //         so it’s likely not our direct self-closing for this tag.
        const nextOpeningTag = processedHtml.indexOf("<", openingTagIndex + 1);
        if (nextOpeningTag !== -1 && nextOpeningTag < selfClosingIndex) {
            // There's a different tag opening before we even reach "/>", so skip this one.
            searchIndex = nextOpeningTag; // Move past this intermediate tag
            continue;
        }
        // Step D: At this point, we can be fairly confident that
        //         the substring `<tag ... />` from openingTagIndex..selfClosingIndex+2
        //         belongs to one of the tags we want to convert.
        // We want to replace `/>` with `></tag>`.
        // So we do:
        //   from = selfClosingIndex
        //   to   = selfClosingIndex + 2  (the length of "/>")
        //   text = "></tag>"
        replacements.push({
            start: selfClosingIndex,
            end: selfClosingIndex + 2,
            text: `></${openingTag}>`,
        });
        // Update the search index to continue looking after this closing
        searchIndex = selfClosingIndex + 2;
    }
    // 2. Apply all replacements to the ORIGINAL html in reverse order,
    //    so that index adjustments for earlier replacements do not affect later ones.
    let finalHtml = html;
    for (let i = replacements.length - 1; i >= 0; i--) {
        const { start, end, text } = replacements[i];
        finalHtml = finalHtml.slice(0, start) + text + finalHtml.slice(end);
    }
    return finalHtml;
}
