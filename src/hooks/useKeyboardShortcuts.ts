import { useEffect } from "react";

interface ShortcutsOptions {
    onNext: () => void;
    onPrev: () => void;
    onToggleAutoNext: () => void;
    onToggleAutoPrev: () => void;
    onSpeedUp: () => void;
    onSpeedDown: () => void;
    onTogglePlay: () => void; // Optional (Space)
}

/**
 * Hook to handle global keyboard shortcuts for the debugger.
 * Includes safety checks to avoid triggering shortcuts when typing in input fields.
 *
 * Mappings:
 * - ArrowRight / n: Next Step
 * - ArrowLeft / p: Previous Step
 * - Shift + n / N: Toggle Auto-Next
 * - Shift + p / P: Toggle Auto-Prev
 * - a: Speed Up
 * - d: Speed Down
 * - Space: Toggle Play/Pause
 */
export const useKeyboardShortcuts = ({
    onNext,
    onPrev,
    onToggleAutoNext,
    onToggleAutoPrev,
    onSpeedUp,
    onSpeedDown,
    onTogglePlay,
}: ShortcutsOptions) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 1. Security: Ignore if user is typing in an input
            const target = event.target as HTMLElement;
            if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
                return;
            }
            const key = event.key;
            const shift = event.shiftKey;
            // 2. Key mapping
            switch (key) {
                case "ArrowRight":
                    onNext();
                    break;
                case "ArrowLeft":
                    onPrev();
                    break;
                case "n":
                    if (shift) onToggleAutoNext(); // Shift + n -> Toggle Auto Forward
                    else onNext();                 // n -> Next Step
                    break;

                case "N": // If keyboard triggers N directly
                    onToggleAutoNext();
                    break;
                case "p":
                    if (shift) onToggleAutoPrev(); // Shift + p -> Toggle Auto Backward
                    else onPrev();                 // p -> Prev Step
                    break;

                case "P":
                    onToggleAutoPrev();
                    break;
                case "a":
                    onSpeedUp();
                    break;
                case "d":
                    onSpeedDown();
                    break;
                case " ":
                    event.preventDefault();
                    onTogglePlay();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        // Cleanup 
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onNext, onPrev, onToggleAutoNext, onToggleAutoPrev, onSpeedUp, onSpeedDown, onTogglePlay]);
};
