import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ZkPassword",
      fileName: "zk-password",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "@aztec/bb.js",
        "@noir-lang/noir_js",
        "argon2-browser/dist/argon2-bundled.min.js",
      ],
    },
  },
});
