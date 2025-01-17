

namespace SyntaxCoding {

    export function decode(html: string) {
        return html.replace(/@([\w-]+)=/g, 'data-event-$1=');
    }

    export function encode(html: string) {
        return html.replace(/data-event-([\w-]+)=/g, '@$1=');
    }
}

export default SyntaxCoding