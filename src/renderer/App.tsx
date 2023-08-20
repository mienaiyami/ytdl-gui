import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";

import URLInput from "./components/URLInput";
import ToggleTheme from "./components/ToggleTheme";
import DLOptionInputs from "./components/DLOptionInputs";

function App() {
    const [urls, setUrls] = useState<string[]>([]);
    const download = (options: DownloadOptions) => {
        if (urls.length > 0) {
            console.log(window.ytdl.setQueue(urls).startDownload(options));
        }
    };

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div id="app" className="m-auto mt-10 w-[600px]">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl w-full">
                    Youtube Downloader
                    <ToggleTheme />
                </h1>
                <Separator className="my-4" />
                <URLInput value={urls} setValue={setUrls} />
                <Separator className="my-4" />
                <DLOptionInputs download={download} />
            </div>
        </ThemeProvider>
    );
}

export default App;
