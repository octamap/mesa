import { HtmlTagDescriptor } from "vite";
/**
 * Extracts all <link> and <script> tags from the <body> of an HTML string.
 * @param html - The HTML string to parse.
 * @returns An object containing the modified HTML without the extracted tags and an array of HtmlTagDescriptor objects.
 */
export default function extractLinksAndScriptsOfBody(html: string): {
    htmlWithoutTags: string;
    linkAndScriptTags: HtmlTagDescriptor[];
};
