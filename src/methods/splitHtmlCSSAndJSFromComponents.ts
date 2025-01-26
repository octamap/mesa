import MesaHMR from "../hmr/MesaHMR.js";
import ComponentsMap from "../types/ComponentsMap.js";
import getHtmlForSource from "./getHtmlForSource.js";
import splitHtmlCSSAndJS from "./splitHtmlCSSAndJS.js";

export default async function splitHtmlCSSAndJSFromComponents(components: ComponentsMap) {
    const componentsWithoutStyle: ComponentsMap = {}
    const styles: Record<string, string> = {}
    const scripts: Record<string, string> = {}
    await Promise.all(Object.entries(components).map(async ([key, source]) => {
        const html = await getHtmlForSource(source)
        if (!html) {
            componentsWithoutStyle[key] = source
            return;
        }

        const [cleanHtml, style, js] = splitHtmlCSSAndJS(html.data, html.path)
        if (style && style.trim().length > 0) {
            styles[key] = style
        }
        if (js && js.trim().length > 0) {
            scripts[key] = js
        }
        MesaHMR.save(key, style, "css")
        MesaHMR.save(key, cleanHtml, "html")
        MesaHMR.save(key, js, "js")
        componentsWithoutStyle[key] = { type: "raw", html: cleanHtml }
    }))

    return {componentsWithoutStyle, styles, scripts}
}
