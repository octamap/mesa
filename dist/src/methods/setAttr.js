export default function setAttr(attr, element) {
    const operators = [
        {
            name: "add:",
            handler: (name, currentValue) => {
                if (!currentValue) {
                    element.setAttribute(name, attr.value);
                }
                else {
                    element.setAttribute(name, [currentValue, attr.value].join(" "));
                }
            }
        },
        {
            name: "remove:",
            handler: (name, currentValue) => {
                if (!currentValue) {
                    return;
                }
                let c = currentValue;
                attr.value.split(" ").filter(x => x.length).forEach(x => {
                    c = c.replaceAll(x, "");
                });
                element.setAttribute(name, c);
            }
        }
    ];
    for (const { name, handler } of operators) {
        if (attr.name.startsWith(name) && attr.name.length > name.length) {
            const realName = attr.name.slice(name.length, attr.name.length);
            const currentValue = element.getAttribute(realName);
            handler(realName, currentValue);
            return;
        }
    }
    element.setAttribute(attr.name, attr.value);
}
