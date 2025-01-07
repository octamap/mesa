
export default function splitHtmlAndCss(input: string): [string, string | null] {
    try {
        if (!input.includes("<style>")) return [input, null]
        // Regular expression to match <style> blocks, including multiline content
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let cssParts: string[] = [];
        let match: RegExpExecArray | null;

        // Extract all CSS content from <style> tags
        while ((match = styleRegex.exec(input)) !== null) {
            if (match[1]) {
                cssParts.push(match[1].trim());
            }
        }

        // Combine all CSS parts into one string, separated by newlines
        const css = cssParts.join('\n\n');

        // Remove all <style> blocks from the original input to get the HTML
        const html = input.replace(styleRegex, '').trim();

        return [html, css];
    } catch {
        return [input, null]
    }
}
