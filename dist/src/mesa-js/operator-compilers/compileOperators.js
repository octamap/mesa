import { JSDOM } from 'jsdom';
import compileForOperator from './compileForOperator.js';
import traverseElementChildren from '../../helpers/traverseElementChildren.js';
import analyzeInlineMesaJs from '../analyzeInlineMesaJs.js';
export default async function compileOperators(htmlText, variables) {
    let dom = new JSDOM(htmlText);
    let doc = dom.window.document;
    let didIncludeBody = htmlText.includes("<body");
    let hasChanges = false;
    const forElements = doc.querySelectorAll("[\\m-for]");
    if (forElements.length) {
        hasChanges = true;
        forElements.forEach(x => compileForOperator(dom, x, variables));
    }
    // Evaluate inline code inside attributes
    traverseElementChildren(doc.documentElement, element => {
        const attributeNames = element.getAttributeNames();
        for (const name of attributeNames) {
            if (!name.startsWith("m-"))
                continue;
            const code = element.getAttribute("m-if");
            if (!code)
                continue;
            hasChanges = true;
            const newCode = analyzeInlineMesaJs(code, variables);
            element.setAttribute(name, newCode);
        }
    });
    // Evaluate inline code inside {{ }}
    let currentHtml = dom.serialize();
    const codeBrackets = getCodeBrackets(currentHtml).reverse();
    for (const { content, startIndex, endIndex } of codeBrackets) {
        hasChanges = true;
        const before = currentHtml.substring(0, startIndex);
        const after = currentHtml.substring(endIndex);
        const newCode = analyzeInlineMesaJs(content, variables);
        currentHtml = before + newCode + after;
    }
    // Remove m- from attributes
    const removeMRegex = /\bm-([^\s=]+)=/g;
    if (!hasChanges) {
        htmlText = htmlText.replaceAll(removeMRegex, '$1=');
        return htmlText;
    }
    // Convert "``" into "" in attributes
    const removeBackTicks = /"`([^`]*)`"/g;
    const matches = Array.from(currentHtml.matchAll(removeBackTicks)).reverse();
    for (const match of matches) {
        const index = currentHtml.slice(0, match.index).lastIndexOf(" ");
        if (index != -1 && currentHtml.slice(index, match.index).trim().startsWith("m-")) {
            let content = currentHtml.slice(match.index, match.index + match[0].length).slice(2, -2);
            currentHtml = currentHtml.slice(0, match.index + 1) + content + currentHtml.slice(match.index + match[0].length - 1);
        }
    }
    // Reinitialize dom
    dom = new JSDOM(currentHtml);
    doc = dom.window.document;
    // Process m-if elements
    compileIfOperators(doc);
    if (didIncludeBody) {
        return dom.serialize().replaceAll(removeMRegex, '$1=');
    }
    return [doc.head.innerHTML, doc.body.innerHTML.replaceAll(removeMRegex, '$1=')].join("\n");
}
function getCodeBrackets(htmlText) {
    const pattern = /{{\s*(.*?)\s*}}/gs;
    const matches = [...htmlText.matchAll(pattern)];
    return matches.map(match => ({
        content: match[1], // the captured group content without the braces
        startIndex: match.index, // start index of the whole match including {{ }}
        endIndex: match.index + match[0].length // end index of the whole match
    }));
}
function compileIfOperators(doc) {
    const ifElements = doc.querySelectorAll("[\\m-if]");
    for (const element of ifElements) {
        const value = element.getAttribute("m-if");
        if (value == "false") {
            element.parentElement?.removeChild(element);
        }
        else {
            element.removeAttribute("m-if");
        }
    }
}
