import fs from "fs"
import path from "path"

export default function getHtmlFiles(directory: string, excludedDirs: string[]): string[] {
    const htmlFiles: string[] = [];

    function scanDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (excludedDirs.includes(entry.name)) continue;
                scanDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }

    scanDir(directory);
    return htmlFiles;
}