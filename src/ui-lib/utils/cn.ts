import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes conditionally.
 * Combines `clsx` (conditional classes) and `tailwind-merge` (deduplication).
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(...inputs));
}
