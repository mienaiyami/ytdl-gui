import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-regular-svg-icons";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/components/theme-provider";

const ToggleTheme = () => {
    const { setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="p-2 ml-auto">
                    <FontAwesomeIcon
                        icon={faSun}
                        className="absolute h-[1.2rem] w-[1.2rem] scale-100 dark:scale-0"
                    />
                    <FontAwesomeIcon
                        icon={faMoon}
                        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-0 dark:scale-100"
                    />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ToggleTheme;
