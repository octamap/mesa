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
export default function convertHtmlToExport(html: string, options?: {
    quoteType?: '"' | "'" | '`';
    useSemicolon?: boolean;
}): string;
