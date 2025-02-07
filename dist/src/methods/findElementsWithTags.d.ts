interface FoundElement {
    tag: string;
    from: number;
    to: number;
}
interface FoundElement {
    tag: string;
    from: number;
    to: number;
    text: string;
}
export default function findElementsWithTags(tags: string[], html: string): FoundElement[];
export {};
