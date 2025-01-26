import * as cheerio from 'cheerio';
import path from "path"

export default function convertRelativeToAbsolutePaths(html: string, htmlFilePath: string) {
    if (!html.includes(`rel="texts`) || !html.includes("src=")) return html;
    const dirPath = path.dirname(htmlFilePath)
    return updateLinks(html, relativePath => {
        return path.join(dirPath, relativePath)
    })
}

function updateLinks(html: string, updatePath: (href: string) => string): string {
    const $ = cheerio.load(html, null, false);
    $('link[rel="texts"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            const updatedHref = updatePath(href);
            $(element).attr('href', updatedHref);
        }
    });

    $('script[type="module"]').each((_, element) => {
        const src = $(element).attr('src')?.trim();
        if (src && src.startsWith(".")) {
            $(element).attr('src', updatePath(src));
        }
    });

    return $.html();
}
