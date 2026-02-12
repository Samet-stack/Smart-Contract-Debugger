import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
    headerStart?: ReactNode; // New prop for left-side actions
    headerEnd?: ReactNode;
    stickyHeader?: boolean;
}

/**
 * Reusable Card Component.
 * Used for wrapping feature sections (like Stack, Memory, Instructions).
 * Can define a title and an optional header action (headerEnd).
 */
export default function Card({ title, children, className = "", headerStart, headerEnd, stickyHeader = false }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-gray-200 bg-white/50 dark:border-gray-800 dark:bg-gray-900/50 transition-colors duration-300 flex flex-col overflow-hidden",
                className
            )}
        >
            <div className={cn(
                "px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-2",
                stickyHeader && "sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
            )}>
                {headerStart && <div className="flex-shrink-0 mr-2">{headerStart}</div>}
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">{title}</h3>
                {headerEnd && <div className="w-full sm:w-auto sm:ml-auto overflow-x-auto">{headerEnd}</div>}
            </div>
            <div className="flex-1 min-h-0 min-w-0 flex flex-col p-4">{children}</div>
        </div>
    );
}
