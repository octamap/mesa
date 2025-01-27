/**
 * Converts a valid HTML string into a JavaScript module export statement.
 *
 * @param html - The input HTML string to be exported.
 * @param options - Optional settings for quote type and semicolon usage.
 * @param options.quoteType - The type of quotes to use for the exported string. Can be `"`, `'`, or `` ` ``. Defaults to `"`.
 * @param options.useSemicolon - Whether to append a semicolon at the end of the export statement. Defaults to `true`.
 * @returns A string representing the JavaScript export statement with the HTML content.
 * @throws Will throw an error if an invalid quote type is provided.
 */
export default function convertHtmlToExport(html, options) {
    const quoteType = options?.quoteType || '`';
    const useSemicolon = options?.useSemicolon !== undefined ? options.useSemicolon : true;
    // Validate the quoteType
    if (!['"', "'", '`'].includes(quoteType)) {
        throw new Error(`Invalid quote type: ${quoteType}. Use one of '"', "'", or '\`'.`);
    }
    let escapedHtml;
    if (quoteType === '`') {
        // For backticks, escape backticks and `${` to prevent template literal injection
        escapedHtml = html
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/`/g, '\\`') // Escape backticks
            .replace(/\$\{/g, '\\${'); // Escape ${ to prevent template literals
    }
    else {
        // For single or double quotes, escape the chosen quote type and backslashes
        escapedHtml = html
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(new RegExp(quoteType, 'g'), `\\${quoteType}`); // Escape the chosen quote
    }
    // Construct the export statement
    const semicolon = useSemicolon ? ';' : '';
    const exportStatement = `export default ${quoteType}${escapedHtml}${quoteType}${semicolon}`;
    return exportStatement;
}
