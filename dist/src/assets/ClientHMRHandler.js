(function () {
    if (import.meta.hot) {
        import.meta.hot.on('mesa-style-update', ({ componentName, style }) => {
            const cssStart = '/*start:' + componentName + '*/';
            const cssEnd = '/*end:' + componentName + '*/';
            // Construct the new CSS block
            const newText = style == null ? "" : `${cssStart}\n${style}\n${cssEnd}`;
            const existingStyleElements = document.querySelectorAll("style[mesa");

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

                let mesaBlock = null;
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

        import.meta.hot.on('mesa-html-update', ({ componentName, newHtml }) => {

        })

        import.meta.hot.on('mesa-check-entry', () => {
            var scriptElement = document.querySelector("script[mesa-hmr-route]")
            import.meta.hot.send("mesa-entry", {
                entry: scriptElement?.innerHTML.slice(1, -1)
            });
        })
    }
})();