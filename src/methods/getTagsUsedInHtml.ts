import ComponentsMap from "../types/ComponentsMap.js";
import getAllTagNames from "./getAllTagNames.js";
import getHtmlForSource from "./getHtmlForSource.js";

let cache: { htmls: string[], tags: Promise<string[]> } | undefined

export default async function getTagsUsedInHtml(newHtmls: string | string[] | ArrayLike<string> | Iterable<string>, components: ComponentsMap) {
    const newHtmlsArray = (() => {
        if (!Array.isArray(newHtmls)) {
            if (typeof newHtmls == "string") {
                newHtmls = [newHtmls]
            } 
        }
        return Array.from(newHtmls)
   })()
    if (cache && cache.htmls.length == newHtmlsArray.length) {
        if (cache.htmls.every((x, index) => x == newHtmlsArray[index])) {
            return cache.tags
        }
    }
    let newTags = (async () => {
        let all = new Set<string>()
        async function iterate(html: string) {
            const tagNames = getAllTagNames(html);
            await Promise.all(tagNames.map(async tag => {
                const component = components[tag]
                if (!component || all.has(tag)) return;
                all.add(tag)
                const innerData = await getHtmlForSource(component)
                if (!innerData) return;
                iterate(innerData)
            }))
        }
        await Promise.all(newHtmlsArray.map(x => iterate(x)))
        return all
    })()
    cache = { htmls: newHtmlsArray, tags: newTags.then(x => Array.from(x)) }
    return cache.tags
}