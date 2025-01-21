import { JSDOM } from 'jsdom';
import Variable from "../types/Variable.js";
export default function compileForOperator(dom: JSDOM, element: Element, variables: Variable[]): void;
interface ItemData {
    [key: string]: any;
}
/**
 * Transforms an element with :for="(itemVar, indexVar) in data"
 * into an array of cloned and replaced elements.
 *
 * @param element  The element node containing the :for directive.
 * @param items    The array of data objects to iterate over.
 * @param itemVar  The variable name representing each item in the array. E.g. 'segment'
 * @param indexVar The variable name representing the array index. E.g. 'index'
 * @returns        An array of cloned elements with all references replaced.
 */
export declare function repeatElement(dom: JSDOM, element: Element, items: ItemData[], itemVar: string | null, indexVar: string | null, arrayName: string | null): Element[];
export declare function compileVariables(code: string, baseName: string, variables: Record<string, any>, wrapStrings: boolean): string;
export {};
