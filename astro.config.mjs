import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

export default defineConfig({
    devToolbar: {
        enabled: false,
    },
    compressHTML: false,
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                "@src": fileURLToPath(new URL("./src", import.meta.url)),
                "@components": fileURLToPath(
                    new URL("./src/components", import.meta.url),
                ),
                "@layouts": fileURLToPath(
                    new URL("./src/layouts", import.meta.url),
                ),
                "@pages": fileURLToPath(
                    new URL("./src/pages", import.meta.url),
                ),
            },
        },
    },
    build: {
        format: "file",
    },
});
