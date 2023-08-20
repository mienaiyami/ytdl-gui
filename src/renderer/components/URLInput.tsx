import React, { useLayoutEffect, useState } from "react";

import { Input } from "@/components/ui/input";

type PropType = {
    value: string[];
    setValue: React.Dispatch<React.SetStateAction<string[]>>;
};

const URLInput = (props: PropType) => {
    // const [proxy,setProxy] = useState("")

    // useLayoutEffect(()=>{
    //     setProxy
    // },[props.value])

    const [isValid, setValid] = useState(true);

    const validateURLs = (urls: string) => {
        try {
            const urlsArr = urls.split(" ").filter((e) => e);
            urlsArr.forEach((e) => {
                if (!window.ytdl.validateURL(e)) throw Error("Invalid URL.");
            });
            return urlsArr;
        } catch (reason) {
            return false;
        }
    };
    return (
        <div className="">
            <Input
                placeholder="Enter space separated URLs"
                // value={props.value.join(" ")}
                defaultValue={props.value.join(" ")}
                onChange={(e) => {
                    const urls = validateURLs(e.currentTarget.value);
                    if (urls) {
                        setValid(true);
                        props.setValue(urls);
                    } else setValid(false);
                }}
                className={`${!isValid ? "!ring-destructive" : ""}`}
            />
            {props.value.length > 0 && (
                <div
                    className={`p-2 pb-0 flex flex-row space-x-2 text-sm text-muted-foreground  ${
                        !isValid ? "text-destructive" : ""
                    }`}
                >
                    <span>{props.value.length}</span>
                    <p className={`text-sm max-h-20 overflow-auto`}>{props.value.join(", ")}</p>
                </div>
            )}
        </div>
    );
};

export default URLInput;
