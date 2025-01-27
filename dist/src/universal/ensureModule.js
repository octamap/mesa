export default async function ensureModule(path, server) {
    const m = server.moduleGraph;
    let module = m.getModuleById(path);
    if (module)
        return module;
    return await m.ensureEntryFromUrl(path);
}
