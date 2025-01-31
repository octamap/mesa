import convertRelativeToAbsolutePaths from "./convertRelativeToAbsolutePaths.js";
export default function splitHtmlCSSAndJS(input, allTagNames, inputFilePath) {
    try {
        if (!input.includes("<style>") && !input.includes("<script")) {
            if (inputFilePath) {
                input = convertRelativeToAbsolutePaths(input, inputFilePath, allTagNames);
            }
            return [input, null, null];
        }
        let isScriptLinkEncoded = false;
        if (input.includes("<script") && input.includes("src")) {
            input = input.replaceAll(/<script\b([^>]*)\bsrc\s*=\s*(['"])(.*?)\2([^>]*)>(.*?)<\/script>/g, '<mesa-link-script$1src=$2$3$2$4>$5</mesa-link-script>');
            isScriptLinkEncoded = true;
        }
        // Regular expression to match <style> blocks
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        // Regular expression to match <script> blocks that do not contain the #mesa attribute
        const scriptRegex = /<script(?![^>]*#mesa)[^>]*>([\s\S]*?)<\/script>/gi;
        let cssParts = [];
        let scriptParts = [];
        let match;
        // Extract all CSS content from <style> tags
        while ((match = styleRegex.exec(input)) !== null) {
            if (match[1]) {
                cssParts.push(match[1].trim());
            }
        }
        // Extract all JavaScript content from <script> tags, excluding those with #mesa
        while ((match = scriptRegex.exec(input)) !== null) {
            if (match[1]) {
                scriptParts.push(match[1].trim());
            }
        }
        // Combine all CSS parts into one string, separated by newlines
        const css = cssParts.length > 0 ? cssParts.join('\n\n') : null;
        // Combine all JavaScript parts into one string, separated by newlines
        const js = scriptParts.length > 0 ? scriptParts.join('\n\n') : null;
        // Remove all <style> and <script> blocks from the original input to get the HTML
        let html = input.replace(styleRegex, '').replace(scriptRegex, '').trim();
        if (isScriptLinkEncoded) {
            html = html.replaceAll("mesa-link-script", "script");
        }
        if (inputFilePath) {
            html = convertRelativeToAbsolutePaths(html, inputFilePath, allTagNames);
        }
        return [html, css, js];
    }
    catch {
        if (inputFilePath) {
            input = convertRelativeToAbsolutePaths(input, inputFilePath, allTagNames);
        }
        return [input, null, null];
    }
}
