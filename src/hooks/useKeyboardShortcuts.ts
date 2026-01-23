import { useEffect } from "react";

interface ShortcutsOptions {
    onNext: () => void;
    onPrev: () => void;
    onToggleAutoNext: () => void;
    onToggleAutoPrev: () => void;
    onSpeedUp: () => void;
    onSpeedDown: () => void;
    onTogglePlay: () => void; // Optionnel (Espace)
}

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
            // 1. Sécurité : Ignorer si l'utilisateur écrit dans un input
            const target = event.target as HTMLElement;
            if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
                return;
            }
            const key = event.key;
            const shift = event.shiftKey;
            // 2. Mapping des touches
            switch (key) {
                case "n":
                    if (shift) onToggleAutoNext(); // Shift + n -> Toggle Auto Forward
                    else onNext();                 // n -> Next Step
                    break;

                case "N": // Si le clavier envoie directement N
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
