import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from "electron";
import isPortable from "./isPortable";
import * as path from "path";
import * as fs from "fs";

import remote from "@electron/remote/main";
remote.initialize();

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

if (require("electron-squirrel-startup")) {
    app.quit();
}

if (isPortable) {
    const folderPath = path.join(app.getAppPath(), "../../userdata/");
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
    app.setPath("userData", folderPath);
}

const createWindow = (): void => {
    const mainWindow = new BrowserWindow({
        minWidth: 850,
        minHeight: 700,
        backgroundColor: "#000000",
        show: false,
        // these will make remove default window controls
        // frame: false,
        // titleBarStyle: process.platform === "win32" ? "hidden" : "default",
        // titleBarOverlay: {
        //     color: "#000000",
        //     symbolColor: "#ffffff",
        //     height: 40,
        // },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // webSecurity: app.isPackaged,
            safeDialogs: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    remote.enable(mainWindow.webContents);
    // hide menu if it is defined
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.once("dom-ready", () => {
        mainWindow.show();
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    mainWindow.webContents.setWindowOpenHandler((e) => {
        shell.openExternal(e.url);
        return { action: "deny" };
    });
    // mainWindow.webContents.openDevTools();
};

app.on("ready", () => {
    /**
     * enables basic shortcut keys such as copy, paste, reload, etc.
     */
    const template: MenuItemConstructorOptions[] = [
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "pasteAndMatchStyle" },
                { role: "selectAll" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn", accelerator: "CommandOrControl+=" },
                { role: "zoomOut" },
            ],
        },
        {
            label: "Others",
            submenu: [
                {
                    role: "help",
                    accelerator: "F1",
                    click: () => shell.openExternal("https://github.com/mienaiyami/"),
                },
                // {
                //     label: "New Window",
                //     accelerator: process.platform === "darwin" ? "Cmd+N" : "Ctrl+N",
                //     click: () => createWindow(),
                // },
                {
                    label: "Close",
                    accelerator: process.platform === "darwin" ? "Cmd+W" : "Ctrl+W",
                    click: (_, window) => window?.close(),
                },
            ],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
