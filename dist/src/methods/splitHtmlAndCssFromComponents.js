import MesaHMR from "../hmr/MesaHMR.js";
import getHtmForSource from "./getHtmlForSource.js";
import splitHtmlAndCss from "./splitHtmlAndCss.js";
export default async function splitHtmlAndCssFromComponents(components) {
    const componentsWithoutStyle = {};
    const styles = {};
    await Promise.all(Object.entries(components).map(async ([key, source]) => {
        const html = await getHtmForSource(source);
        if (!html) {
            componentsWithoutStyle[key] = source;
            return;
        }
        const [cleanHtml, style] = splitHtmlAndCss(html);
        if (style && style.trim().length > 0) {
            styles[key] = style;
        }
        MesaHMR.save(key, style, "css");
        MesaHMR.save(key, cleanHtml, "html");
        componentsWithoutStyle[key] = { type: "raw", html: cleanHtml };
    }));
    return { componentsWithoutStyle, styles };
}
