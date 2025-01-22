import ComponentsMap from "../types/ComponentsMap.js";
export default function splitHtmlCSSAndJSFromComponents(components: ComponentsMap): Promise<{
    componentsWithoutStyle: ComponentsMap;
    styles: Record<string, string>;
    scripts: Record<string, string>;
}>;
