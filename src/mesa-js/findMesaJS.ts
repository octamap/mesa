

export default function findMesaJS(html: string): string[] {
    // Define the regex to match <script #mesa> blocks
    const scriptRegex = /<script\s+#[^>]*mesa[^>]*>([\s\S]*?)<\/script>/g;

    // Initialize an array to store the script contents
    const scripts: string[] = [];

    // Execute the regex and extract the content of each matching script
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        // match[1] contains the content inside the <script> block
        scripts.push(match[1].trim());
    }

    return scripts;
}