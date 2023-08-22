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
        addMetaData: boolean;
    };

    type DownloadingData = {
        started: Date;
        building: boolean;
        title: string;
        url: string;
        audio: {
            total: number;
            downloaded: number;
            speed: number;
            elapsed: string;
        } | null;
        video: {
            total: number;
            downloaded: number;
            speed: number;
            elapsed: string;
        } | null;
    };
    type DownloadedData =
        | {
              started: Date;
              ended: Date;
              title: string;
              url: string;
              audio: {
                  total: number;
                  elapsed: string;
              } | null;
              video: {
                  total: number;
                  elapsed: string;
              } | null;
          }
        | {
              url: string;
              error: string;
          };
    // interface Window {
    //     YTDL: YTDL;
    // }
}

// window.YTDL = new YTDL();
