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
            external: ["@supabase/supabase-js"],
            output: {
                globals: {
                    "@supabase/supabase-js": "Supabase",
                },
            },
        },
    },
});
