

namespace MesaHMR {

    let cache = new Map<string, string | Promise<string | undefined | null>>()

    export function save(componentName: string, data: string | null | undefined | Promise<string | null | undefined>, type: "css" | "html") {
        if (!data) {
            cache.delete(type + "::" + componentName)
            return;
        } 
        cache.set(type + "::" + componentName, data)
    }
    
    export async  function get(componentName: string, type: "css" | "html") {
        return (async () => {
            const cached = await cache.get(type + "::" + componentName)
            return cached ?? null
        })()
    }

}

export default MesaHMR