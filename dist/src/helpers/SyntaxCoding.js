var SyntaxCoding;
(function (SyntaxCoding) {
    function decode(html) {
        return html.replace(/@([\w-]+)=/g, 'mesa-data-event-$1=');
    }
    SyntaxCoding.decode = decode;
    function encode(html) {
        return html.replace(/mesa-data-event-([\w-]+)=/g, '@$1=');
    }
    SyntaxCoding.encode = encode;
})(SyntaxCoding || (SyntaxCoding = {}));
export default SyntaxCoding;
