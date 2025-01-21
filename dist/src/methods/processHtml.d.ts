import ComponentsMap from "../types/ComponentsMap.js";
export default function processHtml(html: string, components: ComponentsMap, options?: {
    injectIds?: boolean;
}): Promise<{
    html: string;
    componentsUsed: string[];
}>;
