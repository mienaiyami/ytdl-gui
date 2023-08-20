import { defineConfig } from "vite";

// https://vitejs.dev/config

export default defineConfig({
    build: {
        emptyOutDir: false,
        ssr: true,
        rollupOptions: {
            input: ["src/electron/preload.ts"],
        },
    },
});
