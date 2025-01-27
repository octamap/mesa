import { ViteDevServer } from "vite";
import ComponentsMap from "../types/ComponentsMap.js";
export default function processHtmlAndInjectCss(html: string, components: ComponentsMap, styles: Record<string, string>, scripts: Record<string, string>, options: {
    skipInjectOfComponents: string[];
    server?: ViteDevServer;
    hasMondo?: boolean;
    originalComponents?: ComponentsMap;
    injectWithComments?: boolean;
}): Promise<{
    html: string;
    componentsUsed: string[];
}>;
