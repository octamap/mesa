export default function traverseElementChildren(element, onChild) {
    for (const child of element.children) {
        onChild(child);
        traverseElementChildren(child, onChild);
    }
}
