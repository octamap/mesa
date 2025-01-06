import ComponentsMap from "../types/ComponentsMap.js";
export default function splitHtmlAndCssFromComponents(components: ComponentsMap): Promise<{
    componentsWithoutStyle: ComponentsMap;
    styles: Record<string, string>;
}>;
