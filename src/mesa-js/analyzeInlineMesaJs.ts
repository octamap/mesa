import variableToString from "../helpers/variableToString.js";
import log from "../log.js";
import Variable from "./types/Variable.js";

export default function analyzeInlineMesaJs(code: string, variables: Variable[]): any | null {
    try {
        // Define a sandbox object that will hold the context for code execution
        const sandbox: Record<string, any> = {};

        // Make sure that the code does not contain any new line characters

        // Preparing the variable declarations from provided variables
        const variableDeclarations = variables.map(variableToString).join("\n");

        // Append variable declarations and the code to execute within a new function
        const executeCode = new Function(
            "sandbox",
            `
        with (sandbox) {
          ${variableDeclarations}

          const returnedMesaValue = (() => ${code})();
          return returnedMesaValue;
        }
    `);

        // Populate sandbox with the variables
        variables.forEach(variable => {
            sandbox[variable.name] = variable.type === 'array' ? variable.elements : variable.value;
        });
        // Execute the code within the sandbox and capture the returned value
        const result = executeCode(sandbox);
        return result
    } catch (error) {
        log(`Error occurred for code:\n${code}\nError:\n${error}`, "error")
        return null;
    }
}