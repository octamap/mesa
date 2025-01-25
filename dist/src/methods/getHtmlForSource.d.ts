import ComponentSource from "../types/ComponentSource.js";
export default function getHtmlForSource(source: ComponentSource): Promise<{
    path: null;
    data: string;
} | {
    path: string;
    data: string;
} | undefined>;
