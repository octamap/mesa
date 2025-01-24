(function () {
    if (import.meta.hot) {
        import.meta.hot.on('mesa-style-update', ({ componentName, style }) => {
            const cssStart = '/*start:' + componentName + '*/';
            const cssEnd = '/*end:' + componentName + '*/';
            // Construct the new CSS block
            const newText = style == null ? "" : `${cssStart}\n${style}\n${cssEnd}`;
            const existingStyleElements = document.querySelectorAll("style[mesa]");

            if (existingStyleElements.length === 0) {
                if (style != null) {
                    // Create a new <style> element
                    const styleElement = document.createElement('style');
                    styleElement.setAttribute('mesa', "");
                    styleElement.textContent = newText;
                    // Append the new <style> to the <head>
                    document.head.appendChild(styleElement);
                }
            } else {
                let styleUpdated = false; // Flag to check if any style was updated

                for (const styleTag of existingStyleElements) {
                    const startIndex = styleTag.textContent.indexOf(cssStart);
                    if (startIndex === -1) continue; // Skip if the start comment isn't found

                    const endIndex = styleTag.textContent.indexOf(cssEnd, startIndex);
                    if (endIndex === -1) continue; // Skip if the end comment isn't found

                    // Replace the existing CSS block with the new one
                    styleTag.textContent =
                        styleTag.textContent.substring(0, startIndex) +
                        newText +
                        styleTag.textContent.substring(endIndex + cssEnd.length);

                    styleUpdated = true;

                    // Remove the <style> tag if it's empty or only contains whitespace
                    if (styleTag.textContent.trim().length === 0) {
                        styleTag.parentNode.removeChild(styleTag);
                    }
                }

                // If no existing <style> tag was updated and style is provided, create a new <style> tag or use another mesa style block
                if (!styleUpdated && style != null) {
                    if (existingStyleElements.length > 0) {
                        const firstElement = existingStyleElements[0]
                        firstElement.textContent += `\n${cssStart}\n${newText}\n${cssEnd}`
                    } else {
                        const styleElement = document.createElement('style');
                        styleElement.setAttribute('mesa', "");
                        styleElement.textContent = newText;
                        document.head.appendChild(styleElement);
                    }
                }
            }
        });

        import.meta.hot.on('mesa-js-update', ({ componentName, js }) => {
            const jsStart = '/*start:' + componentName + '*/';
            const jsEnd = '/*end:' + componentName + '*/';
            // Construct the new CSS block
            const newText = js == null ? "" : `${jsStart}\n${js}\n${jsEnd}`;
            const existingJsElements = document.querySelectorAll("script[mesa-inline]");

            if (existingJsElements.length === 0) {
                if (js != null) {
                    // Create a new <style> element
                    const jsElement = document.createElement('script');
                    jsElement.setAttribute('mesa-inline', "");
                    jsElement.textContent = newText;
                    // Append the new <script> to the <head>
                    document.head.appendChild(jsElement);
                }
            } else {
                let jsUpdated = false; // Flag to check if any style was updated

                for (const jsTag of existingJsElements) {
                    const startIndex = jsTag.textContent.indexOf(jsStart);
                    if (startIndex === -1) continue; // Skip if the start comment isn't found

                    const endIndex = jsTag.textContent.indexOf(jsEnd, startIndex);
                    if (endIndex === -1) continue; // Skip if the end comment isn't found

                    // Remove old script tag
                    jsTag.parentNode.removeChild(jsTag);
                    jsUpdated = true;

                    // Remove the <script> tag if it's empty or only contains whitespace
                    if (newText.trim().length > 0) {
                        // Create new script tag and insert updated JS content
                        const newJsTag = document.createElement('script');
                        newJsTag.setAttribute('mesa-inline', "");
                        newJsTag.textContent = jsTag.textContent.substring(0, startIndex) +
                            newText +
                            jsTag.textContent.substring(endIndex + jsEnd.length);;
                        document.head.appendChild(newJsTag);
                    }
                }

                // If no existing <script> tag was updated and script is provided, create a new <script> tag or use another script block
                if (!jsUpdated && js != null) {
                    if (existingJsElements.length > 0) {
                        const firstElement = existingJsElements[0]
                        firstElement.textContent += `\n${jsStart}\n${newText}\n${jsEnd}`
                    } else {
                        const styleElement = document.createElement('script');
                        styleElement.setAttribute('mesa-inline', "");
                        styleElement.textContent = newText;
                        document.head.appendChild(styleElement);
                    }
                }
            }

            if ("Alpine" in window) {
                const elements = document.querySelectorAll('[x-data]');

                // Filter to only include elements that are not nested inside other x-data elements
                elements.forEach(el => {
                    if (!el.closest('[x-data]') || el.closest('[x-data]') === el) {
                        // Clone the original element
                        let newEl = el.cloneNode(true);

                        // Replace the original element with its clone
                        el.replaceWith(newEl);

                        // Initialize Alpine on the new element
                        Alpine.initTree(newEl);
                    }
                });
            }
        });


        import.meta.hot.on('mesa-css-file-change', ({ path }) => {
            // Extract the base path without the query parameters
            const basePath = path.split('?')[0];

            // Find the existing link tag with the matching base path
            const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => {
                let f = link.href
                try {
                    f = new URL(link.href).pathname
                } catch {
                }
                if (!f.startsWith("/")) {
                    f = "/" + f
                }
                return f.startsWith(basePath)
            }
            );

            if (existingLink) {
                // Create a new link element
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = `${basePath}?t=${Date.now()}`; // Add a new cache-busting query parameter

                // Replace the old link with the new one
                existingLink.parentNode.replaceChild(newLink, existingLink);

                console.log(`Stylesheet updated: ${basePath}`);
            } else {
                console.warn(`Stylesheet not found for path: ${path}`);
            }
        });

        import.meta.hot.on('mesa-check-entry', () => {
            var scriptElement = document.querySelector("script[mesa-hmr-route]")
            import.meta.hot.send("mesa-entry", {
                entry: scriptElement?.innerHTML.slice(1, -1)
            });
        })
    }
})();