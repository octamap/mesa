import path from 'path';
import { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import ComponentsMap from './types/ComponentsMap.js';
import processHtml from './methods/processHtml.js';
import splitHtmlAndCssFromComponents from './methods/splitHtmlAndCssFromComponents.js';
import getAllTagNames from './methods/getAllTagNames.js';
import getHtmlFiles from './methods/getHtmlFiles.js';


// Plugin definition
export default function Mesa(components: ComponentsMap): Plugin {
    let cssSplit = splitHtmlAndCssFromComponents(components)

    const VIRTUAL_CSS_ID = 'virtual:processed-css.css';
    const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID;

    let viteConfig: ResolvedConfig;
    let lastCssContent: undefined | string;
    let stylesUsedByMain: Record<string, string> = {}

    return {
        name: 'build-time-components',

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
                const { componentsWithoutStyle, styles } = await cssSplit

                if (typeof html === 'string') {
                    const tagNames = getAllTagNames(html);
                    for (const tag of tagNames) {
                        const style = styles[tag];
                        if (style) {
                            stylesUsedByMain[tag] = style
                        }
                    }
                }
                const tags: HtmlTagDescriptor[] = []
                if (Object.keys(stylesUsedByMain).length > 0) {
                    tags.push({
                        tag: "link",
                        injectTo: "head",
                        attrs: {
                            rel: "stylesheet",
                            href: `/${VIRTUAL_CSS_ID}`
                        }
                    })
                }
                return {
                    html: await processHtml(html, componentsWithoutStyle),
                    tags
                }
            },
        },

        generateBundle: {
            order: "post",
            async handler(_, bundle) {
                const { componentsWithoutStyle, styles } = await cssSplit

                // Create the style file for the main index.html
                if (Object.keys(stylesUsedByMain).length > 0) {
                    try {
                        this.emitFile({
                            type: 'asset',
                            fileName: VIRTUAL_CSS_ID,
                            source: Object.values(stylesUsedByMain).join("\n")
                        });
                        console.log(`\n ✅ Styles injected for main files`);
                    } catch (err) {
                        console.error(`\n ❌ Failed to process main HTML entry`, err);
                    }
                }

                // Compile components
                const importedStyles = Object.keys(stylesUsedByMain)
                const unImportedStyles = Object.keys(styles).filter(x => !importedStyles.includes(x))
                for (const [fileName, file] of Object.entries(bundle)) {
                    if (fileName.endsWith('.html')) {
                        try {
                            const html = (file as any).source;
                            if (typeof html !== 'string') continue;

                            (file as any).source = await processHtml(html, componentsWithoutStyle);

                            // Find tag names not used by main entry 
                            const styleOfComponentsToImport = getAllTagNames(html).filter(x => unImportedStyles.includes(x));

                            // Add a style element at the top that contains the styles
                            if (styleOfComponentsToImport.length > 0) {
                                const stylesToImport: string[] = []
                                for (const tag of styleOfComponentsToImport) {
                                    stylesToImport.push(styles[tag])
                                }
                                const style = `<style>${stylesToImport.join("\n")}</style>`;
                                (file as any).source = style + "\n" + (file as any).source
                            }
                            console.log(`Transformed build output: ${fileName}`);
                        } catch (err) {
                            console.error(`Failed to transform ${fileName}`, err);
                        }
                    }
                }

                // Check for html files other than index.html were we need to inject styles that have not been imported yet
            },
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

            const htmlFiles = getHtmlFiles(process.cwd(), ['node_modules', '.git', 'dist']);
            const watchedFiles = [...componentFiles, ...htmlFiles];

            watchedFiles.forEach((file) => {
                server.watcher.add(file!);
            });

            server.watcher.on('change', async (file) => {
                if (watchedFiles.includes(file)) {
                    if (componentFiles.includes(file)) {
                        const newCssSplit = splitHtmlAndCssFromComponents(components)
                        cssSplit = newCssSplit
                        lastCssContent = Object.values(await newCssSplit.then(x => x.styles)).join("\n")
                    }
                    console.log(`[vite-plugin-inline-html-components] Detected change in ${file}. Reloading page...`);
                    server.ws.send({
                        type: 'full-reload',
                        path: '*',
                    });
                }
            });
        },
    };
}