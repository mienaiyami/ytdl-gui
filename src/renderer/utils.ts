// import { YTDL } from "./ytdl";

export const BITRATE_OPTIONS = [
    "48kbps",
    "64kbps",
    "96kbps",
    "128kbps",
    "160kbps",
    "192kbps",
    "256kbps",
    "320kbps",
] as const;

export const VIDEO_QUALITY = ["144p", "240p", "360p", "480p", "720p", "720p60", "1080p", "1080p60"] as const;

declare global {
    type DownloadOptions = {
        format: "mp3" | "mp4";
        audioBitrate: (typeof BITRATE_OPTIONS)[number];
        videoQuality: (typeof VIDEO_QUALITY)[number];
        embedAlbumArt: boolean;
        suffixQuality: boolean;
        downloadPath: string;
        cookies: string;
    };
    // interface Window {
    //     YTDL: YTDL;
    // }
}

// window.YTDL = new YTDL();
