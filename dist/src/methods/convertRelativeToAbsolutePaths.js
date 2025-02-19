import * as cheerio from 'cheerio';
import path from "path";
import convertToNonSelfClosing from './convertToNonSelfClosing.js';
export default function convertRelativeToAbsolutePaths(html, htmlFilePath, allTagNames) {
    if (!((html.includes(`".`) || html.includes("`.") || html.includes("'.")) && (html.includes(`link`) || html.includes("script"))))
        return html;
    html = convertToNonSelfClosing(html, allTagNames);
    const dirPath = path.dirname(htmlFilePath);
    return updateLinks(html, relativePath => {
        return path.join(dirPath, relativePath);
    });
}
function updateLinks(html, updatePath) {
    const $ = cheerio.load(html, null, html.includes("<!DOCTYPE"));
    $('link').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.startsWith(".")) {
            const updatedHref = updatePath(href);
            $(element).attr('href', updatedHref);
        }
    });
    $('script').each((_, element) => {
        const src = $(element).attr('src')?.trim();
        if (src && src.startsWith(".")) {
            $(element).attr('src', updatePath(src));
        }
    });
    return $.html();
}
