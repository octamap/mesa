import ComponentsMap from "../types/ComponentsMap.js";
export default function processHtmlAndInjectCss(html: string, components: ComponentsMap, styles: Record<string, string>, scripts: Record<string, string>, options: {
    skipInjectOfComponents: string[];
    injectCssWithComments?: boolean;
    injectIds?: boolean;
}): Promise<string>;
