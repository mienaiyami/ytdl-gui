// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { app, dialog } from "@electron/remote";
import { contextBridge, ipcRenderer } from "electron";
import fs from "fs";
import path from "path";
import { YTDL } from "./ytdl";

const electron = {
    fs,
    path,
    app,
    dialog,
    async invoke(event: string, ...params: any) {
        return await ipcRenderer.invoke(event, ...params);
    },
};

declare global {
    interface Window {
        electron: typeof electron;
        ytdl: YTDL;
    }
}
window.electron = electron;
window.ytdl = new YTDL();
// contextBridge.exposeInMainWorld("ytdl", YTDL);

// contextBridge.exposeInMainWorld("electron", electron);
// contextBridge.exposeInMainWorld("ytdl", () => new YTDL());
// console.log(app);
// document.title = app.getName();
