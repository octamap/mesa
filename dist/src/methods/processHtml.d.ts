import ComponentsMap from "../types/ComponentsMap.js";
import { ViteDevServer } from "vite";
export default function processHtml(html: string, components: ComponentsMap, options?: {
    identifier?: string;
    caller?: string;
    server?: ViteDevServer;
    hasMondo?: boolean;
    originalComponents?: ComponentsMap;
}): Promise<{
    html: string;
    componentsUsed: string[];
}>;
