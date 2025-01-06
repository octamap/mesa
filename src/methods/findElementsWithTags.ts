
interface FoundElement {
    tag: string;
    from: number;
    to: number;
}
interface FoundElement {
    tag: string;
    from: number;
    to: number;
}

export default function findElementsWithTags(
    tags: string[],
    html: string
): FoundElement[] {
    const results: FoundElement[] = [];

    // Iterate over each tag to find
    for (const tag of tags) {
        // Construct a regex pattern for the current tag
        const pattern = new RegExp(
            `(<${tag}[^>]*?(/)?>)|(</${tag}>)`,
            'gi'
        );

        // Stack to keep track of opening tag positions
        const stack: number[] = [];

        let match: RegExpExecArray | null;

        // Loop through all matches for the current tag
        while ((match = pattern.exec(html)) !== null) {
            const fullMatch = match[0];
            const matchIndex = match.index;

            // Regex groups:
            // match[1] - Opening tag or self-closing tag
            // match[2] - "/" if it's a self-closing tag
            // match[3] - Closing tag
            const isOpeningOrSelfClosing = !!match[1];
            const isSelfClosing = match[2] === '/';
            const isClosing = !!match[3];

            if (isOpeningOrSelfClosing) {
                if (isSelfClosing) {
                    // Only record self-closing tags if not nested
                    if (stack.length === 0) {
                        results.push({
                            tag,
                            from: matchIndex,
                            to: matchIndex + fullMatch.length,
                        });
                    }
                } else {
                    // It's an opening tag
                    stack.push(matchIndex);
                }
            } else if (isClosing) {
                // It's a closing tag
                const start = stack.pop();
                if (typeof start === 'number') {
                    // Only record if this closing tag matches the outermost opening tag
                    if (stack.length === 0) {
                        results.push({
                            tag,
                            from: start,
                            to: matchIndex + fullMatch.length,
                        });
                    }
                }
            }
        }
    }

    // Sort the results by their starting index to maintain source order
    return results.sort((a, b) => a.from - b.from);
}