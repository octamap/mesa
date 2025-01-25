import ComponentSource from "../types/ComponentSource.js";
import fs from "fs"
import path from "path"

export default async function getHtmlForSource(source: ComponentSource) {
    if (typeof source === 'function') {
        const imported = await source();
        return { path: null, data: typeof imported === 'string' ? imported : imported.default || '' };
    }
    if (typeof source == "object" && source.type == "raw") {
        return { path: null, data: source.html }
    }
    const absolutePath = typeof source == "string" ? path.resolve(process.cwd(), source) : source.path
    if (!fs.existsSync(absolutePath)) {
        return undefined;
    }
    const data = fs.readFileSync(absolutePath, 'utf-8');
    return { path: absolutePath, data }
}