import SyntaxCoding from "../helpers/SyntaxCoding.js";
import analyzeMesaJs from "./analyzeMesaJs.js";
import findMesaJS from "./findMesaJS.js";
import forOperatorCompile from "./operator-compilers/forOperatorCompile.js";
import removeMesaJs from "./removeMesaJs.js";
export default async function compileMesaJs(html) {
    try {
        // Find mesa JS 
        const jsBlocks = findMesaJS(html);
        if (jsBlocks.length == 0)
            return html;
        // Remove all mesa js blocks
        html = removeMesaJs(html);
        // Analyze
        const variables = await Promise.all(jsBlocks.flatMap(x => analyzeMesaJs(x)));
        if (!variables.length)
            return html;
        html = SyntaxCoding.decode(html);
        // Compile the for each operators 
        html = forOperatorCompile(html, variables);
        html = SyntaxCoding.encode(html);
        return html;
    }
    catch (error) {
        console.error(error);
        return html;
    }
}
