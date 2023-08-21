import { defineConfig } from "vite";

// https://vitejs.dev/config

export default defineConfig({
    build: {
        // emptyOutDir: true,
        // ssr: true,
        rollupOptions: {
            input: "src/electron/preload.ts",
            external: ["ytdl-core", "fluent-ffmpeg"],
            //"ffmpeg-static", "fluent-ffmpeg"
        },
        modulePreload: {
            polyfill: false,
        },
        minify: "esbuild",
        target: "esnext",
    },
    // resolve: {
    //     mainFields: ["module", "jsnext:main", "jsnext"],
    // },
});
