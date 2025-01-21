


export default function traverseElementChildren(element: Element, onChild: (element: Element) => void) {
    for (const child of element.children) {
        onChild(child)
        traverseElementChildren(child, onChild)
    }
}