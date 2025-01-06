import { JSDOM } from 'jsdom';

export default function getAllTagNames(htmlString: string) {
    const tagRegex = /<([a-zA-Z0-9\-]+)(\s[^>]*)?\/?>/g;
    const matches = new Set<string>()
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(htmlString)) !== null) {
        matches.add(match[1]);
    }

    return Array.from(matches);
}
