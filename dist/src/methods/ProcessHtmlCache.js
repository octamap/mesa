export var ProcessHtmlCache;
(function (ProcessHtmlCache) {
    ProcessHtmlCache.cache = new Map();
    ProcessHtmlCache.IsNotModified = new Set();
})(ProcessHtmlCache || (ProcessHtmlCache = {}));
