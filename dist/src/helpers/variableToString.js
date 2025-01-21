export default function variableToString(variable) {
    switch (variable.type) {
        case "array":
            return `let ${variable.name} = ${JSON.stringify(variable.elements)};`;
        case "string":
            // For strings, ensure to escape and wrap the value in quotes
            return `let ${variable.name} = "${variable.value.replace(/"/g, '\\"')}";`;
        case "number":
            // For numbers, output directly
            return `let ${variable.name} = ${variable.value};`;
        case "boolean":
            // For booleans, output directly as well
            return `let ${variable.name} = ${variable.value};`;
        default:
            throw new Error("Unsupported variable type");
    }
}
