import fs from "fs"
import path from "path"

function processInputPath(htmlInputs: Record<string, string>, inputPath: string, name?: string) {
    if (!inputPath.trim().endsWith(".html")) return;
    if (inputPath.startsWith("/")) {
        inputPath = inputPath.slice(1);  // Correct the path before further processing
    }
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    const htmlFileName = path.basename(inputPath, '.html');
    htmlInputs[name || htmlFileName] = resolvedPath;
}

export default function getHtmlInputsOfViteInput(input: any) {
    if (input) {
        if (!input) {
            return { "index": "index.html" };
        }
        let htmlInputs: Record<string, string> = {}
        if (typeof input === "string") {
            processInputPath(htmlInputs, input, "index");
        } else if (Array.isArray(input)) {
            input.forEach(inputPath => processInputPath(htmlInputs, inputPath));
        } else if (typeof input === "object") {
            Object.entries(input).forEach(([name, inputPath]) => {
                if (typeof inputPath == "string") {
                    processInputPath(htmlInputs, inputPath, name)
                }
            });
        }
        return htmlInputs
    } else {
        return { "index": "index.html" }
    }
}