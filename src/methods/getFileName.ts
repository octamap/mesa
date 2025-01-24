

export default function getFileName(path: string): string {
    // Step 1: Remove query parameters by splitting at '?'
    const pathWithoutQuery = path.split('?')[0];

    // Step 2: Extract the file name by finding the last '/'
    const lastSlashIndex = pathWithoutQuery.lastIndexOf('/');
    const fileWithExtension = lastSlashIndex !== -1
        ? pathWithoutQuery.substring(lastSlashIndex + 1)
        : pathWithoutQuery;

    // Step 3: Remove the file extension by finding the last '.'
    const lastDotIndex = fileWithExtension.lastIndexOf('.');
    const fileName = lastDotIndex !== -1
        ? fileWithExtension.substring(0, lastDotIndex)
        : fileWithExtension;

    return fileName;
}