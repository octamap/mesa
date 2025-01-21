var MesaHMR;
(function (MesaHMR) {
    let cache = new Map();
    function save(componentName, data, type) {
        if (!data) {
            cache.delete(type + "::" + componentName);
            return;
        }
        cache.set(type + "::" + componentName, data);
    }
    MesaHMR.save = save;
    async function get(componentName, type) {
        return (async () => {
            const cached = await cache.get(type + "::" + componentName);
            return cached ?? null;
        })();
    }
    MesaHMR.get = get;
})(MesaHMR || (MesaHMR = {}));
export default MesaHMR;
