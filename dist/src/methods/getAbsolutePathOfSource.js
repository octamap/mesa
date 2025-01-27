import fsStatic from 'fs';
import path from 'path';
export default function getAbsolutePathOfSource(source) {
    if (typeof source === 'function') {
        return null;
    }
    if (typeof source == "object" && source.type == "raw") {
        return null;
    }
    const absolutePath = typeof source == "string" ? path.resolve(process.cwd(), source) : source.path;
    if (!fsStatic.existsSync(absolutePath)) {
        return undefined;
    }
    return absolutePath;
}
