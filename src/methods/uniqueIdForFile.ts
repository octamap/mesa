
const fileIds: Record<string, string> = {}

export default function uniqueIdForFile(file: string, length: number) {
    const id = fileIds[file]
    if (id) {
        return id; 
    }
    const newId = generateRandomId(length)

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

function generateRandomId(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}