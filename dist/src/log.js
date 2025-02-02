import DebugMode from './DebugMode.js';
import logText from './logText.js';
export default function log(text, type) {
    const methods = { "warn": console.warn, "error": console.error, "debug": console.log };
    const method = type ? methods[type] : console.log;
    const suffix = (() => {
        switch (type) {
            case "error":
                return " ❌ -";
            case "warn":
                return " ❓ -";
        }
        return "";
    })();
    if (!DebugMode.Enabled && type == "debug")
        return;
    method(logText(`${suffix}${text}`));
}
