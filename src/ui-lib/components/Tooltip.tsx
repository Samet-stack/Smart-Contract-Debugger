import type { ReactNode } from "react";

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: "top" | "bottom";
    className?: string; // Class for the trigger element
}

export default function Tooltip({ children, content, position = "bottom", className = "" }: TooltipProps) {
    return (
        <div className={`relative inline-block group ${className}`}>
            {children}
            <div
                className={`
          invisible absolute left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 z-[100] pointer-events-none whitespace-nowrap
          ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"}
        `}
            >
                <div className="relative">
                    <div className="drop-shadow-md rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900 border border-transparent dark:border-white">
                        {content}
                    </div>
                    {/* Arrow */}
                    <div
                        className={`
              absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45
              ${position === "top"
                                ? "-bottom-1 bg-gray-900 dark:bg-white"
                                : "-top-1 bg-gray-900 dark:bg-white"
                            }
            `}
                    ></div>
                </div>
            </div>
        </div>
    );
}
