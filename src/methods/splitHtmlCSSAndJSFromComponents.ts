import MesaHMR from "../hmr/MesaHMR.js";
import ComponentsMap from "../types/ComponentsMap.js";
import getHtmlForSource from "./getHtmlForSource.js";
import splitHtmlCSSAndJS from "./splitHtmlCSSAndJS.js";
import * as cheerio from "cheerio"
import path from "path"

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
        if (html.path) {
            html.data = resolveTextLinks(html.data, html.path)
        }

        const [cleanHtml, style, js] = splitHtmlCSSAndJS(html.data)
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

function resolveTextLinks(html: string, htmlFilePath: string) {
    if (!html.includes(`rel="texts`)) return html;
    const dirPath = path.dirname(htmlFilePath)
    return updateTextLinks(html, href => {
        return path.join(dirPath, href)
    })
}

function updateTextLinks(html: string, updateHref: (href: string) => string): string {
    const $ = cheerio.load(html);
    $('link[rel="texts"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href) {
            const updatedHref = updateHref(href);
            $(element).attr('href', updatedHref);
        }
    });

    return $.html();
}
