import fs from "fs";
import path from "path";
function absolutePathFor(source) {
    if (typeof source === 'function' || (typeof source == "object" && source.type == "raw")) {
        return null;
    }
    const absolutePath = typeof source == "string" ? path.resolve(process.cwd(), source) : source.path;
    if (!fs.existsSync(absolutePath)) {
        return undefined;
    }
    return absolutePath;
}
export default async function getHtmlForSource(source, originalSource) {
    if (typeof source === 'function') {
        const imported = await source();
        return {
            path: originalSource ? absolutePathFor(originalSource) : undefined,
            data: typeof imported === 'string' ? imported : imported.default || ''
        };
    }
    if (typeof source == "object" && source.type == "raw") {
        return {
            path: originalSource ? absolutePathFor(originalSource) : undefined,
            data: source.html
        };
    }
    const absolutePath = typeof source == "string" ? path.resolve(process.cwd(), source) : source.path;
    if (!fs.existsSync(absolutePath)) {
        return undefined;
    }
    const data = fs.readFileSync(absolutePath, 'utf-8');
    return { path: absolutePath, data };
}
