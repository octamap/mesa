declare namespace MesaHMR {
    function save(componentName: string, data: string | null | undefined | Promise<string | null | undefined>, type: "css" | "html" | "js"): void;
    function get(componentName: string, type: "css" | "html" | "js"): Promise<string | null>;
}
export default MesaHMR;
