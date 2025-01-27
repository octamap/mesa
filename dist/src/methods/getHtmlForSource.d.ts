import ComponentSource from "../types/ComponentSource.js";
export default function getHtmlForSource(source: ComponentSource, originalSource?: ComponentSource): Promise<{
    path: string | null | undefined;
    data: string;
} | undefined>;
