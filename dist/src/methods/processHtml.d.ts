import ComponentsMap from "../types/ComponentsMap.js";
import { ViteDevServer } from "vite";
type Options = {
    identifier?: string;
    caller?: string;
    server?: ViteDevServer;
    hasMondo?: boolean;
    originalComponents?: ComponentsMap;
    constructionHash?: string;
    parentPath?: string;
};
export default function processHtml(html: string, components: ComponentsMap, options?: Options): Promise<{
    html: string;
    componentsUsed: string[];
}>;
export {};
