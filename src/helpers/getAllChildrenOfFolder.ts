import fs from 'fs';
import path from 'path';

/**
 * Recursively gets the paths of all files and directories inside a given folder.
 * @param dir The directory to read.
 * @returns An array of absolute paths of all children (files and folders).
 */
export default function getAllChildrenOfFolder(dir: string): string[] {
    let results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name != "node_modules") {
            // If it's a directory, recursively get its children
            results = results.concat(getAllChildrenOfFolder(fullPath));
        } else {
            // If it's a file, add it directly
            results.push(fullPath);
        }
    }

    return results;
}
