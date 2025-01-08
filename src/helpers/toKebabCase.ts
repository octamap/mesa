

export default function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase or PascalCase
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handle consecutive uppercase letters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/_+/g, '-') // Replace underscores with hyphens
        .toLowerCase(); // Convert to lowercase
}