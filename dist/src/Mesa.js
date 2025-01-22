import fsPromises from 'fs/promises';
import path from 'path';
import processHtml from './methods/processHtml.js';
import splitHtmlCSSAndJSFromComponents from './methods/splitHtmlCSSAndJSFromComponents.js';
import fs from "fs";
import getHtmlFiles from './methods/getHtmlFiles.js';
import processHtmlAndInjectCss from './methods/processHtmlAndInjectCss.js';
import getTagsUsedInHtml from './methods/getTagsUsedInHtml.js';
import { compileMesaJs } from './mesa-js/compileMesaJs.js';
import log from './log.js';
import getHtmlInputsOfViteInput from './universal/getHtmlInputsOfViteInput.js';
import MesaHMR from './hmr/MesaHMR.js';
import splitHtmlCSSAndJS from './methods/splitHtmlCSSAndJS.js';
import { fileURLToPath } from 'url';
import ora from 'ora';
import logText from './logText.js';
export default function Mesa(componentsSource) {
    let components = typeof componentsSource == "object" ? componentsSource : componentsSource();
    let cssSplit = Promise.resolve({ componentsWithoutStyle: {}, styles: {}, scripts: {} });
    const VIRTUAL_CSS_ID = 'mesa.css';
    const HMR_HANDLER_ID = 'virtual:mesa-hmr.js';
    const RESOLVED_HMR_HANDLER_ID = '\0' + HMR_HANDLER_ID;
    let viteConfig;
    let mainHtmls = new Map();
    const entryHtmlFiles = new Set();
    let isDev = false;
    async function processAndInjectCss(html) {
        const { componentsWithoutStyle, styles, scripts } = await cssSplit;
        const tagsUsedInMain = mainHtmls ? await getTagsUsedInHtml(mainHtmls.values(), componentsWithoutStyle) : [];
        html = await processHtmlAndInjectCss(html, componentsWithoutStyle, styles, scripts, {
            skipInjectOfComponents: tagsUsedInMain,
            injectCssWithComments: isDev,
            injectIds: isDev
        });
        return await compileMesaJs(html);
    }
    return {
        name: 'mesa',
        async configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
            isDev = viteConfig.command !== 'build';
            cssSplit = splitHtmlCSSAndJSFromComponents(components);
            Object.values(getHtmlInputsOfViteInput(viteConfig.build.rollupOptions.input)).forEach(x => {
                entryHtmlFiles.add(x);
            });
            // Set mainHtmls so that transformIndexHtml gets the correct tags when calling getTagsUsedInHtml 
            for (const entryHtmlFile of entryHtmlFiles) {
                if (fs.existsSync(entryHtmlFile)) {
                    mainHtmls.set(path.relative(process.cwd(), entryHtmlFile), fs.readFileSync(entryHtmlFile, 'utf-8'));
                }
            }
        },
        resolveId(id) {
            if (id.endsWith(VIRTUAL_CSS_ID)) {
                const filename = id.slice(0, id.length - VIRTUAL_CSS_ID.length);
                return filename + "_" + VIRTUAL_CSS_ID;
            }
            if (id === HMR_HANDLER_ID) {
                return RESOLVED_HMR_HANDLER_ID;
            }
            return null;
        },
        async load(id) {
            const components = id.split("/").filter(x => x.length);
            if (components.length > 0) {
                const lastComponent = components[components.length - 1].normalize("NFC");
                const indexOfMesaCss = lastComponent.indexOf("_mesa.css");
                if (indexOfMesaCss != -1) {
                    const { styles, componentsWithoutStyle } = await cssSplit;
                    // Identify the filename 
                    const filename = lastComponent.slice(0, indexOfMesaCss);
                    const html = Array.from(mainHtmls.entries()).find(x => {
                        return x[0].endsWith(`${filename}.html`);
                    })?.[1];
                    const tagsUsedInMain = html ? await getTagsUsedInHtml(html, componentsWithoutStyle) : [];
                    let stylesUsedInMain = [];
                    for (const tag of tagsUsedInMain) {
                        const style = styles[tag];
                        if (style) {
                            stylesUsedInMain.push(style);
                        }
                    }
                    return Object.values(stylesUsedInMain).join("\n");
                }
            }
            if (id.normalize("NFC").startsWith(`/${HMR_HANDLER_ID.normalize("NFC")}`)) {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const cssHmrUpdaterPath = path.resolve(__dirname, 'assets/ClientHMRHandler.js');
                const cssHmrUpdater = fs.readFileSync(cssHmrUpdaterPath, 'utf-8');
                return cssHmrUpdater;
            }
        },
        transformIndexHtml: {
            async handler(html, p) {
                mainHtmls.set(p.path, html);
                const tagsUsedInHtml = await getTagsUsedInHtml(html, components);
                const tagsInMainHasStyle = Object.keys((await cssSplit).styles).some(x => tagsUsedInHtml.includes(x));
                const scriptsToInject = Object.entries((await cssSplit).scripts).filter(([key]) => tagsUsedInHtml.includes(key));
                const tags = [];
                if (tagsInMainHasStyle) {
                    // Remove extension
                    let filenameExcludingExtension = p.filename.split(".")[0];
                    tags.push({
                        tag: "link",
                        injectTo: "head",
                        attrs: {
                            rel: "stylesheet",
                            href: `${filenameExcludingExtension}_${VIRTUAL_CSS_ID}`
                        }
                    });
                }
                if (scriptsToInject.length) {
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        children: `${scriptsToInject.map(x => x[1]).join(";\n")}`
                    });
                }
                if (isDev) {
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        attrs: {
                            type: "module",
                            src: `/${HMR_HANDLER_ID}`
                        }
                    });
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        children: `\"${p.path}\"`,
                        attrs: {
                            "mesa-hmr-route": "",
                        }
                    });
                }
                const { componentsWithoutStyle } = await cssSplit;
                html = await processHtml(html, componentsWithoutStyle, { injectIds: isDev }).then(x => x.html);
                html = await compileMesaJs(html);
                return {
                    html,
                    tags
                };
            },
        },
        async transform(code, id) {
            if (!id.endsWith(".html"))
                return;
            // Skip id if its a entry html 
            if (entryHtmlFiles.has(id)) {
                return;
            }
            const html = await processAndInjectCss(code);
            return {
                code: html,
            };
        },
        generateBundle: {
            order: "post",
            async handler(_) {
                const { styles, componentsWithoutStyle } = await cssSplit;
                const tagsUsedInMain = mainHtmls ? await getTagsUsedInHtml(mainHtmls.values(), componentsWithoutStyle) : [];
                let stylesUsedInMain = [];
                for (const tag of tagsUsedInMain) {
                    const style = styles[tag];
                    if (style) {
                        stylesUsedInMain.push(style);
                    }
                }
                // Create the style file for the main index.html
                if (Object.keys(tagsUsedInMain).length > 0) {
                    try {
                        this.emitFile({
                            type: 'asset',
                            fileName: VIRTUAL_CSS_ID,
                            source: Object.values(stylesUsedInMain).join("\n")
                        });
                        log(`\n ✅ Styles injected for main files`);
                    }
                    catch (err) {
                        log(`\n ❌ Failed to process main HTML entry`, "error");
                        console.error(err);
                    }
                }
                let spinner = ora(logText("🔄 Processing bundle...")).start();
                const distDir = viteConfig.build?.outDir || 'dist'; // Default Vite output directory
                // Ensure output folder exists
                if (!fs.existsSync(distDir)) {
                    log('⚠️ Build directory does not exist. Skipping post-processing.', "warn");
                    return;
                }
                const processHtmlFiles = async (dir) => {
                    const children = await fsPromises.readdir(dir);
                    await Promise.all(children.map(async (file) => {
                        const filePath = path.join(dir, file);
                        if ((await fsPromises.stat(filePath)).isDirectory()) {
                            await processHtmlFiles(filePath);
                        }
                        else if (filePath.endsWith('.html')) {
                            let html = await fsPromises.readFile(filePath, 'utf-8');
                            this.emitFile({
                                type: "asset",
                                fileName: path.relative(distDir, filePath),
                                source: await processAndInjectCss(html)
                            });
                        }
                    }));
                };
                // Start processing
                await processHtmlFiles(distDir);
                spinner.succeed("Bundle fully processed");
            },
        },
        async handleHotUpdate(ctx) {
            const { file, read, server } = ctx;
            // Check if the file is a CSS or HTML file (or whatever file defines styles for components)
            if (file.endsWith('.html')) {
                // Check if we have this component 
                const componentName = Object.entries(components).find(([key, value]) => {
                    if (typeof value == "object") {
                        if (value.type == "absolute" && value.path == file) {
                            return true;
                        }
                    }
                })?.[0];
                if (componentName) {
                    const oldHtml = await MesaHMR.get(componentName, "html");
                    const oldCss = await MesaHMR.get(componentName, "css");
                    const newHtmlAndCss = (async () => {
                        const [html, css] = splitHtmlCSSAndJS(await read());
                        const resolvedCssSplit = await cssSplit;
                        resolvedCssSplit.componentsWithoutStyle[componentName] = { type: "raw", html };
                        if (css) {
                            resolvedCssSplit.styles[componentName] = css;
                        }
                        else {
                            delete resolvedCssSplit.styles[componentName];
                        }
                        return [html, css];
                    })();
                    MesaHMR.save(componentName, newHtmlAndCss.then(x => x[1]), "css");
                    MesaHMR.save(componentName, newHtmlAndCss.then(x => x[0]), "html");
                    const newCss = await newHtmlAndCss.then(x => x[1]);
                    const newHtml = await newHtmlAndCss.then(x => x[0]);
                    if (oldCss != newCss) {
                        server.ws.send({
                            type: 'custom',
                            event: 'mesa-style-update',
                            data: {
                                componentName,
                                style: newCss,
                            },
                        });
                        return []; // Prevent full reload
                    }
                    if (newHtml == oldHtml)
                        return;
                }
            }
            server.ws.send({
                type: 'full-reload',
                path: '*',
            });
        },
        async configureServer(server) {
            // --- The key middleware: transform any requested .html file (except the index) on the fly ---
            server.middlewares.use(async (req, res, next) => {
                if (req.method !== 'GET' || !req.url?.endsWith('.html')) {
                    return next();
                }
                delete req.headers['if-modified-since'];
                delete req.headers['if-none-match'];
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
                    function setHeaders(res) {
                        res.removeHeader('Content-Length');
                        res.removeHeader('ETag');
                        res.removeHeader("Last-Modified");
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Expires', '0');
                        res.setHeader('Surrogate-Control', 'no-store');
                        res.setHeader('Transfer-Encoding', 'chunked');
                        res.setHeader('Content-Type', 'text/html');
                    }
                    res.writeHead = function (statusCode, statusMessage, headers) {
                        setHeaders(res);
                        return originalWriteHead(statusCode == 304 ? 200 : statusCode, statusMessage, headers);
                    };
                    res.end = function (chunk, encoding, callback) {
                        if (chunk) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        }
                        let body = Buffer.concat(chunks).toString('utf-8'); // Combine all chunks into a string
                        (async () => {
                            try {
                                const html = await processAndInjectCss(body);
                                // Set headers and send the transformed response
                                if (!res.headersSent) {
                                    setHeaders(res);
                                }
                                originalWrite.call(res, html, encoding, callback);
                                originalEnd.call(res, callback, encoding);
                            }
                            catch (err) {
                                log(`Failed to transform ${req.url}`);
                                console.error(err);
                                if (!res.headersSent) {
                                    setHeaders(res);
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
                    log(`Error processing HTML for ${req.url}`, "error");
                    console.error(err);
                    next();
                }
            });
            let debounceTimeout;
            function reload(reloadCss) {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(async () => {
                    if (reloadCss) {
                        cssSplit = splitHtmlCSSAndJSFromComponents(components);
                    }
                    server.ws.send({
                        type: 'full-reload',
                        path: '*',
                    });
                }, 300);
            }
            function isSame(old, newMap) {
                const oldKeys = Object.keys(old);
                const newKeys = Object.keys(newMap);
                if (oldKeys.length != newKeys.length) {
                    return false;
                }
                for (const key of oldKeys) {
                    const oldValue = old[key];
                    const newValue = newMap[key];
                    if (typeof newValue == "string") {
                        if (oldValue != newValue) {
                            return false;
                        }
                    }
                    if (typeof newValue == "object") {
                        if (typeof oldValue != "object")
                            return false;
                        if (newValue.type == "absolute" && oldValue.type == "absolute" && newValue.path == oldValue.path) {
                            continue;
                        }
                        else if (newValue.type == "raw" && oldValue.type == "raw" && newValue.html == oldValue.html) {
                            continue;
                        }
                        return false;
                    }
                }
                return true;
            }
            function reloadComponents() {
                if (typeof componentsSource == "function") {
                    let oldComponents = { ...components };
                    components = componentsSource();
                    if (isSame(oldComponents, components))
                        return;
                    reload(true);
                    // Reload file watchers
                    reloadFilesWatched();
                }
            }
            async function onFileStructureChange(file) {
                reloadComponents();
            }
            let filesBeingWatched = [];
            function reloadFilesWatched() {
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
                const filesToWatch = Array.from(new Set([...componentFiles, ...htmlFiles]));
                // Remove watchers on no longer needed files 
                filesBeingWatched = filesBeingWatched.filter(x => {
                    if (filesToWatch.includes(x)) {
                        return true;
                    }
                    server.watcher.unwatch(x);
                    return false;
                });
                // Start watching new files
                for (const newFile of filesToWatch) {
                    if (filesBeingWatched.includes(newFile))
                        continue;
                    server.watcher.add(newFile);
                    filesBeingWatched.push(newFile);
                }
            }
            reloadFilesWatched();
            setInterval(() => {
                reloadComponents();
            }, 2000);
            // Watch for changes -> reload, as you already do in your snippet
            server.watcher
                .on('add', (file) => {
                onFileStructureChange(file);
            })
                .on('unlink', (file) => {
                onFileStructureChange(file);
            });
        },
    };
}
