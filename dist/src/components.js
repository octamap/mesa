import path from "path";
import { fileURLToPath } from "url";
export default function components(metaUrl, components) {
    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);
    for (const [key, value] of Object.entries(components)) {
        components[key] = path.resolve(__dirname, value);
    }
    return components;
}
