declare namespace MesaHMR {
    function save(componentName: string, data: string | null | undefined | Promise<string | null | undefined>, type: "css" | "html"): void;
    function get(componentName: string, type: "css" | "html"): Promise<string | null>;
}
export default MesaHMR;
