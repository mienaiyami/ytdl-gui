import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
        mainFields: ["module", "jsnext:main", "jsnext"],
    },
    build: {
        // rollupOptions: {
        //     external: ["ytdl-core", "ffmpeg-static", "fluent-ffmpeg"],
        // },
        modulePreload: {
            polyfill: false,
        },
        minify: "esbuild",
    },
});
