import processHtml from "./processHtml.js";
export default async function processHtmlAndInjectCss(html, components, styles, options) {
    // Process the html
    const response = await processHtml(html, components, { injectIds: options.injectIds });
    html = response.html;
    // Add a style element at the top that contains the styles
    const stylesToImport = [];
    for (const tag of response.componentsUsed) {
        if (options.skipInjectOfComponents.includes(tag))
            continue;
        const style = styles[tag];
        if (style) {
            if (options.injectCssWithComments) {
                stylesToImport.push(`/*start:${tag}*/\n${styles[tag]}\n/*end:${tag}*/`);
            }
            else {
                stylesToImport.push(styles[tag]);
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
    return html;
}
