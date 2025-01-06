import path from "path";
import { URL } from "url";
export default function getFolderPath(filePath) {
    let folderPath;
    try {
        if (filePath.startsWith('file://')) {
            // Handle file URL
            const url = new URL(filePath);
            folderPath = path.dirname(url.pathname);
            // On Windows, URL paths start with a '/'
            if (process.platform === 'win32' && folderPath.startsWith('/')) {
                folderPath = folderPath.substring(1);
            }
        }
        else {
            // Handle normal file system path
            folderPath = path.dirname(filePath);
        }
    }
    catch (error) {
        throw new Error(`Invalid file path: ${filePath}`);
    }
    return folderPath;
}
