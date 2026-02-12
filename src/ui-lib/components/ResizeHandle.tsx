import { Separator } from "react-resizable-panels";
import { cn } from "../../ui-lib/utils/cn";

interface ResizeHandleProps {
    className?: string;
    direction?: "horizontal" | "vertical";
}

export default function ResizeHandle({ className, direction = "horizontal" }: ResizeHandleProps) {
    return (
        <Separator
            className={cn(
                "group flex items-center justify-center transition-colors relative z-10 select-none",
                direction === "horizontal"
                    ? "w-2 hover:bg-brand-500/10 active:bg-brand-500/20 cursor-col-resize h-full mx-1"
                    : "h-2 hover:bg-brand-500/10 active:bg-brand-500/20 cursor-row-resize w-full my-1",
                className
            )}
        >
            <div className={cn(
                "bg-gray-200 dark:bg-gray-700 rounded-full transition-colors group-hover:bg-brand-400 dark:group-hover:bg-brand-600",
                direction === "horizontal"
                    ? "w-1 h-8"
                    : "h-1 w-8"
            )} />
        </Separator>
    );
}
