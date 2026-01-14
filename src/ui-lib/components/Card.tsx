import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-gray-200 bg-white/50 dark:border-gray-800 dark:bg-gray-900/50 transition-colors duration-300",
                className
            )}
        >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

