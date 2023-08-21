import { useLayoutEffect, useRef, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";

import URLInput from "./components/URLInput";
import ToggleTheme from "./components/ToggleTheme";
import DLOptionInputs from "./components/DLOptionInputs";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

function App() {
    const { toast } = useToast();

    const [urls, setUrls] = useState<string[]>([]);
    const [queuedUrls, setQueuedUrls] = useState<string[]>([]);
    const [cookies, setCookies] = useState(localStorage.getItem("ytdl-cookies") || "");
    const [useLast, setUseLast] = useState(JSON.parse(localStorage.getItem("ytdl-settings-useLast") || "true"));
    const cookiesRef = useRef<HTMLInputElement>(null);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [downloadingItem, setDownloadingItem] = useState<DownloadingData | null>(null);
    const [downloadedList, setDownloadedList] = useState<DownloadedData[]>([]);

    useLayoutEffect(() => {
        localStorage.setItem("ytdl-settings-useLast", JSON.stringify(useLast));
    }, [useLast]);

    const DownloadedItem = (e: DownloadedData) => {
        if ("error" in e)
            return (
                <div className="p-2 rounded-lg border shadow-sm flex flex-col space-y-0 border-destructive bg-red-800 bg-opacity-5">
                    <span className="truncate select-text">{e.url}</span>
                    <span className="text-sm select-text max-h-10 overflow-auto ">{e.error}</span>
                    {/* <div className="flex flex-col"></div> */}
                </div>
            );
        return (
            <div className="p-2 rounded-lg border shadow-sm flex flex-col space-y-0 border-green-800 dark:border-green-400 bg-green-800 dark:bg-green-400 bg-opacity-20 dark:bg-opacity-20">
                <span className="truncate select-text">{e.title}</span>
                <span className="text-muted-foreground text-sm truncate select-text">{e.url}</span>
                <div className="flex flex-col space-y-0">
                    <span className="text-sm">
                        {e.started.toLocaleTimeString()} <span className="text-muted-foreground">to</span>{" "}
                        {e.ended.toLocaleTimeString()}
                    </span>
                    <span className="text-sm">
                        <span className="text-muted-foreground">Audio:</span>{" "}
                        {window.ytdl.byteToMB(e.audio?.total || 0)}MB{" "}
                        <span className="text-muted-foreground">took</span> {e.audio?.elapsed}
                    </span>
                    {e.video && (
                        <span className="text-sm">
                            <span className="text-muted-foreground">Video:</span>{" "}
                            {window.ytdl.byteToMB(e.video.total)}MB{" "}
                            <span className="text-muted-foreground">took</span> {e.video.elapsed}
                        </span>
                    )}
                </div>
            </div>
        );
    };
    const DownloadingItem = (e: DownloadingData) => {
        return (
            <div className="p-2 rounded-lg border shadow-sm flex flex-col space-y-0">
                <span className="truncate select-text">{e.title}</span>
                <span className="text-muted-foreground text-sm truncate select-text">
                    {e.url} at {e.started.toLocaleTimeString()}
                </span>
                <div className="flex flex-col space-y-0 relative text-sm">
                    <span className="flex flex-row space-x-2">
                        <span className="text-muted-foreground">Audio:</span>
                        <span
                            className={`grid grid-cols-3 w-full content-center justify-center ${
                                e.audio?.downloaded === e.audio?.total ? "text-green-800 dark:text-green-400" : ""
                            }`}
                        >
                            <span>
                                [{window.ytdl.byteToMB(e.audio?.downloaded || 0)} /{" "}
                                {window.ytdl.byteToMB(e.audio?.total || 0)} MB]
                            </span>{" "}
                            <span>[{e.audio?.speed}MBps]</span> <span>[{e.audio?.elapsed}]</span>
                        </span>
                    </span>
                    {e.video && (
                        <span className="flex flex-row space-x-2">
                            <span className="text-muted-foreground">Video:</span>
                            <span
                                className={`grid grid-cols-3 w-full content-center justify-center ${
                                    e.video.downloaded === e.video.total
                                        ? "text-green-800 dark:text-green-400"
                                        : ""
                                }`}
                            >
                                <span>
                                    [{window.ytdl.byteToMB(e.video.downloaded)} /{" "}
                                    {window.ytdl.byteToMB(e.video.total)} MB]
                                </span>
                                <span>[{e.video.speed}MBps]</span> <span>[{e.video.elapsed}]</span>
                            </span>
                        </span>
                    )}
                    {e.building && (
                        <span className="absolute bg-green-800 dark:bg-green-400 text-primary-foreground rounded grid place-items-center text-xl w-full h-full text-center ">
                            <span>
                                Building <FontAwesomeIcon icon={faRotateRight} spin />{" "}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        );
    };
    const download = (options: DownloadOptions) => {
        if (useLast) {
            localStorage.setItem("ytdl-format", options.format);
            localStorage.setItem("ytdl-audioBitrate", options.audioBitrate);
            localStorage.setItem("ytdl-downloadPath", options.downloadPath);
            localStorage.setItem("ytdl-videoQuality", options.videoQuality);
            localStorage.setItem("ytdl-suffixQuality", JSON.stringify(options.suffixQuality));
            localStorage.setItem("ytdl-embedAlbumArt", JSON.stringify(options.embedAlbumArt));
        } else {
            localStorage.removeItem("ytdl-format");
            localStorage.removeItem("ytdl-audioBitrate");
            localStorage.removeItem("ytdl-downloadPath");
            localStorage.removeItem("ytdl-videoQuality");
            localStorage.removeItem("ytdl-suffixQuality");
            localStorage.removeItem("ytdl-embedAlbumArt");
        }
        if (urls.length > 0) {
            setDownloadModalOpen(true);
            setQueuedUrls(urls);
            window.ytdl.setQueue(urls).startDownload(
                { ...options, cookies },
                (data) => {
                    setDownloadingItem(data);
                    setQueuedUrls((init) => {
                        if (init[0] === data.url) init.shift();
                        return [...init];
                    });
                },
                (data) => {
                    setDownloadedList((init) => [...init, data]);
                    setDownloadingItem(null);
                },
                (url, error) => {
                    setDownloadedList((init) => {
                        const index = init.findIndex((e) => e.url === url);
                        if (index >= 0)
                            init[index] = {
                                url,
                                error,
                            };
                        else
                            init.push({
                                url,
                                error,
                            });
                        return [...init];
                    });
                    // window.electron.dialog.showErrorBox("Error", error);
                },
                () => setDownloadingItem(null),
                (error) =>
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
            );
        }
    };

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Toaster />
            <div id="app" className="m-auto mt-10 w-[600px]">
                <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl w-full flex flex-row whitespace-nowrap items-center">
                    Youtube Downloader
                    <div className="flex flex-row space-x-2 w-full justify-end">
                        <ToggleTheme />
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="p-2">
                                    <FontAwesomeIcon icon={faCog} className="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl">Settings</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col w-full space-y-2">
                                    <div className="p-4 rounded-lg border shadow-sm">
                                        <Label className="font-normal flex flex-row items-center justify-between w-full">
                                            Remember last selected options
                                            <Switch checked={useLast} onCheckedChange={setUseLast} />
                                        </Label>
                                    </div>
                                    <div className="p-4 rounded-lg border shadow-sm space-y-2">
                                        <Label className="font-normal flex flex-row items-center justify-between w-full">
                                            Set Cookies
                                        </Label>
                                        <DialogDescription className="text-xs">
                                            You can access private videos, also helps in download speed.
                                        </DialogDescription>
                                        <div className="flex flex-row space-x-2 w-full">
                                            <Input
                                                placeholder="Paste Cookies"
                                                readOnly
                                                value={cookies}
                                                ref={cookiesRef}
                                                onPaste={(e) => {
                                                    console.log(e.clipboardData.getData("text/plain"));
                                                    setCookies(e.clipboardData.getData("text/plain"));
                                                }}
                                            />
                                            {!cookies && (
                                                <Button
                                                    className="px-2 w-20"
                                                    onClick={(e) => {
                                                        const a = cookiesRef.current;
                                                        if (a) {
                                                            setCookies(a.value);
                                                            localStorage.setItem("ytdl-cookies", a.value);
                                                        }
                                                    }}
                                                    variant={"outline"}
                                                >
                                                    Save
                                                </Button>
                                            )}
                                            {cookies && (
                                                <Button
                                                    className="px-2 w-20"
                                                    onClick={(e) => {
                                                        setCookies("");
                                                        localStorage.setItem("ytdl-cookies", "");
                                                    }}
                                                    variant={"outline"}
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border shadow-sm space-y-2">
                                        <Label className="font-normal flex flex-row items-center justify-between w-full">
                                            About
                                        </Label>
                                        <div className="flex text-sm flex-row text-muted-foreground space-x-2 justify-start items-center">
                                            <span className="text-center">
                                                Version {window.electron.app.getVersion()}
                                            </span>
                                            <Separator orientation="vertical" className="h-5 mx-2 " />
                                            <Button asChild className="w-fit" variant={"secondary"}>
                                                <a href="https://github.com/mienaiyami/ytdl-gui" target="_blank">
                                                    Home Page
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </h1>
                <Separator className="my-4" />
                <URLInput value={urls} setValue={setUrls} />
                <Separator className="my-4" />
                <DLOptionInputs download={download} />
                <Dialog open={downloadModalOpen}>
                    <DialogContent className="max-h-[90vh] flex flex-col">
                        <DialogHeader className="h-fit">
                            <DialogTitle className="text-2xl">Downloading</DialogTitle>
                        </DialogHeader>
                        {/* <DialogTitle className="text-2xl">Queue</DialogTitle> */}

                        <div className="overflow-y-auto p-2 flex flex-col space-y-2 h-full">
                            {downloadedList.map((e, i) => (
                                <DownloadedItem {...e} key={e.url + i} />
                            ))}
                            {downloadingItem && <DownloadingItem {...downloadingItem} />}
                            {queuedUrls.map((e, i) => (
                                <div
                                    className="p-2 rounded-lg border shadow-sm text-muted-foreground text-sm select-text"
                                    key={e + i}
                                >
                                    {e}
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="h-fit relative bottom-0">
                            {downloadedList.length > 0 && (
                                <Button
                                    variant={"secondary"}
                                    onClick={() => {
                                        window.electron.shell.openPath(
                                            localStorage.getItem("ytdl-downloadPath") ||
                                                window.electron.app.getPath("downloads")
                                        );
                                    }}
                                >
                                    Show Downloads
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    window.location.reload();
                                }}
                            >
                                {!downloadingItem ? "Close" : "Cancel"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ThemeProvider>
    );
}

export default App;
