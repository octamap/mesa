import path from 'path';
import { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import ComponentsMap from './types/ComponentsMap.js';
import processHtml from './methods/processHtml.js';
import splitHtmlAndCssFromComponents from './methods/splitHtmlAndCssFromComponents.js';
import getAllTagNames from './methods/getAllTagNames.js';
import fs from "fs"
import getHtmlFiles from './methods/getHtmlFiles.js';
import { OutgoingHttpHeader, OutgoingHttpHeaders, ServerResponse } from 'http';
import processHtmlAndInjectCss from './methods/processHtmlAndInjectCss.js';
import getTagsUsedInHtml from './methods/getTagsUsedInHtml.js';
import compileMesaJs from './mesa-js/compileMesaJs.js';
import log from './log.js';
import getHtmlInputsOfViteInput from './universal/getHtmlInputsOfViteInput.js';

// Plugin definition
export default function Mesa(components: ComponentsMap): Plugin {
    let cssSplit = splitHtmlAndCssFromComponents(components)

    const VIRTUAL_CSS_ID = 'virtual:mesa.css';
    const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID;

    let viteConfig: ResolvedConfig;
    let lastCssContent: undefined | string;
    let mainHtmls = new Map<string, string>() 
    const entryHtmlFiles = new Set<string>();

    async function processAndInjectCss(html: string) {
        const { componentsWithoutStyle, styles } = await cssSplit
        const tagsUsedInMain = mainHtmls ? await getTagsUsedInHtml(mainHtmls.values(), componentsWithoutStyle) : []
        html = await processHtmlAndInjectCss(html, componentsWithoutStyle, styles, {
            skipInjectOfComponents: tagsUsedInMain
        });
        return await compileMesaJs(html)
    }

    return {
        name: 'mesa',

        async configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
            Object.values(getHtmlInputsOfViteInput(viteConfig.build.rollupOptions.input)).forEach(x => {
                entryHtmlFiles.add(x)
            })

            // Set mainHtmls so that transformIndexHtml gets the correct tags when calling getTagsUsedInHtml 
            for (const entryHtmlFile of entryHtmlFiles) {
                if (fs.existsSync(entryHtmlFile)) {
                    mainHtmls.set(path.relative(process.cwd(), entryHtmlFile), fs.readFileSync(entryHtmlFile, 'utf-8'))
                }
            }
        },
        resolveId(id) {
            if (id === VIRTUAL_CSS_ID) {
                return RESOLVED_VIRTUAL_CSS_ID;
            }
            return null;
        },

        transformIndexHtml: {
            async handler(html, p) {
                const { componentsWithoutStyle } = await cssSplit
                mainHtmls.set(p.path, html)
                const tagsUsedInMain = await getTagsUsedInHtml(mainHtmls.values(), components)
                const tagsInMainHasStyle = Object.keys((await cssSplit).styles).some(x => tagsUsedInMain.includes(x))

                const tags: HtmlTagDescriptor[] = []
                if (tagsInMainHasStyle) {
                    tags.push({
                        tag: "link",
                        injectTo: "head",
                        attrs: {
                            rel: "stylesheet",
                            href: `/${VIRTUAL_CSS_ID}`
                        }
                    })
                }
                html = await processHtml(html, componentsWithoutStyle).then(x => x.html)
                html = await compileMesaJs(html)

                return {
                    html,
                    tags
                }
            },
        },

        async transform(code, id) {
            if (!id.endsWith(".html")) return;

            // Skip id if its a entry html 
            if (entryHtmlFiles.has(id)) {
                return;
            }
            const html = await processAndInjectCss(code)
            return {
                code: html,
            }
        },

        generateBundle: {
            order: "post",
            async handler(_, bundle) {
                const { styles, componentsWithoutStyle } = await cssSplit
                const tagsUsedInMain = mainHtmls ? await getTagsUsedInHtml(mainHtmls.values(), componentsWithoutStyle) : []
                let stylesUsedInMain: string[] = []
                for (const tag of tagsUsedInMain) {
                    const style = styles[tag]
                    if (style) {
                        stylesUsedInMain.push(style)
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
                    } catch (err) {
                        log(`\n ❌ Failed to process main HTML entry`, "error");
                        console.error(err)
                    }
                }
            },
        },


        async closeBundle() {
            log('🔄 Post-processing build output...');

            const distDir = viteConfig.build?.outDir || 'dist'; // Default Vite output directory

            // Ensure output folder exists
            if (!fs.existsSync(distDir)) {
                log('⚠️ Build directory does not exist. Skipping post-processing.', "warn");
                return;
            }

            const processHtmlFiles = async (dir: string) => {
                const children = fs.readdirSync(dir)
                await Promise.all(children.map(async file => {
                    const filePath = path.join(dir, file);

                    if (fs.statSync(filePath).isDirectory()) {
                        processHtmlFiles(filePath); // Recursively process subdirectories
                    } else if (filePath.endsWith('.html')) {
                        let html = fs.readFileSync(filePath, 'utf-8');
                        log(`🔧 Processing HTML file: ${filePath}`);
                        fs.writeFileSync(filePath, await processAndInjectCss(html));
                    }
                }))
            };

            // Start processing
            await processHtmlFiles(distDir);
            log('✅ Build output post-processing completed!');
        },

        async configureServer(server) {
            if (lastCssContent == undefined) {
                lastCssContent = await cssSplit.then(x => Object.values(x.styles).join("\n"))
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
                    return path.resolve(process.cwd(), source)
                } else if (typeof source == "object") {
                    return source.type == "absolute" ? source.path : undefined
                }
            }).filter(x => x != undefined);

            // Watch the component + HTML files, same as in your snippet.
            const htmlFiles = getHtmlFiles(process.cwd(), ['node_modules', '.git', 'dist']);
            const watchedFiles = [...componentFiles, ...htmlFiles];
            const rootDir = viteConfig.root || process.cwd();
            const customIndexPath = viteConfig.build?.rollupOptions?.input || 'index.html';
            const indexHtmlPath = path.resolve(
                rootDir,
                typeof customIndexPath == "string" ? customIndexPath : "index.html"
            );

            watchedFiles.forEach((file) => {
                server.watcher.add(file!);
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

                    const chunks: any[] = [];
                    res.write = function (chunk: any) {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        return true; // Indicate the write was successful
                    };
                    (res as any).writeHead = function (statusCode: number,
                        statusMessage?: string,
                        headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]) {
                        res.removeHeader('Content-Length');
                        res.setHeader('Transfer-Encoding', 'chunked');
                        return originalWriteHead(statusCode, statusMessage, headers);
                    };

                    (res as any).end = function (chunk: any, encoding: BufferEncoding, callback: () => void) {
                        if (chunk) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        }

                        const body = Buffer.concat(chunks).toString('utf-8'); // Combine all chunks into a string

                        (async () => {
                            try {
                                const html = await processAndInjectCss(body)

                                // Set headers and send the transformed response
                                if (!res.headersSent) {
                                    res.setHeader('Content-Type', 'text/html');
                                }

                                originalWrite.call(res, html, encoding, callback);
                                originalEnd.call(res, callback, encoding);
                            } catch (err) {
                                log(`Failed to transform ${req.url}`);
                                console.error(err)
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
                } catch (err) {
                    log(`Error processing HTML for ${req.url}`, "error");
                    console.error(err)
                    next();
                }
            });


            // Watch for changes -> reload, as you already do in your snippet
            server.watcher.on('change', async (file) => {
                const isComponentFile = componentFiles.includes(file);
                const isHtmlFile = htmlFiles.includes(file);

                log(`Detected change in ${file}`);

                if (isComponentFile) {
                    // Update CSS split and cached content
                    cssSplit = splitHtmlAndCssFromComponents(components);
                    lastCssContent = Object.values(await cssSplit.then(x => x.styles)).join("\n");

                    log(`Component updated: ${file}`);

                    // We need to read the new content of the file 
                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
                else if (isHtmlFile) {
                    // Only reload the specific HTML file that changed
                    const relativePath = path.relative(viteConfig.root, file);

                    log(`HTML file updated: ${relativePath}`);

                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
                else {
                    // Default fallback: full reload for other changes
                    log(`Unknown change, performing full reload.`);
                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
            });
        },
    };
}