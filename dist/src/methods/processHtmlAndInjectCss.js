import processHtml from "./processHtml.js";
export default async function processHtmlAndInjectCss(html, components, styles, scripts, options) {
    // Process the html
    const response = await processHtml(html, components, { injectIds: options.injectIds });
    html = response.html;
    // Add a style element at the top that contains the styles
    const stylesToImport = [];
    const scriptsToImport = [];
    for (const tag of response.componentsUsed) {
        const script = scripts[tag];
        if (script) {
            scriptsToImport.push(script);
        }
        const style = styles[tag];
        if (style) {
            if (options.injectCssWithComments) {
                stylesToImport.push(`/*start:${tag}*/\n${style}\n/*end:${tag}*/`);
            }
            else {
                stylesToImport.push(style);
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
        }
        else {
            // Add a new <style> block at the top
            const style = `<style mesa>${newStyles}</style>`;
            html = style + "\n" + html;
        }
    }
    if (scriptsToImport.length > 0) {
        const newScripts = scriptsToImport.join(";\n");
        const script = `<script>\n${newScripts}\n</script>`;
        html = script + "\n" + html;
    }
    return html;
}
