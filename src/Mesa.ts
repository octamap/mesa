import path from 'path';
import { HtmlTagDescriptor, ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import ComponentsMap from './types/ComponentsMap.js';
import processHtml from './methods/processHtml.js';
import splitHtmlCSSAndJSFromComponents from './methods/splitHtmlCSSAndJSFromComponents.js';
import fs from "fs"
import getHtmlFiles from './methods/getHtmlFiles.js';
import processHtmlAndInjectCss from './methods/processHtmlAndInjectCss.js';
import getTagsUsedInHtml from './methods/getTagsUsedInHtml.js';
import { compileMesaJs } from './mesa-js/compileMesaJs.js';
import log from './log.js';
import getHtmlInputsOfViteInput from './universal/getHtmlInputsOfViteInput.js';
import MesaHMR from './hmr/MesaHMR.js';
import splitHtmlCSSAndJS from './methods/splitHtmlCSSAndJS.js';
import { fileURLToPath } from 'url';
import getFileName from './methods/getFileName.js';
import getCurrentEntry from './methods/getCurrentEntry.js';
import convertExportToHtml from './universal/js-html/convertExportToHtml.js';
import convertHtmlToExport from './universal/js-html/convertHtmlToExport.js';
import uniqueIdForFile from './methods/uniqueIdForFile.js';
import getAbsolutePathOfSource from './methods/getAbsolutePathOfSource.js';

export default function Mesa(componentsSource: ComponentsMap | (() => ComponentsMap)): Plugin {
    let components = typeof componentsSource == "object" ? componentsSource : componentsSource()
    let cssSplit: Promise<{
        componentsWithoutStyle: ComponentsMap;
        styles: Record<string, string>;
        scripts: Record<string, string>
    }> = Promise.resolve({ componentsWithoutStyle: {}, styles: {}, scripts: {} })
    
    const VIRTUAL_CSS_ID = 'mesa.css';
    const HMR_HANDLER_ID = 'virtual:mesa-hmr.js';
    const RESOLVED_HMR_HANDLER_ID = '\0' + HMR_HANDLER_ID;

    let viteConfig: ResolvedConfig;
    let mainHtmls = new Map<string, Promise<string> | string>()
    const entryHtmlFiles = new Set<string>();

    const mesaStylesFolder = "mesa-styles"
    let isDev = false;
    let devServer: ViteDevServer | undefined
    let hasMondo = false

    async function processAndInjectCss(html: string) {
        const { componentsWithoutStyle, styles, scripts } = await cssSplit
        const tagsUsedInMain = await getTagsUsedInHtml(await Promise.all(mainHtmls.values()), componentsWithoutStyle) 
        const processed = await processHtmlAndInjectCss(html, componentsWithoutStyle, styles, scripts, {
            skipInjectOfComponents: tagsUsedInMain,
            injectWithComments: isDev,
            server: devServer,
            hasMondo,
            originalComponents: components
        });
        return {...processed, html: await compileMesaJs(processed.html) }
    }
    const processPath = process.cwd()
    let hasCssFileUpdates = false;
    const fileIdLength = 5

    async function getCssForEntryName(entryName: string, styles: Record<string, string>, components: ComponentsMap) {
        const html = Array.from(mainHtmls.entries()).find(x => {
            return x[0].endsWith(`${entryName}.html`)
        })?.[1]
        const tagsUsedInMain = html ? await getTagsUsedInHtml(await html, components) : []
        let stylesUsedInMain: string[] = []
        for (const tag of tagsUsedInMain) {
            const style = styles[tag]
            if (style) {
                stylesUsedInMain.push(style)
            }
        }
        return Object.values(stylesUsedInMain).join("\n")
    }

    return {
        name: 'mesa',
        async configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
            hasMondo = (resolvedConfig as any).hasMondo
            isDev = viteConfig.command !== 'build'
            cssSplit = splitHtmlCSSAndJSFromComponents(components)
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
            if (id.endsWith(VIRTUAL_CSS_ID)) {
                const filename = id.slice(0, id.length - VIRTUAL_CSS_ID.length - fileIdLength)
                return filename + VIRTUAL_CSS_ID 
            }
            if (id === HMR_HANDLER_ID) {
                return RESOLVED_HMR_HANDLER_ID
            }
            return null;
        },
        async load(id) {
            if (id.normalize("NFC").startsWith(`/${HMR_HANDLER_ID.normalize("NFC")}`)) {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const cssHmrUpdaterPath = path.resolve(__dirname, 'assets/ClientHMRHandler.js');
                const cssHmrUpdater = fs.readFileSync(cssHmrUpdaterPath, 'utf-8');
                return cssHmrUpdater
            }
            if (!id.includes(".css") && id.includes("mesa-")) return;
            const components = id.split("/").filter(x => x.length)
            if (components.length == 0) return;
            const lastComponent = components[components.length - 1].normalize("NFC")
            const indexOfMesaCss = lastComponent.indexOf("mesa-")

            if (indexOfMesaCss != -1) {
                const { styles, componentsWithoutStyle } = await cssSplit
                // Identify the filename 
                const filename = lastComponent.slice(0, indexOfMesaCss)
                return getCssForEntryName(filename, styles, componentsWithoutStyle)
            }
        },

        transformIndexHtml: {
            order: "pre",
            async handler(html, p) {
                mainHtmls.set(p.path, html)
                const tagsUsedInHtml = await getTagsUsedInHtml(html, components)
                const tagsInMainHasStyle = Object.keys((await cssSplit).styles).some(x => tagsUsedInHtml.includes(x))
                let scriptsToInject = Object.entries((await cssSplit).scripts).filter(([key]) => tagsUsedInHtml.includes(key))
                
                const tags: HtmlTagDescriptor[] = []
                // We also want to add it if is dev (as we might need to reload it during hmr)
                if (tagsInMainHasStyle || isDev) {
                    const {styles} = await cssSplit
                    let filenameExcludingExtension = uniqueIdForFile(`${getFileName(p.filename)}${VIRTUAL_CSS_ID}`, fileIdLength, () => {
                        let stylesUsedInMain: string[] = []
                        for (const tag of tagsUsedInHtml) {
                            const style = styles[tag]
                            if (style) {
                                stylesUsedInMain.push(style)
                            }
                        }
                        return Object.values(stylesUsedInMain).join("\n")
                    })
                    let path = `/${filenameExcludingExtension}`
                    if (isDev) {
                        path += `?t=${Date.now()}`
                    } else {
                        path = "/" + mesaStylesFolder + path
                    }
                    tags.push({
                        tag: "link",
                        injectTo: "head",
                        attrs: {
                            rel: "stylesheet",
                            href: path
                        }
                    })
                }

                if (scriptsToInject.length) {
                    if (isDev) {
                        scriptsToInject = scriptsToInject.map(([tag, script]) => {
                            return [tag,`/*start:${tag}*/\n${script}\n/*end:${tag}*/`]
                        })
                    }
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        attrs: isDev ? {
                            "mesa-inline": "",
                        } : {},
                        children: `${scriptsToInject.map(x => x[1]).join(";\n")}`
                    })
                }
                if (isDev) {
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        attrs: {
                            type: "module",
                            src: `/${HMR_HANDLER_ID}`
                        }
                    })
                    tags.push({
                        tag: "script",
                        injectTo: "head",
                        children: `\"${p.path}\"`,
                        attrs: {
                            "mesa-hmr-route": "",
                        }
                    })
                }
                const { componentsWithoutStyle } = await cssSplit
                html = await processHtml(html, componentsWithoutStyle, { server: p.server, hasMondo, originalComponents: components }).then(x => x.html)
                html = await compileMesaJs(html)
                return {
                    html,
                    tags
                }
            },
        },

        transform: {
            order: "pre",
            async handler(code, id) {
                let isRaw = false
                if (id.endsWith(".html?raw") || id.endsWith(".html?import&raw")) {
                    isRaw = true
                    code = convertExportToHtml(code)
                } else if (!id.endsWith(".html")) return;
                // Skip id if its a entry html 
                if (entryHtmlFiles.has(id)) {
                    return;
                }
    
                let { html, componentsUsed } = await processAndInjectCss(code)
             
                html = isRaw ? convertHtmlToExport(html) : html
                for (const tag of componentsUsed) {
                    const source = components[tag]
                    if (!source) continue;
                    const absolutePath = getAbsolutePathOfSource(source)
                    if (!absolutePath) continue;
                    this.addWatchFile(absolutePath)
                }
                return {
                    code: html
                }
            }
        },
        generateBundle: {
            order: "post",
            async handler(_) {
                const { styles, componentsWithoutStyle } = await cssSplit

                // 1 - Create the css file for styles used by components in each entry html file
                for (const [mainHtmlPath, mainHtml] of mainHtmls) {
                    const tagsUsedInMain = await getTagsUsedInHtml(await mainHtml, componentsWithoutStyle)
                    let stylesUsedInMain: string[] = []
                    for (const tag of tagsUsedInMain) {
                        const style = styles[tag]
                        if (style) {
                            stylesUsedInMain.push(style)
                        }
                    }
                    if (stylesUsedInMain.length == 0) continue;
                    const newStyleData = Object.values(stylesUsedInMain).join("\n")
                    let filenameExcludingExtension = uniqueIdForFile(`${getFileName(mainHtmlPath)}${VIRTUAL_CSS_ID}`, fileIdLength, () => {
                        return newStyleData
                    })
                    try {
                        this.emitFile({
                            type: 'asset',
                            fileName: mesaStylesFolder + "/" + filenameExcludingExtension,
                            source: newStyleData
                        });
                        log(`\n ✅ Styles injected for ` + mainHtmlPath);
                    } catch (err) {
                        log(`\n ❌ Failed to process main HTML entry`, "error");
                        console.error(err)
                    }
                }
            },
        },

        async handleHotUpdate(ctx) {
            const { file, read, server } = ctx;

            // Check if the file is a CSS or HTML file (or whatever file defines styles for components)
            if (file.endsWith('.html') || file.endsWith(".svg")) {
                let cache: Promise<string> | string | undefined
                async function getData() {
                    if (cache) return cache
                    cache = read()
                    return cache
                }

                // Get file relative to process
                const relativePath = path.relative(processPath, file)
                if (mainHtmls.has(relativePath)) {

                    // The main html has been edited 
                    const dataPromise = getData()
                    mainHtmls.set(relativePath, dataPromise)
                    hasCssFileUpdates = true
                    server.ws.send({
                        type: 'full-reload',
                        path: "*",
                    });
                  
                    return []
                }
                
                // Check if we have this component 
                const componentName = Object.entries(components).find(([_, value]) => {
                    if (typeof value == "object") {
                        if (value.type == "absolute" && value.path == file) {
                            return true
                        }
                    }
                })?.[0]

                if (componentName) {
                    const oldHtml = await MesaHMR.get(componentName, "html")
                    const oldCss = await MesaHMR.get(componentName, "css")
                    const oldScript = await MesaHMR.get(componentName, "js")
                    const newHtmlAndCss = (async () => {
                        const data = await getData()
                        const [html, css, js] = splitHtmlCSSAndJS(data, Object.keys(components), file)
                        const resolvedCssSplit = await cssSplit
                        resolvedCssSplit.componentsWithoutStyle[componentName] = { type: "raw", html } 
                        if (css) {
                            resolvedCssSplit.styles[componentName] = css
                        } else {
                            delete resolvedCssSplit.styles[componentName]
                        }
                        if (js) {
                            resolvedCssSplit.scripts[componentName] = js
                        } else {
                            delete resolvedCssSplit.scripts[componentName]
                        }
                        return [html, css, js]
                    })();
                    MesaHMR.save(componentName, newHtmlAndCss.then(x => x[1]), "css")
                    MesaHMR.save(componentName, newHtmlAndCss.then(x => x[0]), "html")
                    MesaHMR.save(componentName, newHtmlAndCss.then(x => x[2]), "js")
                    const newCss = await newHtmlAndCss.then(x => x[1])
                    const newHtml = await newHtmlAndCss.then(x => x[0])
                    const newJs = await newHtmlAndCss.then(x => x[2])

                    if (oldCss != newCss) {
                        // 1 - This style might be within the style file 
                        const entry = await getCurrentEntry(server)
                        let cssFileUpdated = false;
                        if (entry) {
                            const html = await mainHtmls.get(entry)
                            if (html) {
                                // 1 - Get tags used 
                                const tags = await getTagsUsedInHtml(html, components)
                                if (tags.includes(componentName)) {
                                    // We need to update the style file, not the style blocks 
                                    const resolvedCssSplit = await cssSplit
                                    const newFileName = uniqueIdForFile(`${getFileName(entry)}${VIRTUAL_CSS_ID}`, fileIdLength, () => {
                                        let stylesUsedInMain: string[] = []
                                        for (const tag of tags) {
                                            const style = resolvedCssSplit.styles[tag]
                                            if (style) {
                                                stylesUsedInMain.push(style)
                                            }
                                        }
                                        return Object.values(stylesUsedInMain).join("\n")
                                    })
                                    const filePath = "/" + newFileName
                                    hasCssFileUpdates = true
                                    server.ws.send({
                                        type: "custom",
                                        event: "mesa-css-file-change",
                                        data: {
                                            path: filePath
                                        }
                                    })
                                    cssFileUpdated = true
                                }
                            }
                        } 
                        if (!cssFileUpdated) {
                            server.ws.send({
                                type: 'custom',
                                event: 'mesa-style-update',
                                data: {
                                    componentName,
                                    style: newCss,
                                },
                            });
                        }
                    }
                    if (oldScript != newJs) {
                        server.ws.send({
                            type: "custom",
                            event: "mesa-js-update",
                            data: {
                                componentName,
                                js: newJs
                            }
                        })
                    }
                    if (newHtml == oldHtml) return []
                } 
            }
    
            server.ws.send({
                type: 'full-reload',
                path: '*',
            });
        },

        async configureServer(server) {
            devServer = server
            // --- The key middleware: transform any requested .html file (except the index) on the fly ---
            server.middlewares.use(async (req, res, next) => {
                if (req.method !== 'GET' || !req.url?.endsWith('.html')) {
                    if (hasCssFileUpdates && req.url?.includes(".css") && req.url && req.url.includes("mesa")) {
                        const indexOfMesaCss = req.url.indexOf("mesa-")
                        const fileName = req.url.slice(0, indexOfMesaCss)
                        const { componentsWithoutStyle, styles } = await cssSplit
                        const css = await getCssForEntryName(fileName, styles, componentsWithoutStyle)
                        res.statusCode = 200;
                        res.setHeader('Content-Type', "text/css");
                        res.end(css);
                        return;
                    }
                }
                  return next()
            });

            let debounceTimeout: any | undefined

            function reload(reloadCss?: boolean) {
                clearTimeout(debounceTimeout)
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

            function isSame(old: ComponentsMap, newMap: ComponentsMap) {
                const oldKeys = Object.keys(old)
                const newKeys = Object.keys(newMap)

        
                if (oldKeys.length != newKeys.length) {
                    return false;
                }
                for (const key of oldKeys) {
                    const oldValue = old[key]
                    const newValue = newMap[key]
                    if (!newValue != !oldValue) {
                        return false;
                    }
                    if (typeof newValue == "string") {
                        if (oldValue != newValue) {
                            return false;
                        }
                    }
                    if (typeof newValue == "object") {
                        if (typeof oldValue != "object") return false;
                        if (newValue.type == "absolute" && oldValue.type == "absolute" && newValue.path == oldValue.path) {
                            continue;
                        } else if (newValue.type == "raw" && oldValue.type == "raw" && newValue.html == oldValue.html) {
                            continue;
                        }
                        return false;
                    }
                }
                return true;
            }

            function reloadComponents() {
                if (typeof componentsSource == "function") {
                    let oldComponents = { ...components }
                    components = componentsSource()
                    if (isSame(oldComponents, components)) return;
                    reload(true)
                    // Reload file watchers
                    reloadFilesWatched()
                }
            }
            
            async function onFileStructureChange(file: string) {
                reloadComponents()
            }

            let filesBeingWatched: string[] = []

            function reloadFilesWatched() {
                const componentFiles = Object.values(components).map((source) => {
                    if (typeof source == "string") {
                        return path.resolve(process.cwd(), source)
                    } else if (typeof source == "object") {
                        return source.type == "absolute" ? source.path : undefined
                    }
                }).filter(x => x != undefined);

                // Watch the component + HTML files, same as in your snippet.
                const htmlFiles = getHtmlFiles(process.cwd(), ['node_modules', '.git', 'dist']);
                const filesToWatch = Array.from(new Set([...componentFiles, ...htmlFiles]))
                
                // Remove watchers on no longer needed files 
                filesBeingWatched = filesBeingWatched.filter(x => {
                    if (filesToWatch.includes(x)) {
                        return true;
                    }
                    server.watcher.unwatch(x)
                    return false;
                })

                for (const newFile of filesToWatch) {
                    if (filesBeingWatched.includes(newFile)) continue;
                    server.watcher.add(newFile)
                    filesBeingWatched.push(newFile)
                }
            }

            reloadFilesWatched()

            setInterval(() => {
                reloadComponents()
            }, 2000);

            // Watch for changes -> reload, as you already do in your snippet
            server.watcher
                .on('add', (file) => {
                    onFileStructureChange(file)
                })
                .on('unlink', (file) => {
                    onFileStructureChange(file)
                })
            
        },
    };
}