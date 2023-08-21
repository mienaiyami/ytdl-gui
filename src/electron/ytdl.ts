import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import sanitize from "sanitize-filename";
// import { fileTypeFromBuffer } from "file-type";
import { VIDEO_QUALITY } from "../renderer/utils";
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// type DownloadProgressData = {
//     total: number;
//     downloaded: number;
//     timeElapsed: string;
//     speed: string;
// };

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
    startDownload(
        options: DownloadOptions,
        onProgress: (data: DownloadingData) => void,
        onItemEnd: (data: DownloadedData) => void,
        onError: (url: string, error: string) => void,
        onComplete: () => void,
        toast: (error: string) => void
    ) {
        this.#format = options.format;
        this.#audioBitrate = parseInt(options.audioBitrate);
        this.#videoQuality = options.videoQuality;
        this.#embedAlbumArt = options.embedAlbumArt;
        this.#suffixQuality = options.suffixQuality;
        this.#downloadPath = options.downloadPath;
        this.#cookies = options.cookies;

        const next = () => {
            if (this.#downloadQueue.length > 0) {
                const url = this.#downloadQueue.shift();
                if (url) {
                    if (this.#format === "mp3")
                        this.#getAudio(url, onProgress, onItemEnd, (err) => onError(url, err), next, toast);
                    if (this.#format === "mp4")
                        this.#getVideo(url, onProgress, onItemEnd, (err) => onError(url, err), next, toast);
                }
            } else onComplete();
        };
        next();
    }
    async #getAudio(
        url: string,
        onProgress: (data: DownloadingData) => void,
        onEnd: (data: DownloadedData) => void,
        onError: (error: string) => void,
        next: () => void,
        toast: (error: string) => void
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
        const progress: DownloadingData = {
            video: null,
            audio: {
                downloaded: 0,
                total: 0,
                speed: 0,
                elapsed: "",
            },
            building: false,
            started,
            title,
            url,
        };
        stream.on("progress", (e, downloaded, total) => {
            const timeNow = new Date();
            if (timeNow.getTime() - prevTime.getTime() < 200) return;
            const speed = parseFloat(
                this.byteToMB((downloaded - prevSize) / ((timeNow.getTime() - prevTime.getTime()) / 1000))
            );
            const elapsed = new Date(timeNow.getTime() - started.getTime()).toISOString().substring(11, 19);

            progress.audio = {
                downloaded,
                elapsed,
                speed,
                total,
            };
            onProgress(progress);
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
                try {
                    const raw_thumb = await fetch(info.videoDetails.thumbnails.at(-1)!.url);
                    if (raw_thumb.ok) {
                        const arraybuffer_thumb = await raw_thumb.arrayBuffer();
                        // const uint8array = new Uint8Array(arraybuffer_thumb);
                        const buffer_thumb = Buffer.from(arraybuffer_thumb);
                        // const type = await fileTypeFromBuffer(buffer_thumb);
                        // if (type) thumbPath += type.ext;
                        window.electron.fs.writeFileSync(thumbPath, buffer_thumb);
                    }
                } catch (reason) {
                    // console.error("Thumbnail did not download.");
                    // onError("Thu")
                    toast("Thumbnail did not download.");
                }
            }
            if (window.electron.fs.existsSync(thumbPath))
                ffmpegCommand.input(thumbPath).outputOption("-map", "0:0").outputOption("-map", "1:0");
        }
        ffmpegCommand
            .save(filename)
            .on("error", (err) => {
                if (typeof err === "string") onError(err);
                else onError(err?.toString());
                console.error(err);
                window.electron.fs.existsSync(thumbPath) && window.electron.fs.rmSync(thumbPath);
                next();
            })
            .on("end", () => {
                const timeNow = new Date();
                window.electron.fs.existsSync(thumbPath) && window.electron.fs.rmSync(thumbPath);
                if (progress.audio)
                    onEnd({
                        audio: {
                            elapsed: progress.audio.elapsed,
                            total: progress.audio.total,
                        },
                        ended: timeNow,
                        started: progress.started,
                        title,
                        url,
                        video: null,
                    });
                next();
            });
    }

    async #getVideo(
        url: string,
        onProgress: (data: DownloadingData) => void,
        onEnd: (data: DownloadedData) => void,
        onError: (error: string) => void,
        next: () => void,
        toast: (error: string) => void
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
        let quality = VIDEO_QUALITY.findIndex((e) => e === this.#videoQuality);
        let bestVideo: ytdl.videoFormat | undefined;
        while (true) {
            bestVideo = videos.find((e) => e.qualityLabel === VIDEO_QUALITY[quality]);
            if (bestVideo) break;
            quality--;
            if (quality < 0) break;
            toast(`${VIDEO_QUALITY[quality + 1]} not found, trying for ${VIDEO_QUALITY[quality]}...`);
        }
        if (bestVideo === undefined) {
            onError("Video not found at any quality.");
            next();
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
        const started = new Date();
        const filename = window.electron.path.join(
            this.#downloadPath,
            `${title}${this.#suffixQuality ? `_${VIDEO_QUALITY[quality]}` : ""}.mp4`
        );

        const tempAudio = window.electron.path.join(this.#downloadPath, "temp.mp3");
        const tempVideo = window.electron.path.join(this.#downloadPath, "temp.mp4");

        const progress_fake = {
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

        const progress: DownloadingData = {
            video: {
                downloaded: 0,
                total: 0,
                speed: 0,
                elapsed: "~",
            },
            audio: {
                downloaded: 0,
                total: 0,
                speed: 0,
                elapsed: "~",
            },
            building: false,
            started,
            title,
            url,
        };
        let prevTime = started;
        const update = () => {
            const timeNow = new Date();
            if (timeNow.getTime() - prevTime.getTime() < 200) return;
            progress.audio = {
                downloaded: progress_fake.audio,
                elapsed: new Date(progress_fake.audioPreTime.getTime() - started.getTime())
                    .toISOString()
                    .substring(11, 19),
                speed: parseFloat(
                    this.byteToMB(
                        (progress_fake.audio - progress_fake.audioPrevSize) /
                            ((timeNow.getTime() - prevTime.getTime()) / 1000)
                    )
                ),
                total: progress_fake.audioTotal,
            };
            progress.video = {
                downloaded: progress_fake.video,
                elapsed: new Date(progress_fake.videoPreTime.getTime() - started.getTime())
                    .toISOString()
                    .substring(11, 19),
                speed: parseFloat(
                    this.byteToMB(
                        (progress_fake.video - progress_fake.videoPrevSize) /
                            ((timeNow.getTime() - prevTime.getTime()) / 1000)
                    )
                ),
                total: progress_fake.videoTotal,
            };
            onProgress(progress);
            progress_fake.audioPrevSize = progress_fake.audio;
            progress_fake.videoPrevSize = progress_fake.video;
            if (progress_fake.audio !== progress_fake.audioTotal) progress_fake.audioPreTime = timeNow;
            if (progress_fake.video !== progress_fake.videoTotal) progress_fake.videoPreTime = timeNow;
            prevTime = timeNow;
        };

        const downloadSuccess = () => {
            progress_fake.finished++;
            if (progress_fake.finished < 2) return;
            progress.building = true;
            onProgress(progress);
            ffmpeg()
                .input(tempVideo)
                .input(tempAudio)
                .addOption(["-c:v", "copy"])
                .addOption(["-c:a", "aac"])
                // .addOption(["-map", "0:v:0"])
                // .addOption(["-map", "1:a:0"])
                .output(filename)
                .on("error", (err) => {
                    if (typeof err === "string") onError(err);
                    else onError(err?.toString());
                    console.error(err);
                    next();
                })
                .on("end", () => {
                    if (window.electron.fs.existsSync(tempAudio)) window.electron.fs.rmSync(tempAudio);
                    if (window.electron.fs.existsSync(tempVideo)) window.electron.fs.rmSync(tempVideo);
                    // onEnd(new Date());
                    onEnd({
                        ended: new Date(),
                        url,
                        title,
                        started,
                        audio: {
                            elapsed: progress.audio?.elapsed || "~",
                            total: progress.audio?.total || 0,
                        },
                        video: {
                            elapsed: progress.video?.elapsed || "~",
                            total: progress.video?.total || 0,
                        },
                    });
                    next();
                })
                .run();
            // }, 500);
        };

        audioStream.on("progress", (e, downloaded, total) => {
            progress_fake.audio = downloaded;
            progress_fake.audioTotal = total;
            update();
        });
        videoStream.on("progress", (e, downloaded, total) => {
            progress_fake.video = downloaded;
            progress_fake.videoTotal = total;
            update();
        });

        const ffmpegCommand_Audio = ffmpeg(audioStream)
            .audioBitrate(this.#audioBitrate)
            .save(tempAudio)
            .on("error", (err) => {
                if (typeof err === "string") onError(err);
                else onError(err?.toString());
                next();
            })
            .on("end", () => {
                downloadSuccess();
            });

        const ffmpegCommand_Video = ffmpeg(videoStream)
            .save(tempVideo)
            .on("error", (err) => {
                if (typeof err === "string") onError(err);
                else onError(err?.toString());
                next();
            })
            .on("end", () => {
                downloadSuccess();
            })
            .noAudio();
    }
}
