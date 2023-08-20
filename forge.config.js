const { writeFileSync, renameSync } = require("fs");
const pkgJSON = require("./package.json");
module.exports = {
    packagerConfig: {
        name: pkgJSON.productName,
    },
    rebuildConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {},
        },
        {
            name: "@electron-forge/maker-zip",
            // platforms: ["darwin"],
            platforms: ["win32"],
        },
        {
            name: "@electron-forge/maker-deb",
            config: {
                options: {
                    maintainer: pkgJSON.author.name,
                    homepage: pkgJSON.author.url,
                    bin: "./" + pkgJSON.productName,
                },
            },
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {},
        },
    ],
    plugins: [
        {
            name: "@electron-forge/plugin-vite",
            config: {
                // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
                // If you are familiar with Vite configuration, it will look really familiar.
                build: [
                    {
                        // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                        entry: "src/electron/main.ts",
                        config: "vite.main.config.ts",
                    },
                    {
                        entry: "src/electron/preload.ts",
                        config: "vite.preload.config.ts",
                    },
                ],
                renderer: [
                    {
                        name: "main_window",
                        config: "vite.renderer.config.ts",
                    },
                ],
            },
        },
    ],
    hooks: {
        postMake: (config, makeResults) => {
            // writeFileSync("./test.json", JSON.stringify(makeResults, null, "\t"));
            makeResults.forEach((e) => {
                e.artifacts.forEach((e) => {
                    const newName = e.replace(pkgJSON.version, "v" + pkgJSON.version);
                    renameSync(e, newName);
                });
            });
        },
    },
};
