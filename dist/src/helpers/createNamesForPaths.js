import path from 'path';
/**
 * Convert "/svg/profile.svg" => "svg-profile"
 *         "/check-inbox.html" => "check-inbox"
 */
function slugify(filePath) {
    // 1. Remove any leading slash
    let cleanPath = filePath.replace(/^\/+/, ''); // "svg/profile.svg" or "check-inbox.html"
    // 2. Split into parts
    const parts = cleanPath.split('/'); // ["svg", "profile.svg"] or ["check-inbox.html"]
    // 3. Remove extension from the last part
    const file = parts.pop() || '';
    const ext = path.extname(file); // ".svg" or ".html"
    const fileWithoutExt = path.basename(file, ext); // "profile" or "check-inbox"
    // 4. Rejoin the folder parts (if any) with the file name using '-'
    const slug = parts.length
        ? parts.join('-') + '-' + fileWithoutExt
        : fileWithoutExt;
    return slug;
}
/**
 * Produce an object that looks like:
 * {
 *   "svg-profile": "/svg/profile.svg"
 *   "check-inbox": "/check-inbox.html"
 * }
 */
export function createNamesForPaths(paths) {
    const result = {};
    for (const filePath of paths) {
        const key = slugify(filePath);
        result[key] = filePath;
    }
    return result;
}
