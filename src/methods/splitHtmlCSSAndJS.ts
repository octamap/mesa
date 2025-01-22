
export default function splitHtmlCSSAndJS(input: string): [string, string | null, string | null] {
    try {
        if (!input.includes("<style>") || !input.includes("<script")) return [input, null, null]

        // Regular expression to match <style> blocks
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        // Regular expression to match <script> blocks that do not contain the #mesa attribute
        const scriptRegex = /<script(?![^>]*#mesa)[^>]*>([\s\S]*?)<\/script>/gi;

        let cssParts: string[] = [];
        let scriptParts: string[] = [];
        let match: RegExpExecArray | null;

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
        const html = input.replace(styleRegex, '').replace(scriptRegex, '').trim();

        return [html, css, js];
    } catch {
        return [input, null, null]
    }
}
