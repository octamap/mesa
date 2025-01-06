

// Utility function to extract tag name from an HTML string
export default function getTagName(htmlString: string): string | null {
    const match = htmlString.match(/^<\s*([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
}