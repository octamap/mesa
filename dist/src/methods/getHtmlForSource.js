import fs from "fs";
import path from "path";
export default async function getHtmForSource(source) {
    if (typeof source === 'function') {
        const imported = await source();
        return typeof imported === 'string' ? imported : imported.default || '';
    }
    if (typeof source == "object" && source.type == "raw") {
        return source.html;
    }
    const absolutePath = typeof source == "string" ? path.resolve(process.cwd(), source) : source.path;
    if (!fs.existsSync(absolutePath)) {
        return undefined;
    }
    const data = fs.readFileSync(absolutePath, 'utf-8');
    return data;
}
