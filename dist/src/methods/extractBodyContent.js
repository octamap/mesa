export default function extractBodyContent(html) {
    // Regular expression to match the <body> tag with any attributes and capture its inner content
    const bodyRegex = /<body\b[^>]*>([\s\S]*?)<\/body>/i;
    const match = html.match(bodyRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}
