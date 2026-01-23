import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
    headerRight?: ReactNode;
}

export default function Card({ title, children, className = "", headerRight }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-gray-200 bg-white/50 dark:border-gray-800 dark:bg-gray-900/50 transition-colors duration-300",
                className
            )}
        >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
                {headerRight && <div className="text-xs text-gray-500">{headerRight}</div>}
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-4">{children}</div>
        </div>
    );
}

