import path from 'path';
import fs from 'fs';
import getAllChildrenOfFolder from './helpers/getAllChildrenOfFolder.js';
import { createNamesForPaths } from './helpers/createNamesForPaths.js';
function resolvePath(callerPath, relativePath) {
    let callerDir;
    // Handle file URLs
    if (callerPath.startsWith('file://')) {
        callerDir = path.dirname(new URL(callerPath).pathname);
        // Remove leading slash on Windows
        if (process.platform === 'win32' && callerDir.startsWith('/')) {
            callerDir = callerDir.substring(1);
        }
    }
    else {
        // For normal file paths
        callerDir = path.dirname(callerPath);
    }
    // Resolve the relative path from the caller directory
    const absolutePath = path.resolve(callerDir, relativePath);
    return absolutePath;
}
/**
 * Gets the path of the caller file.
 */
function getCallerFile() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    let callerFile;
    try {
        const err = new Error();
        Error.prepareStackTrace = (err, stack) => stack;
        const stack = err.stack;
        const caller = stack[2];
        const path = caller.getFileName();
        if (!path) {
            throw new Error("Path is null");
        }
        return path;
    }
    catch (e) {
        console.error('Failed to get caller file path:', e);
    }
    finally {
        Error.prepareStackTrace = originalPrepareStackTrace;
    }
    return callerFile || 'unknown';
}
/**
 * Create component for all files of a folder
 * @param relativePath Path relative to the folder
 */
export default function folder(relativePath) {
    const callerPath = getCallerFile();
    if (!callerPath) {
        throw new Error('Unable to determine caller path');
    }
    const absolutePath = resolvePath(callerPath, relativePath);
    // Get the path to all the children in absolute path, not just direct children but all
    const allChildren = getAllChildrenOfFolder(absolutePath);
    if (allChildren.length == 0) {
        console.warn("[ MESA ] - Did not find any files in " + relativePath);
        return {};
    }
    // All children with relative path
    const relativeOfAllChildren = allChildren.map(childPath => path.relative(absolutePath, childPath));
    console.log(relativeOfAllChildren);
    // Map to components
    const namedPaths = createNamesForPaths(relativeOfAllChildren);
    console.log("named paths", namedPaths);
    // Convert to absolute paths
    const components = {};
    for (const [name, relativePath] of Object.entries(namedPaths)) {
        components[name] = {
            type: "absolute",
            path: path.resolve(absolutePath, relativePath)
        };
    }
    if (fs.existsSync(absolutePath)) {
        return components;
    }
    else {
        throw new Error("File does not exist: " + absolutePath);
    }
}
