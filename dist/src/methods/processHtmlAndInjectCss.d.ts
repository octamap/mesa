import ComponentsMap from "../types/ComponentsMap.js";
export default function processHtmlAndInjectCss(html: string, components: ComponentsMap, styles: Record<string, string>, options: {
    skipInjectOfComponents: string[];
}): Promise<string>;
