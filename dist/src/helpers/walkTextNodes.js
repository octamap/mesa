/*
 * Walks the text nodes of a given parent, allowing you to transform
 * each text node's content with a callback.
 */
export default function walkTextNodes(dom, parent, transform) {
    const document = dom.window.document;
    const NodeFilter = document.defaultView?.NodeFilter; // Access NodeFilter from the document's window
    if (!NodeFilter) {
        throw new Error('NodeFilter is not available');
    }
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
        // Collect text nodes first to avoid modifying them while we walk
        const node = walker.currentNode;
        if (node.nodeType === dom.window.Node.TEXT_NODE) {
            node.nodeValue = transform(node.nodeValue || '');
        }
    }
}
