import { HtmlTagDescriptor } from "vite";
import * as cheerio from "cheerio"

/**
 * Extracts all <link> and <script> tags from the <body> of an HTML string.
 * @param html - The HTML string to parse.
 * @returns An object containing the modified HTML without the extracted tags and an array of HtmlTagDescriptor objects.
 */
export default function extractLinksAndScriptsOfBody(html: string): { htmlWithoutTags: string, linkAndScriptTags: HtmlTagDescriptor[] } {
    const $ = cheerio.load(html, null, html.includes("<!DOCTYPE"))
    const linkAndScriptTags: HtmlTagDescriptor[] = [];

    // Select all <link> and <script> tags within the <body>
    $('body').find('link, script').each((_, elem) => {
        const tagName = elem.tagName.toLowerCase();

        // Extract attributes
        const attribs = elem.attribs;
        const attrs: Record<string, string | boolean | undefined> = {};

        for (const [key, value] of Object.entries(attribs)) {
            // Boolean attributes in HTML are represented by their presence. If the value is empty or same as the key, set to true.
            if (value === "" || value === key) {
                attrs[key] = true;
            } else {
                attrs[key] = value;
            }
        }

        // Extract children/content for <script> tags
        let children: string | HtmlTagDescriptor[] | undefined = undefined;
        if (tagName === 'script') {
            children = $(elem).html() || '';
        }

        const descriptor: HtmlTagDescriptor = {
            tag: tagName,
            attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
            children: children,
            injectTo: "head"
        };

        linkAndScriptTags.push(descriptor);

        // Remove the tag from the DOM
        $(elem).remove();
    });

    // Get the modified HTML
    const htmlWithoutTags = $.html();

    return { htmlWithoutTags,  linkAndScriptTags };
}