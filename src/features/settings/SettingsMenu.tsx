import { useRef, useEffect } from "react";
import { cn } from "../../ui-lib/utils/cn";

export type SettingsTab = "general" | "alias" | "shortcuts";

interface SettingsMenuProps {
    onSelect: (tab: SettingsTab) => void;
    onClose: () => void;
    className?: string;
}

/**
 * Settings Menu Dropdown.
 * Displays the list of available settings categories (General, Alias, Shortcuts).
 */
export default function SettingsMenu({ onSelect, onClose, className }: SettingsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const menuItems: { id: SettingsTab; label: string; icon: string }[] = [
        {
            id: "general",
            label: "General",
            icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        },
        {
            id: "alias",
            label: "Alias",
            icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        },
        {
            id: "shortcuts",
            label: "Shortcuts",
            icon: "M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
        },
    ];

    return (
        <div
            ref={menuRef}
            className={cn(
                "absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 z-50",
                className
            )}
        >
            <div className="flex flex-col gap-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            onSelect(item.id);
                            onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                    >
                        <svg
                            className="h-4 w-4 text-gray-400 dark:text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
