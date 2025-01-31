/**
 * Converts a valid HTML string into a JavaScript module export statement.
 */
export default function convertHtmlToExport(
    html: string,

): string {
    const quoteType = `"`;
    const useSemicolon = true

    // Validate the quoteType
    if (!['"', "'", '`'].includes(quoteType)) {
        throw new Error(`Invalid quote type: ${quoteType}. Use one of '"', "'", or '\`'.`);
    }

    let escapedHtml: string;

    // For single or double quotes, escape the chosen quote type and backslashes
    escapedHtml = html
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(new RegExp(quoteType, 'g'), `\\${quoteType}`) // Escape the chosen quote
        .replace(/\n/g, '\\n') // Escape newlines
        .replace(/\r/g, '\\r'); // Optionally escape carriage returns

    // Construct the export statement
    const semicolon = useSemicolon ? ';' : '';
    const exportStatement = `export default ${quoteType}${escapedHtml}${quoteType}${semicolon}`;

    return exportStatement;
}