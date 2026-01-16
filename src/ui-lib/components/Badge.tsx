// Badge.tsx
// Composant Badge réutilisable (adapté de TailAdmin)
// Pour afficher des étiquettes colorées (opcodes, statuts, etc.)
// ajoute de ux/ix pour rendre les badges plus agréables à regarder/ plus lisible 

import type { ReactNode } from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "neutral";

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    color?: BadgeColor;
    children: ReactNode;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    variant = "light",
    color = "primary",
    size = "sm",
    children,
    className = "",
}) => {
    const baseStyles = "inline-flex items-center px-2 py-0.5 rounded font-mono";

    const sizeStyles = {
        sm: "text-xs",
        md: "text-sm",
    };

    const variants = {
        light: {
            primary: "bg-blue-500/20 text-blue-400",
            success: "bg-green-500/20 text-green-400",
            error: "bg-red-500/20 text-red-400",
            warning: "bg-yellow-500/20 text-yellow-400",
            info: "bg-cyan-500/20 text-cyan-400",
            neutral: "bg-gray-500/20 text-gray-400",
        },
        solid: {
            primary: "bg-blue-500 text-white",
            success: "bg-green-500 text-white",
            error: "bg-red-500 text-white",
            warning: "bg-yellow-500 text-white",
            info: "bg-cyan-500 text-white",
            neutral: "bg-gray-600 text-white",
        },
    };

    const sizeClass = sizeStyles[size];
    const colorStyles = variants[variant][color];

    return (
        <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
