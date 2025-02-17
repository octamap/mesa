export default function findElementsWithTags(tags, html) {
    const results = [];
    // Iterate over each tag to find
    for (const tag of tags) {
        // Construct a regex pattern for the current tag
        const pattern = new RegExp(`(<${tag}(?=[\\s>/])[^>]*?(\\/?)>)|(</${tag}>)`, 'gi');
        // Stack to keep track of opening tag positions
        const stack = [];
        let match;
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
                            text: fullMatch
                        });
                    }
                }
                else {
                    // It's an opening tag
                    stack.push(matchIndex);
                }
            }
            else if (isClosing) {
                // It's a closing tag
                const start = stack.pop();
                if (typeof start === 'number') {
                    // Only record if this closing tag matches the outermost opening tag
                    if (stack.length === 0) {
                        const end = matchIndex + fullMatch.length;
                        results.push({
                            tag,
                            from: start,
                            to: matchIndex + fullMatch.length,
                            text: html.slice(start, end)
                        });
                    }
                }
            }
        }
    }
    // Sort by starting index
    results.sort((a, b) => a.from - b.from);
    // Remove nested elements
    const filteredResults = [];
    let currentParent = null;
    for (const element of results) {
        if (!currentParent || element.from > currentParent.to) {
            // Not nested, add to results
            filteredResults.push(element);
            currentParent = element;
        }
    }
    return filteredResults;
}
