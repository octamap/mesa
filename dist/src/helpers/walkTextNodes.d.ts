import { JSDOM } from 'jsdom';
export default function walkTextNodes(dom: JSDOM, parent: Node, transform: (txt: string) => string): void;
