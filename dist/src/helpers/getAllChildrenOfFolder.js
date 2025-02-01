import fs from 'fs';
import path from 'path';
export default function getAllChildrenOfFolder(dir, visited = new Set()) {
    let results = [];
    const realPath = fs.realpathSync(dir);
    if (visited.has(realPath)) {
        return results; // Avoid infinite loops
    }
    visited.add(realPath);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // Check if the entry is a symbolic link
        if (fs.lstatSync(fullPath).isSymbolicLink()) {
            continue; // Skip symbolic links
        }
        if (entry.isDirectory() && entry.name !== "node_modules") {
            results.push(...getAllChildrenOfFolder(fullPath, visited));
        }
        else {
            results.push(fullPath);
        }
    }
    return results;
}
