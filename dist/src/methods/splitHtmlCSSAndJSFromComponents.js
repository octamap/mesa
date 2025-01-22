import MesaHMR from "../hmr/MesaHMR.js";
import getHtmForSource from "./getHtmlForSource.js";
import splitHtmlCSSAndJS from "./splitHtmlCSSAndJS.js";
export default async function splitHtmlCSSAndJSFromComponents(components) {
    const componentsWithoutStyle = {};
    const styles = {};
    const scripts = {};
    await Promise.all(Object.entries(components).map(async ([key, source]) => {
        const html = await getHtmForSource(source);
        if (!html) {
            componentsWithoutStyle[key] = source;
            return;
        }
        const [cleanHtml, style, js] = splitHtmlCSSAndJS(html);
        if (style && style.trim().length > 0) {
            styles[key] = style;
        }
        if (js && js.trim().length > 0) {
            scripts[key] = js;
        }
        MesaHMR.save(key, style, "css");
        MesaHMR.save(key, cleanHtml, "html");
        MesaHMR.save(key, js, "js");
        componentsWithoutStyle[key] = { type: "raw", html: cleanHtml };
    }));
    return { componentsWithoutStyle, styles, scripts };
}
