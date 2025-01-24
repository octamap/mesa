export default function convertExportToHtml(input) {
    // Regular expression to match the pattern and capture the content inside quotes
    const regex = /export\s+default\s+(['"`])([\s\S]*?)\1\s*;?$/;
    const match = input.match(regex);
    if (match && match[2]) {
        const quoteType = match[1]; // The type of quote used (' " `)
        const rawContent = match[2]; // The raw HTML content inside the quotes
        // Reconstruct the quoted string to use JSON.parse for handling escape sequences
        const reconstructedString = `${quoteType}${rawContent}${quoteType}`;
        try {
            // Parse the string to handle any escape sequences
            const parsedString = JSON.parse(reconstructedString);
            return parsedString;
        }
        catch (error) {
            throw new Error("Failed to parse the string content. Ensure it's properly escaped.");
        }
    }
    else {
        throw new Error("Input string does not match the expected pattern: export default \"...\".");
    }
}
