export declare namespace ProcessHtmlCache {
    const cache: Map<string, Promise<{
        html: string;
        componentsUsed: string[];
    }>>;
    const IsNotModified: Set<string>;
}
