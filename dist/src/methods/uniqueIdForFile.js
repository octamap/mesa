import createComparisonHash from "./createComparisonHash.js";
const fileIds = {};
export default function uniqueIdForFile(file, length, getContent) {
    const id = fileIds[file];
    if (id) {
        return id;
    }
    const newId = createComparisonHash(getContent());
    // Remove extension and append the new ID
    const split = file.split(".");
    if (split.length === 1) {
        // If no extension, append the ID directly
        return file + "-" + newId;
    }
    // Add the ID before the file extension
    const baseName = split.slice(0, -1).join(".");
    const extension = split[split.length - 1];
    const newFileName = `${baseName}-${newId}.${extension}`;
    // Store the ID for the file
    fileIds[file] = newFileName;
    return newFileName;
}
