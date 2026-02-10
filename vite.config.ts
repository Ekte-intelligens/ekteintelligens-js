import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "EkteIntelligensSDK",
            fileName: (format) => `index.${format === "es" ? "es" : "js"}`,
        },
        rollupOptions: {
            input: {
                main: resolve(__dirname, "src/index.ts"),
                "credit-check": resolve(__dirname, "src/tools/credit-check/index.ts"),
            },
            output: [
                {
                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === "credit-check") {
                            return "credit-check.es.js";
                        }
                        return "index.es.js";
                    },
                    format: "es",
                },
                {
                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === "credit-check") {
                            return "credit-check.js";
                        }
                        return "index.js";
                    },
                    format: "cjs",
                },
            ],
        },
    },
});
