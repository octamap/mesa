export default function setHotModuleReloadId(content, id, usedHotModuleIds) {
    // We'll match opening or closing tags, capturing the tag name.
    const tagRegex = /<\/?([a-z][^/\s>]*)[^>]*>/gi;
    let nestingLevel = 0;
    let lastIndex = 0;
    let result = '';
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        // text up to the current tag
        result += content.substring(lastIndex, match.index);
        const fullTag = match[0]; // e.g. "<div>" or "</span>"
        const isClosingTag = fullTag.startsWith('</');
        if (isClosingTag) {
            // closing tag => reduce nesting
            nestingLevel--;
            result += fullTag;
        }
        else {
            // opening or self-closing
            const selfClosing = /\/>$/.test(fullTag.trim());
            // If nesting is 0 before this tag, it's a root-level element
            if (nestingLevel === 0) {
                // Inject mesa-hmr-id right after the tag name
                // We'll do a simple replace to insert the attribute
                const injectedTag = fullTag.replace(/^<([a-zA-Z0-9-]+)(\s|>|$)/, (_, tagName, trailing) => {
                    const timesUsed = usedHotModuleIds.get(id) ?? 0;
                    usedHotModuleIds.set(id, timesUsed + 1);
                    // Ensure trailing space or `>` is handled correctly
                    return `<${tagName} mesa-hmr="${id}${timesUsed === 0 ? '' : `:${timesUsed + 1}`}"${trailing}`;
                });
                result += injectedTag;
            }
            else {
                // not at root, just keep the tag as is
                result += fullTag;
            }
            // Increase nesting if it's not self-closing
            if (!selfClosing) {
                nestingLevel++;
            }
        }
        // Move index after this tag
        lastIndex = tagRegex.lastIndex;
    }
    // Append remaining text after the last match
    result += content.substring(lastIndex);
    return result;
}
