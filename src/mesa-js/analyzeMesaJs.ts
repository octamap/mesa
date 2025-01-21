import Variable from "./types/Variable.js";



export default function analyzeMesaJs(code: string): Array<Variable> {
    const sandbox: Record<string, any> = {}; // A sandbox to execute the script

    // Regex to find variable declarations (const, let, var) at the top level
    const declarationRegex = /\b(const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;

    code = code.replace(declarationRegex, (_, __, varName) => `this.${varName}`);

    // Create a function to execute the code with the sandbox as its context
    const executeCode = new Function(
        "sandbox",
        `
        const keys = Object.keys(sandbox);
        const predefinedKeys = new Set(Object.getOwnPropertyNames(globalThis));
        for (const key of keys) {
            eval(\`var \${key} = sandbox[key];\`);
        }

        ${code}

        const exported = {};
        const variableNames = Object.getOwnPropertyNames(this);
        for (const name of variableNames) {
            if (!predefinedKeys.has(name)) {
                exported[name] = this[name];
                delete this[name]
            }
        }

        return exported;
    `
    );

    // Execute the code within the sandbox and capture exported variables
    const exportedVars = executeCode(sandbox);


    // Inspect the exported variables to identify arrays and their structure
    const results: Array<Variable> = [];
    for (const key in exportedVars) {
        const value = exportedVars[key];
        if (Array.isArray(value)) {
            results.push({
                type: "array",
                name: key,
                elements: value
            });
        } else if (typeof value === 'string') {
            results.push({
                type: "string",
                name: key,
                value: value
            });
        } else if (typeof value === 'number') {
            results.push({
                type: "number",
                name: key,
                value: value
            });
        } else if (typeof value === 'boolean') {
            results.push({
                type: "boolean",
                name: key,
                value: value
            });
        }
    }
    return results;
}
