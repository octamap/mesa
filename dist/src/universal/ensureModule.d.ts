import { ViteDevServer } from "vite";
export default function ensureModule(path: string, server: ViteDevServer): Promise<import("vite").ModuleNode>;
