export default function removeMesaJs(html) {
    // Use a regular expression to find and remove all <script #mesa>...</script> blocks
    return html.replace(/<script\s+#mesa\b[^>]*>.*?<\/script>/gs, '');
}
