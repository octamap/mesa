

export namespace ProcessHtmlCache {

    export const cache = new Map<string, Promise<{ html: string, componentsUsed: string[] }>>()

    export const IsNotModified = new Set<string>() 

}