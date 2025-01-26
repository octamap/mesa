import path from 'path';
import fs from 'fs';
import ComponentSource from './types/ComponentSource.js';
import getAllChildrenOfFolder from './helpers/getAllChildrenOfFolder.js';
import { createNamesForPaths } from './helpers/createNamesForPaths.js';
import ComponentsMap from './types/ComponentsMap.js';
import toKebabCase from './helpers/toKebabCase.js';
import log from './log.js';

function resolvePath(callerPath: string, relativePath: string) {
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
 * Create component for all files of a folder 
 * Files within folders (such as folderName/fileName.html) are usuable by doing <folder-name-file-name/>
 * @param relativePath Path relative to the folder 
 * @param options.importMetaUrl Needs to be specified if you call this from outside of vite.config.ts
 * @param options.prefix Gets added to the start of the component names. Example <your-prefix-file-name/>. The name of the parent folders of files wont be added to the component name if prefix is specified
 */
export default function folder(relativePath: string, options?: { importMetaUrl?: string, prefix?: string }): ComponentsMap {
    const callerPath = options?.importMetaUrl ?? getCallerFile();
    if (!callerPath) {
        throw new Error('Unable to determine caller path');
    }
    const absolutePath = resolvePath(callerPath, relativePath)

    // Get the path to all the children in absolute path, not just direct children but all
    const allChildren = getAllChildrenOfFolder(absolutePath).filter(x => !(x.endsWith(".ts") || x.endsWith(".js")))
    if (allChildren.length == 0) {
        log("Did not find any files in " + relativePath, "warn")
        return {}
    }
    
    // All children with relative path
    const relativeOfAllChildren = allChildren.map(childPath =>
        path.relative(absolutePath, childPath)
    );

    // Map to components
    const prefix = options?.prefix ? toKebabCase(options.prefix) : undefined
    const names = prefix ? relativeOfAllChildren.map(x => {
        let cleanPath = x.replace(/^\/+/, '');
        const parts = cleanPath.split('/')
        const file = parts.pop() || '';
        const ext = path.extname(file);       
        const fileWithoutExt = toKebabCase(path.basename(file, ext)); 
        return `${prefix}-${fileWithoutExt}`
    }) : createNamesForPaths(relativeOfAllChildren)

    // Convert to absolute paths
    const components: Record<string, ComponentSource> = {}
    for (let index = 0; index < names.length; index++) {
        const name = names[index];
        const relativePath = relativeOfAllChildren[index]
        components[name] = {
            type: "absolute",
            path: path.resolve(absolutePath, relativePath)
        }
    }

    if (fs.existsSync(absolutePath)) {
        return components
    } else {
        throw new Error("File does not exist: " + absolutePath)
    }
}