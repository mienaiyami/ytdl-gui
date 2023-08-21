import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import pkgJSON from "./package.json";

import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import path, { join } from "path";

const config: ForgeConfig = {
    packagerConfig: {
        name: pkgJSON.productName,
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({}),
        new MakerZIP({}, ["win32"]),
        new MakerDeb({
            options: {
                maintainer: pkgJSON.author.name,
                homepage: pkgJSON.author.url,
                bin: "./" + pkgJSON.productName,
            },
        }),
        new MakerRpm({}),
    ],
    plugins: [
        new VitePlugin({
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
        }),
    ],
    hooks: {
        postMake: (config, makeResults) => {
            return new Promise((res) => {
                // writeFileSync("./test.json", JSON.stringify(makeResults, null, "\t"));
                const filesToUpload = [] as string[];
                let downloadBtns = `## Downloads\n\n`;
                const appName = pkgJSON.productName;
                const appVersion = "v" + pkgJSON.version;
                // will only work for either win32 or linux
                // need to manually add linux button when building on win32
                const MAP = {
                    "win32+zip+ia32": {
                        name: `${appName}-${appVersion}-Portable-x32.zip`,
                        text: "Download 32-bit Portable (zip)",
                        icon: "windows&logoColor=blue",
                    },
                    "win32+zip+x64": {
                        name: `${appName}-${appVersion}-Portable-x64.zip`,
                        text: "Download 64-bit Portable (zip)",
                        icon: "windows&logoColor=blue",
                    },
                    "win32+exe+ia32": {
                        name: `${appName}-${appVersion}-Setup-x32.exe`,
                        text: "Download 32-bit Setup (exe)",
                        icon: "windows&logoColor=blue",
                    },
                    "win32+exe+x64": {
                        name: `${appName}-${appVersion}-Setup-x64.exe`,
                        text: "Download 64-bit Setup (exe)",
                        icon: "windows&logoColor=blue",
                    },
                    "linux+deb+amd64": {
                        name: `${appName}-${appVersion}-amd64.deb`,
                        text: "Download 64-bit Linux (Debian)",
                        icon: "debian&logoColor=red",
                    },
                };
                const mainOutDir = "./out/all";
                if (!existsSync(mainOutDir)) mkdirSync(mainOutDir);
                makeResults.forEach((e1, i1) => {
                    //for reference

                    // "artifacts": [
                    // 	"C:\\Users\\sukoo\\code\\electron\\ytdl-gui\\out\\make\\squirrel.windows\\ia32\\RELEASES",
                    // 	"C:\\Users\\sukoo\\code\\electron\\ytdl-gui\\out\\make\\squirrel.windows\\ia32\\ytdl-gui-0.0.2 Setup.exe",
                    // 	"C:\\Users\\sukoo\\code\\electron\\ytdl-gui\\out\\make\\squirrel.windows\\ia32\\ytdl_gui-0.0.2-full.nupkg"
                    // ],

                    // "artifacts": [
                    // 	"C:\\Users\\sukoo\\code\\electron\\ytdl-gui\\out\\make\\zip\\win32\\ia32\\ytdl-gui-win32-ia32-0.0.2.zip"
                    // ],

                    const i2 = e1.artifacts.length === 1 ? 0 : 1;
                    const { name, text, icon } =
                        MAP[`${e1.platform}+${path.extname(e1.artifacts[i2]).replace(".", "")}+${e1.arch}`];
                    if (name) {
                        const newPath = path.join(mainOutDir, name);
                        renameSync(e1.artifacts[i2], newPath);
                        filesToUpload.push(newPath);
                        makeResults[i1].artifacts[i2] = newPath;
                        downloadBtns += `[![${text}](https://img.shields.io/badge/${encodeURIComponent(
                            text
                        ).replace(/-/g, "--")}-${encodeURIComponent(name).replace(
                            /-/g,
                            "--"
                        )}-brightgreen?logo=${icon})](${pkgJSON.author.url}/releases/download/${name})\n`;
                    }
                });

                // for linux build (downloaded)
                // {
                //     const { name, text, icon } = MAP["linux+deb+amd64"];
                //     downloadBtns += `[![${text}](https://img.shields.io/badge/${encodeURIComponent(text).replace(
                //         /-/g,
                //         "--"
                //     )}-${encodeURIComponent(name).replace(/-/g, "--")}-brightgreen?logo=${icon})](${
                //         pkgJSON.author.url
                //     }/releases/download/${name})\n`;
                // }

                downloadBtns += "---\n\n";
                const base = readFileSync("./changelog.md", "utf-8");
                writeFileSync("./changelog-temp.md", downloadBtns + base, "utf-8");
                writeFileSync("./filesToUpload.txt", filesToUpload.join(" "));
                res(makeResults);
            });
        },
        // removing extra files
        postPackage: async (config, packageResult) => {
            const filesToKeep = [".vite", "package.json", "node_modules", "LICENSE"];
            const appPath = join(packageResult.outputPaths[0], "resources/app");
            const allFiles = readdirSync(appPath)
                .filter((e) => !filesToKeep.includes(e))
                .map((e) => join(appPath, e));
            // writeFileSync("test.json", JSON.stringify(allFiles, null, "\t"));
            allFiles.forEach((e) => {
                rmSync(e, { force: true, recursive: true });
            });
        },
    },
};

export default config;
