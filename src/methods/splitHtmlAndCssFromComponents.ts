import ComponentsMap from "../types/ComponentsMap.js";
import getHtmForSource from "./getHtmlForSource.js";
import splitHtmlAndCss from "./splitHtmlAndCss.js";


export default async function splitHtmlAndCssFromComponents(components: ComponentsMap) {
    const componentsWithoutStyle: ComponentsMap = {}
    const styles: Record<string, string> = {}
    await Promise.all(Object.entries(components).map(async ([key, source]) => {
        const html = await getHtmForSource(source)
        if (!html) {
            componentsWithoutStyle[key] = source
            return;
        }
        const [cleanHtml, style] = splitHtmlAndCss(html)
        if (style && style.trim().length > 0) {
            styles[key] = style
        }
        componentsWithoutStyle[key] = { type: "raw", html: cleanHtml }
    }))
    return {componentsWithoutStyle, styles}
}