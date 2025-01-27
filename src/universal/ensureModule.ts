import { ViteDevServer } from "vite";

export default async function ensureModule(path: string, server: ViteDevServer) {
    const m = server.moduleGraph
    let module = m.getModuleById(path);
    if (module) return module
    return await m.ensureEntryFromUrl(path);
}