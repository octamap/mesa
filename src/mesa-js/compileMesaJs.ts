import SyntaxCoding from "../helpers/SyntaxCoding.js";
import analyzeMesaJs from "./analyzeMesaJs.js";
import findMesaJS from "./findMesaJS.js";
import compileOperators from "./operator-compilers/compileOperators.js";
import removeMesaJs from "./removeMesaJs.js";


function compileNeeded(html: string) {
    if (html.includes("m-") || html.includes("{{")) {
        return true;
    }
    return false;
}

export async function compileMesaJs(html: string) {
    try {
        if (!compileNeeded(html)) {
            return html;
        }
        // Find mesa JS blocks
        const jsBlocks = findMesaJS(html)

        // Remove all mesa js blocks
        html = removeMesaJs(html)

        // Analyze blocks
        const variables = await Promise.all(jsBlocks.flatMap(x => analyzeMesaJs(x)))

        html = SyntaxCoding.decode(html)

        // Compile the for each operators 
        html = await compileOperators(html, variables)

        html = SyntaxCoding.encode(html)

        html = html.replace(/{{\s*(.*?)\s*}}/g, '$1');
        return html
    } catch (error) {
        console.error(error)
        return html
    }
}
