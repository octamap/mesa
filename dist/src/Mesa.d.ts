import { Plugin } from 'vite';
import ComponentsMap from './types/ComponentsMap.js';
export default function Mesa(componentsSource: ComponentsMap | (() => ComponentsMap)): Plugin;
