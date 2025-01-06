import fs from "fs";
import path from "path";
export default function getHtmlFiles(directory, excludedDirs) {
    const htmlFiles = [];
    function scanDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (excludedDirs.includes(entry.name))
                    continue;
                scanDir(fullPath);
            }
            else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }
    scanDir(directory);
    return htmlFiles;
}
