import React from "react";
import { BITRATE_OPTIONS, VIDEO_QUALITY } from "../utils";
import { useForm } from "react-hook-form";
const SYS_DL_PATH = window.electron.app.getPath("downloads");

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const DLOptionInputs = ({ download }: { download: (options: DownloadOptions) => void }) => {
    const form = useForm({
        defaultValues: {
            format: localStorage.getItem("ytdl-format") || "mp3",
            audioBitrate: localStorage.getItem("ytdl-audioBitrate") || "256kbps",
            videoQuality: localStorage.getItem("ytdl-videoQuality") || "720p",
            suffixQuality: JSON.parse(localStorage.getItem("ytdl-suffixQuality") || "true") as boolean,
            embedAlbumArt: JSON.parse(localStorage.getItem("ytdl-embedAlbumArt") || "true") as boolean,
            downloadPath: localStorage.getItem("ytdl-downloadPath") || SYS_DL_PATH,
            cookies: localStorage.getItem("ytdl-cookies") || "",
            addMetaData: JSON.parse(localStorage.getItem("ytdl-addMetaData") || "true") as boolean,
        } as DownloadOptions,
    });

    const onSubmit = (data: DownloadOptions) => {
        download(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                        <FormItem className="flex flex-row space-x-4 items-center space-y-0">
                            <FormLabel className="text-xl min-w-[130px]">Format</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex text-lg flex-row space-x-2 space-y-0"
                                >
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="mp3" />
                                        </FormControl>
                                        <FormLabel className="cursor-pointer p-2 pl-0">mp3</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="mp4" />
                                        </FormControl>
                                        <FormLabel className="cursor-pointer p-2 pl-0">mp4</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="audioBitrate"
                    render={({ field }) => (
                        <FormItem className="flex flex-row space-x-4 items-center space-y-0">
                            <FormLabel className="text-xl min-w-[130px]">Audio Bitrate</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-fit min-w-[110px]">
                                        <SelectValue placeholder="Select audio bitrate" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {BITRATE_OPTIONS.map((e) => (
                                        <SelectItem value={e} key={e}>
                                            {e}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {form.getValues("format") === "mp4" && (
                    <FormField
                        control={form.control}
                        name="videoQuality"
                        render={({ field }) => (
                            <FormItem className="flex flex-row space-x-4 items-center space-y-0">
                                <FormLabel className="text-xl min-w-[130px]">Video Quality</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-fit min-w-[110px]">
                                            <SelectValue placeholder="Select video quality" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {VIDEO_QUALITY.map((e) => (
                                            <SelectItem value={e} key={e}>
                                                {e}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <div className="flex flex-row  space-x-4">
                    <FormField
                        control={form.control}
                        name="suffixQuality"
                        render={({ field }) => (
                            <FormItem className="flex flex-row space-x-2 items-center space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="min-w-[130px]">Suffix Quality in Name</FormLabel>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.getValues("format") === "mp3" && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <FormField
                                control={form.control}
                                name="embedAlbumArt"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row space-x-2 items-center space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="min-w-[130px]">Embed Album Art</FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                    {form.getValues("format") === "mp3" && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <FormField
                                control={form.control}
                                name="addMetaData"
                                render={({ field }) => (
                                    <FormItem
                                        className="flex flex-row space-x-2 items-center space-y-0"
                                        title="Title and Artist name"
                                    >
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="min-w-[130px]">Add Metadata</FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="downloadPath"
                    render={({ field }) => (
                        <FormItem className="flex flex-row space-x-4 items-center space-y-0">
                            <FormLabel className="text-xl min-w-[130px] whitespace-nowrap">Download at</FormLabel>
                            <div className="flex flex-row space-x-2 w-full">
                                <FormControl>
                                    <Input
                                        placeholder="Download Destination"
                                        readOnly
                                        value={field.value}
                                        className="overflow-x-auto"
                                    />
                                </FormControl>
                                <FormControl>
                                    <Button
                                        className="px-6"
                                        variant={"outline"}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.electron.dialog
                                                .showOpenDialog({
                                                    defaultPath: field.value,
                                                    title: "Download Destination",
                                                    properties: ["openDirectory"],
                                                })
                                                .then((e) => {
                                                    if (typeof e.filePaths[0] === "string")
                                                        form.setValue("downloadPath", e.filePaths[0], {
                                                            shouldValidate: true,
                                                        });
                                                });
                                        }}
                                    >
                                        Select
                                    </Button>
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                    Start Download
                </Button>
            </form>
        </Form>
    );
};

export default DLOptionInputs;
