import { ViteDevServer } from "vite";
import ComponentsMap from "../types/ComponentsMap.js";
import processHtml from "./processHtml.js";


export default async function processHtmlAndInjectCss(
    html: string,
    components: ComponentsMap,
    styles: Record<string, string>,
    scripts: Record<string, string>,
    options: { identifier?: string, caller?: string, skipInjectOfComponents: string[], server?: ViteDevServer, hasMondo?: boolean, originalComponents?: ComponentsMap, injectWithComments?: boolean }) {
    
    // Process the html
    const response = await processHtml(html, components, {...options});
    html = response.html

    // Add a style element at the top that contains the styles
    const stylesToImport: string[] = []
    const scriptsToImport: string[] = []
    for (const tag of response.componentsUsed) {
        let script = scripts[tag]
        if (script) {
            if (options.injectWithComments) {
                script = `/*start:${tag}*/\n${script}\n/*end:${tag}*/`
            }
            scriptsToImport.push(script)
        }
        const style = styles[tag]
        if (style) {
            if (options.injectWithComments) {
                stylesToImport.push(`/*start:${tag}*/\n${style}\n/*end:${tag}*/`)
            } else {
                stylesToImport.push(style)
            }
        }
    }
    if (stylesToImport.length > 0) {
        const newStyles = stylesToImport.join("\n");

        // Check if there's an existing <style> block
        const styleRegex = /<style>([\s\S]*?)<\/style>/i;
        const match = html.match(styleRegex);

        if (match) {
            // Append new styles to the existing <style> block
            const existingStyles = match[1];
            const updatedStyles = `${existingStyles}\n${newStyles}`;
            html = html.replace(styleRegex, `<style mesa>${updatedStyles}</style>`);
        } else {
            // Add a new <style> block at the top
            const style = `<style mesa>${newStyles}</style>`;
            html = style + "\n" + html;
        }
    }
    if (scriptsToImport.length > 0) {
        const newScripts = scriptsToImport.join(";\n")
        const script = `<script mesa-inline>\n${newScripts}\n</script>`
        html = script + "\n" + html
    }
    return {...response, html}
}