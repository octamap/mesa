import path from 'path';
import processHtml from './methods/processHtml.js';
import splitHtmlAndCssFromComponents from './methods/splitHtmlAndCssFromComponents.js';
import getAllTagNames from './methods/getAllTagNames.js';
import getHtmlFiles from './methods/getHtmlFiles.js';
// Plugin definition
export default function Mesa(components) {
    let cssSplit = splitHtmlAndCssFromComponents(components);
    const VIRTUAL_CSS_ID = 'virtual:mesa.css';
    const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID;
    let viteConfig;
    let lastCssContent;
    let stylesUsedByMain = {};
    return {
        name: 'mesa',
        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
        },
        resolveId(id) {
            if (id === VIRTUAL_CSS_ID) {
                return RESOLVED_VIRTUAL_CSS_ID;
            }
            return null;
        },
        transformIndexHtml: {
            order: "pre",
            async handler(html, { bundle }) {
                const { componentsWithoutStyle, styles } = await cssSplit;
                if (typeof html === 'string') {
                    const tagNames = getAllTagNames(html);
                    for (const tag of tagNames) {
                        const style = styles[tag];
                        if (style) {
                            stylesUsedByMain[tag] = style;
                        }
                    }
                }
                const tags = [];
                if (Object.keys(stylesUsedByMain).length > 0) {
                    tags.push({
                        tag: "link",
                        injectTo: "head",
                        attrs: {
                            rel: "stylesheet",
                            href: `/${VIRTUAL_CSS_ID}`
                        }
                    });
                }
                return {
                    html: await processHtml(html, componentsWithoutStyle),
                    tags
                };
            },
        },
        generateBundle: {
            order: "post",
            async handler(_, bundle) {
                const { componentsWithoutStyle, styles } = await cssSplit;
                // Create the style file for the main index.html
                if (Object.keys(stylesUsedByMain).length > 0) {
                    try {
                        this.emitFile({
                            type: 'asset',
                            fileName: VIRTUAL_CSS_ID,
                            source: Object.values(stylesUsedByMain).join("\n")
                        });
                        console.log(`\n ✅ Styles injected for main files`);
                    }
                    catch (err) {
                        console.error(`\n ❌ Failed to process main HTML entry`, err);
                    }
                }
                // Compile components
                const importedStyles = Object.keys(stylesUsedByMain);
                const unImportedStyles = Object.keys(styles).filter(x => !importedStyles.includes(x));
                for (const [fileName, file] of Object.entries(bundle)) {
                    if (fileName.endsWith('.html')) {
                        try {
                            const html = file.source;
                            if (typeof html !== 'string')
                                continue;
                            file.source = await processHtml(html, componentsWithoutStyle);
                            // Find tag names not used by main entry 
                            const styleOfComponentsToImport = getAllTagNames(html).filter(x => unImportedStyles.includes(x));
                            // Add a style element at the top that contains the styles
                            if (styleOfComponentsToImport.length > 0) {
                                const stylesToImport = [];
                                for (const tag of styleOfComponentsToImport) {
                                    stylesToImport.push(styles[tag]);
                                }
                                const style = `<style>${stylesToImport.join("\n")}</style>`;
                                file.source = style + "\n" + file.source;
                            }
                            console.log(`Transformed build output: ${fileName}`);
                        }
                        catch (err) {
                            console.error(`Failed to transform ${fileName}`, err);
                        }
                    }
                }
                // Check for html files other than index.html were we need to inject styles that have not been imported yet
            },
        },
        async configureServer(server) {
            if (lastCssContent == undefined) {
                lastCssContent = await cssSplit.then(x => Object.values(x.styles).join("\n"));
            }
            server.middlewares.use((req, res, next) => {
                if (req.url === `/${VIRTUAL_CSS_ID}`) {
                    res.setHeader('Content-Type', 'text/css');
                    res.end(lastCssContent);
                    return;
                }
                next();
            });
            const componentFiles = Object.values(components).map((source) => {
                if (typeof source == "string") {
                    return path.resolve(process.cwd(), source);
                }
                else if (typeof source == "object") {
                    return source.type == "absolute" ? source.path : undefined;
                }
            }).filter(x => x != undefined);
            // Watch the component + HTML files, same as in your snippet.
            const htmlFiles = getHtmlFiles(process.cwd(), ['node_modules', '.git', 'dist']);
            const watchedFiles = [...componentFiles, ...htmlFiles];
            const rootDir = viteConfig.root || process.cwd();
            const customIndexPath = viteConfig.build?.rollupOptions?.input || 'index.html';
            const indexHtmlPath = path.resolve(rootDir, typeof customIndexPath == "string" ? customIndexPath : "index.html");
            watchedFiles.forEach((file) => {
                server.watcher.add(file);
            });
            // --- The key middleware: transform any requested .html file (except the index) on the fly ---
            server.middlewares.use(async (req, res, next) => {
                if (req.method !== 'GET' || !req.url?.endsWith('.html')) {
                    return next();
                }
                try {
                    // Create a PassThrough stream to intercept the response
                    const originalWrite = res.write;
                    const originalEnd = res.end;
                    const originalWriteHead = res.writeHead.bind(res);
                    const chunks = [];
                    res.write = function (chunk) {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        return true; // Indicate the write was successful
                    };
                    res.writeHead = function (statusCode, statusMessage, headers) {
                        res.removeHeader('Content-Length');
                        res.setHeader('Transfer-Encoding', 'chunked');
                        return originalWriteHead(statusCode, statusMessage, headers);
                    };
                    res.end = function (chunk, encoding, callback) {
                        if (chunk) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        }
                        const body = Buffer.concat(chunks).toString('utf-8'); // Combine all chunks into a string
                        (async () => {
                            try {
                                const { componentsWithoutStyle, styles } = await cssSplit;
                                let transformedHtml = await processHtml(body, componentsWithoutStyle);
                                // Inject styles for components not included in the main entry
                                const usedTags = getAllTagNames(transformedHtml);
                                const importedStyles = Object.keys(stylesUsedByMain);
                                const unImportedStyles = Object.keys(styles).filter((tag) => !importedStyles.includes(tag));
                                const styleOfComponentsToImport = usedTags.filter((tag) => unImportedStyles.includes(tag));
                                if (styleOfComponentsToImport.length > 0) {
                                    const stylesToInject = styleOfComponentsToImport
                                        .map((tag) => styles[tag])
                                        .join('\n');
                                    transformedHtml = `<style>${stylesToInject}</style>\n${transformedHtml}`;
                                }
                                // Set headers and send the transformed response
                                if (!res.headersSent) {
                                    res.setHeader('Content-Type', 'text/html');
                                }
                                originalWrite.call(res, transformedHtml, encoding, callback);
                                originalEnd.call(res, callback, encoding);
                            }
                            catch (err) {
                                console.error(`Failed to transform ${req.url}`, err);
                                if (!res.headersSent) {
                                    res.setHeader('Content-Type', 'text/html');
                                }
                                // Fallback to the original unprocessed response
                                originalWrite.call(res, body, encoding, callback);
                                originalEnd.call(res, callback, encoding);
                            }
                        })();
                        return res;
                    };
                    next();
                }
                catch (err) {
                    console.error(`Error processing HTML for ${req.url}`, err);
                    next();
                }
            });
            // Watch for changes -> reload, as you already do in your snippet
            server.watcher.on('change', async (file) => {
                const isComponentFile = componentFiles.includes(file);
                const isHtmlFile = htmlFiles.includes(file);
                console.log(`[vite-plugin-mesa] Detected change in ${file}`);
                if (isComponentFile) {
                    // Update CSS split and cached content
                    cssSplit = splitHtmlAndCssFromComponents(components);
                    lastCssContent = Object.values(await cssSplit.then(x => x.styles)).join("\n");
                    console.log(`[vite-plugin-mesa] Component updated: ${file}`);
                    // Notify the browser to update styles via HMR
                    server.ws.send({
                        type: 'update',
                        updates: [{
                                type: 'css-update',
                                path: `/${VIRTUAL_CSS_ID}`,
                                acceptedPath: `/${VIRTUAL_CSS_ID}`,
                                timestamp: Date.now(),
                                explicitImportRequired: false,
                                isWithinCircularImport: false,
                            }]
                    });
                }
                else if (isHtmlFile) {
                    // Only reload the specific HTML file that changed
                    const relativePath = path.relative(viteConfig.root, file);
                    console.log(`[vite-plugin-mesa] HTML file updated: ${relativePath}`);
                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
                else {
                    // Default fallback: full reload for other changes
                    console.log(`[vite-plugin-mesa] Unknown change, performing full reload.`);
                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
            });
        },
    };
}
