import ComponentsMap from "../types/ComponentsMap.js";
export default function getTagsUsedInHtml(newHtmls: string | string[] | ArrayLike<string> | Iterable<string>, components: ComponentsMap): Promise<string[]>;
