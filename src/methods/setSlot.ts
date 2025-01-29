


export default function setSlot(element: Element, newContent: string) {
    const slotBehaviour = element?.getAttribute("m-slot")
    switch (slotBehaviour) {
        case "insertAtStart":
            element.innerHTML = newContent + element.innerHTML
            break;
        case "insertAtEnd":
            element.innerHTML = element.innerHTML + newContent
            break;
        default:
            element.innerHTML = newContent
            break;
    }
}