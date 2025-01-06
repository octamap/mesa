export default function getAllTagNames(htmlString) {
    const tagRegex = /<([a-zA-Z0-9\-]+)(\s[^>]*)?\/?>/g;
    const matches = new Set();
    let match;
    while ((match = tagRegex.exec(htmlString)) !== null) {
        matches.add(match[1]);
    }
    return Array.from(matches);
}
