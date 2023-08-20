import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import sanitize from "sanitize-filename";
// import { fileTypeFromBuffer } from "file-type";
import { VIDEO_QUALITY } from "../renderer/utils";
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
// for no-cors
// import 2 from "node-2";

type DownloadProgressData = {
    total: number;
    downloaded: number;
    timeElapsed: string;
    speed: string;
};

export class YTDL {
    #downloadQueue = [] as string[];
    #audioBitrate = 256;
    #format = "mp3" as DownloadOptions["format"];
    #videoQuality = "720p" as DownloadOptions["videoQuality"];
    #embedAlbumArt = true;
    #suffixQuality = true;
    #downloadPath = "";
    #cookies = "";
    byteToMB(size: number): string {
        return (size / 1024 / 1024).toFixed(2);
    }
    setBitrate(bitrate: number) {
        if (bitrate >= 32 && bitrate <= 320) this.#audioBitrate = bitrate;
        return this;
    }
    setQuality(quality: (typeof VIDEO_QUALITY)[number]) {
        if (VIDEO_QUALITY.includes(quality)) this.#videoQuality = quality;
        return this;
    }
    setQueue(urls: string[]) {
        this.#downloadQueue.push(...urls);
        return this;
    }
    validateURL(url: string) {
        return ytdl.validateURL(url);
    }
    startDownload(options: DownloadOptions, cb?: () => void) {
        this.#format = options.format;
        this.#audioBitrate = parseInt(options.audioBitrate);
        this.#videoQuality = options.videoQuality;
        this.#embedAlbumArt = options.embedAlbumArt;
        this.#suffixQuality = options.suffixQuality;
        this.#downloadPath = options.downloadPath;
        this.#cookies = options.cookies;

        if (this.#downloadQueue.length > 0) {
            const url = this.#downloadQueue.shift();
            if (url) {
                if (this.#format === "mp3")
                    this.#getAudio(
                        url,
                        (data) => {
                            console.log(data);
                        },
                        (err) => console.error(err),
                        (time) => console.log(time)
                    );
                if (this.#format === "mp4")
                    this.#getVideo(
                        url,
                        (data) => {
                            console.log(data);
                        },
                        (err) => console.error(err),
                        (time) => console.log(time)
                    );
            }
        } else cb && cb();
    }
    async #getAudio(
        url: string,
        onProgress: (data: DownloadProgressData) => void,
        onError: (err: any) => void,
        onEnd: (time: Date) => void
    ) {
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: {
                    cookie: this.#cookies,
                },
            },
        });
        const audios = ytdl.filterFormats(info.formats, "audioonly");
        if (audios.length === 0) return console.error("No audio found.");
        const best =
            [...audios].reverse().find((e) => e.audioBitrate && e.audioBitrate >= this.#audioBitrate) || audios[0];
        const title = sanitize(info.videoDetails.title);
        console.log({ best, title });
        const stream = ytdl.downloadFromInfo(info, {
            format: best,
            requestOptions: {
                headers: {
                    cookie: this.#cookies,
                },
            },
        });

        const started = new Date();
        const filename = window.electron.path.join(
            this.#downloadPath,
            `${title}${this.#suffixQuality ? `_${this.#audioBitrate}kbps` : ""}.mp3`
        );
        let prevSize = 0;
        let prevTime = started;

        stream.on("progress", (e, downloaded, total) => {
            const timeNow = new Date();
            if (timeNow.getTime() - prevTime.getTime() < 100) return;
            onProgress({
                downloaded,
                total,
                timeElapsed: new Date(timeNow.getTime() - started.getTime()).toISOString().substring(11, 19),
                speed: this.byteToMB((downloaded - prevSize) / ((timeNow.getTime() - prevTime.getTime()) / 1000)),
            });
            prevSize = downloaded;
            prevTime = timeNow;
        });

        const ffmpegCommand = ffmpeg(stream)
            .audioBitrate(this.#audioBitrate)
            .outputOption("-id3v2_version", "3")
            //replace(/'/g, "\\'")
            .outputOption("-metadata", `title=${info.videoDetails.title}`)
            .outputOption("-metadata", `artist=${info.videoDetails.author.name}`);
        let thumbPath = window.electron.path.join(this.#downloadPath, title);
        if (this.#embedAlbumArt) {
            if (this.#embedAlbumArt) {
                const raw_thumb = await fetch(info.videoDetails.thumbnails.at(-1)!.url);
                if (raw_thumb.ok) {
                    const arraybuffer_thumb = await raw_thumb.arrayBuffer();
                    const uint8array = new Uint8Array(arraybuffer_thumb);
                    const buffer_thumb = Buffer.from(arraybuffer_thumb);
                    // const type = await fileTypeFromBuffer(buffer_thumb);
                    // if (type) thumbPath += type.ext;
                    window.electron.fs.writeFileSync(thumbPath, buffer_thumb);
                } else console.error("Thumbnail did not download.");
            }
            if (window.electron.fs.existsSync(thumbPath))
                ffmpegCommand.input(thumbPath).outputOption("-map", "0:0").outputOption("-map", "1:0");
        }
        ffmpegCommand
            .save(filename)
            .on("error", (err) => {
                onError(err);
                console.error(err);
                window.electron.fs.existsSync(thumbPath) && window.electron.fs.rmSync(thumbPath);
            })
            .on("end", () => {
                onEnd(new Date());
                window.electron.fs.existsSync(thumbPath) && window.electron.fs.rmSync(thumbPath);
            });
    }

    async #getVideo(
        url: string,
        onProgress: (data: DownloadProgressData) => void,
        onError: (err: any) => void,
        onEnd: (time: Date) => void
    ) {
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: {
                    cookie: this.#cookies,
                },
            },
        });
        const videos = ytdl.filterFormats(
            info.formats,
            (format) => format.qualityLabel && format.container === "mp4" && !format.hasAudio
        );
        if (videos.length === 0) return console.error("No video found.");
        let quality = 4;
        let bestVideo: ytdl.videoFormat | undefined;
        while (true) {
            bestVideo = videos.find((e) => e.qualityLabel === this.#videoQuality);
            if (bestVideo) break;
            quality--;
            if (quality < 0) break;
            // console.warn(
            //     chalk.yellowBright(
            //         `${qualityOrder[quality + 1]} not found, trying ${
            //             qualityOrder[quality]
            //         }`
            //     )
            // );
        }
        if (bestVideo === undefined) {
            // console.error(chalk.redBright("Video not found."));
            window.electron.dialog.showErrorBox("Video not found", "Video not found at any quality.");
            // this.startDownload();
            return;
        }
        const videoStream = ytdl.downloadFromInfo(info, {
            format: bestVideo,
            requestOptions: {
                headers: {
                    cookie: this.#cookies,
                },
            },
        });

        const audios = ytdl.filterFormats(info.formats, "audioonly");
        if (audios.length === 0) return console.error("No audio found.");
        const bestAudio =
            [...audios].reverse().find((e) => e.audioBitrate && e.audioBitrate >= this.#audioBitrate) || audios[0];
        const audioStream = ytdl.downloadFromInfo(info, {
            format: bestAudio,
            requestOptions: {
                headers: {
                    cookie: this.#cookies,
                },
            },
        });

        const title = sanitize(info.videoDetails.title);
        // console.log(chalk.greenBright("Title:"), title);
        const started = new Date();
        // console.log(
        //     chalk.greenBright("Started:"),
        //     started.toLocaleTimeString()
        // );
        // const spinner = createSpinner("Starting Download...").start();
        const filename = window.electron.path.join(
            this.#downloadPath,
            `${title}${this.#suffixQuality ? `_${this.#videoQuality}` : ""}.mp4`
        );

        const tempAudio = window.electron.path.join(this.#downloadPath, "temp.mp3");
        const tempVideo = window.electron.path.join(this.#downloadPath, "temp.mp4");

        const progress = {
            video: 0,
            audio: 0,
            videoTotal: 0,
            audioTotal: 0,
            videoPrevSize: 0,
            audioPrevSize: 0,
            videoPreTime: started,
            audioPreTime: started,
            // so downloadSuccess dont get called twice
            finished: 0,
        };
        let prevTime = started;
        const update = () => {
            const timeNow = new Date();
            if (timeNow.getTime() - prevTime.getTime() < 200) return;
            // onProgress({
            //     downloaded
            // })
            console.log(
                `Audio: [${this.byteToMB(progress.audio)} / ${this.byteToMB(
                    progress.audioTotal
                )} MB] @ ${this.byteToMB(
                    (progress.audio - progress.audioPrevSize) / ((timeNow.getTime() - prevTime.getTime()) / 1000)
                )}MBps [${new Date(progress.audioPreTime.getTime() - started.getTime())
                    .toISOString()
                    .substring(11, 19)}]\n` +
                    `  Video: [${this.byteToMB(progress.video)} / ${this.byteToMB(
                        progress.videoTotal
                    )} MB] @ ${this.byteToMB(
                        (progress.video - progress.videoPrevSize) /
                            ((timeNow.getTime() - prevTime.getTime()) / 1000)
                    )}MBps [${new Date(progress.videoPreTime.getTime() - started.getTime())
                        .toISOString()
                        .substring(11, 19)}]`
            );
            progress.audioPrevSize = progress.audio;
            progress.videoPrevSize = progress.video;
            if (progress.audio !== progress.audioTotal) progress.audioPreTime = timeNow;
            if (progress.video !== progress.videoTotal) progress.videoPreTime = timeNow;
            prevTime = timeNow;
        };

        const downloadSuccess = () => {
            progress.finished++;
            if (progress.finished < 2) return;
            console.log("downloaded both");
            // spinner.success();
            // console.log(
            //     chalk.greenBright("Downloaded:"),
            //     new Date().toLocaleTimeString()
            // );
            // setTimeout(() => {
            // const buildSpinner = createSpinner().start({
            //     text: "Building...",
            // });
            console.log("building");
            ffmpeg()
                .input(tempVideo)
                .input(tempAudio)
                .addOption(["-c:v", "copy"])
                .addOption(["-c:a", "aac"])
                // .addOption(["-map", "0:v:0"])
                // .addOption(["-map", "1:a:0"])
                .output(filename)
                .on("error", (err) => {
                    onError(err);
                    // buildSpinner.error({ text: err.message });
                    // console.log(err);
                    // this.startDownload();
                })
                .on("end", () => {
                    if (window.electron.fs.existsSync(tempAudio)) window.electron.fs.rmSync(tempAudio);
                    if (window.electron.fs.existsSync(tempVideo)) window.electron.fs.rmSync(tempVideo);
                    onEnd(new Date());
                    // buildSpinner.success();
                    // console.log(
                    //     chalk.greenBright("Built:"),
                    //     new Date().toLocaleTimeString()
                    // );
                    // this.startDownload();
                })
                .run();
            // }, 500);
        };

        audioStream.on("progress", (e, downloaded, total) => {
            progress.audio = downloaded;
            progress.audioTotal = total;
            update();
            // spinner.update({
            //     text: `${(downloaded)} / ${(
            //         total
            //     )}MB`,
            // });
        });
        videoStream.on("progress", (e, downloaded, total) => {
            progress.video = downloaded;
            progress.videoTotal = total;
            update();
            // spinner.update({
            //     text: `${(downloaded)} / ${(
            //         total
            //     )}MB`,
            // });
        });

        const ffmpegCommand_Audio = ffmpeg(audioStream)
            .audioBitrate(this.#audioBitrate)
            .save(tempAudio)
            .on("error", (err) => {
                onError(err);
                // spinner.error({ text: err.message });
                // console.log(err);
                // this.startDownload();
                process.exit(1);
            })
            .on("end", () => {
                downloadSuccess();
            });

        const ffmpegCommand_Video = ffmpeg(videoStream)
            .save(tempVideo)
            .on("error", (err) => {
                onError(err);
                // spinner.error({ text: err.message });
                // console.log(err);
                // this.startDownload();
                process.exit(1);
            })
            .on("end", () => {
                downloadSuccess();
            })
            .noAudio();
    }
}
