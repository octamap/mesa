import path from "path"
import { fileURLToPath } from "url";
import ComponentsMap from "./types/ComponentsMap.js";

export default function components(metaUrl: string, components: Record<string, string>) : ComponentsMap {
    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);
    for (const [key, value] of Object.entries(components)) {
        components[key] = path.resolve(__dirname, value)
    }
    return components
}