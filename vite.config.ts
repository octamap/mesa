import builtins from 'builtin-modules';
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, './index.ts'),
            name: "index",
            fileName: (format) => `index.${format}.js`,
            formats: ["es", "cjs"]
        },
        rollupOptions: {
            external: ["fs", "path", ...builtins], // Mark Node.js modules as external
            output: {
                globals: {
                    vue: "Vue"
                }
            }
        },
        target: "node18" // Use your Node version
    }
});