import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface ButtonProps {
    children: ReactNode;
    size?: "sm" | "md";
    variant?: "primary" | "outline" | "success";
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Reusable Button Component.
 * Supports variants (primary, outline, success, danger) and sizes (sm, md).
 */
export default function Button({
    children,
    size = "md",
    variant = "primary",
    onClick,
    className = "",
    disabled = false,
}: ButtonProps) {
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
    };

    const variantClasses = {
        primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300",
        outline: "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
        success: "bg-success-500/20 text-success-400 border border-success-500/30 hover:bg-success-500/30",
        danger: "bg-danger-500/20 text-danger-400 border border-danger-500/30 hover:bg-danger-500/30", // adding danger variant outside of test library 
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
                sizeClasses[size],
                variantClasses[variant],
                disabled && "cursor-not-allowed opacity-50",
                className
            )}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
