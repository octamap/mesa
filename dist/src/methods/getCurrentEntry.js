let currentEntry = undefined;
export default async function getCurrentEntry(server) {
    if (currentEntry)
        return currentEntry;
    currentEntry = new Promise(resolve => {
        const listener = (message) => {
            resolve(message.entry);
            server.ws.off("mesa-entry", listener);
        };
        server.ws.on("mesa-entry", listener);
    });
    server.ws.send({
        type: 'custom',
        event: 'mesa-check-entry'
    });
    const result = await currentEntry;
    setTimeout(() => {
        currentEntry = undefined;
    }, 1000 * 3);
    return result;
}
