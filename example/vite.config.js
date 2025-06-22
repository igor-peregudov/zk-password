import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import {defineConfig} from "vite";

export default defineConfig({
    plugins: [wasm(), topLevelAwait()],
    assetsInclude: ['**/*.wasm'],
    optimizeDeps: {
        esbuildOptions: { target: "esnext" },
        exclude: ["@noir-lang/noirc_abi", "@noir-lang/acvm_js"],
    },
});
