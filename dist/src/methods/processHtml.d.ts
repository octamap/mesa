import ComponentsMap from "../types/ComponentsMap.js";
export default function processHtml(html: string, components: ComponentsMap): Promise<{
    html: string;
    componentsUsed: string[];
}>;
