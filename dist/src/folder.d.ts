import ComponentsMap from './types/ComponentsMap.js';
/**
 * Create component for all files of a folder
 * Files within folders (such as folderName/fileName.html) are usuable by doing <folder-name-file-name/>
 * @param relativePath Path relative to the folder
 * @param options.importMetaUrl Needs to be specified if you call this from outside of vite.config.ts
 * @param options.prefix Gets added to the start of the component names. Example <your-prefix-file-name/>. The name of the parent folders of files wont be added to the component name if prefix is specified
 */
export default function folder(relativePath: string, options?: {
    importMetaUrl?: string;
    prefix?: string;
}): ComponentsMap;
