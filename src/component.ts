import path from 'path';
import fs from 'fs';
import ComponentSource from './types/ComponentSource.js';

function resolvePath(callerPath: string , relativePath: string) {
    let callerDir;

    // Handle file URLs
    if (callerPath.startsWith('file://')) {
        callerDir = path.dirname(new URL(callerPath).pathname);

        // Remove leading slash on Windows
        if (process.platform === 'win32' && callerDir.startsWith('/')) {
            callerDir = callerDir.substring(1); 
        }
    } else {
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
function getCallerFile(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    let callerFile: string | undefined;

    try {
        const err = new Error();
        Error.prepareStackTrace = (err, stack) => stack;
        const stack = err.stack as unknown as NodeJS.CallSite[];

        console.log(stack.map(x => x.getFileName()))
        const caller = stack[2]
        const path = caller.getFileName()
        if (!path) {
            throw new Error("Path is null")
        }
        return path
    } catch (e) {
        console.error('Failed to get caller file path:', e);
    } finally {
        Error.prepareStackTrace = originalPrepareStackTrace;
    }

    return callerFile || 'unknown';
}

/**
 * Example component function
 * @param relativePath Path relative to the caller file
 */
export default function component(relativePath: string) : ComponentSource  {
    const callerPath = getCallerFile();
    if (!callerPath) {
        throw new Error('Unable to determine caller path');
    }
    const absolutePath = resolvePath(callerPath, relativePath) 
    if (fs.existsSync(absolutePath)) {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        return {
            type: "absolute",
            path: absolutePath
        }
    } else {
        throw new Error("File does not exist: " + absolutePath)
    }
}