var SyntaxCoding;
(function (SyntaxCoding) {
    function decode(html) {
        return html.replace(/@([\w-]+)=/g, 'data-event-$1=');
    }
    SyntaxCoding.decode = decode;
    function encode(html) {
        return html.replace(/data-event-([\w-]+)=/g, '@$1=');
    }
    SyntaxCoding.encode = encode;
})(SyntaxCoding || (SyntaxCoding = {}));
export default SyntaxCoding;
