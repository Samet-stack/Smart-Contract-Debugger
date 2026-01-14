import { useTheme } from "../context/ThemeContext";

interface RangeInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

// Composant Slider Personnalisé avec effet "Rempli" (Filled)
// Il reçoit "value" et "onChange" de son parent (App.tsx) pour être contrôlé.
export default function RangeInput({ value, onChange, className = "" }: RangeInputProps) {
    const { theme } = useTheme();

    const getBackgroundStyle = () => {
        const percentage = (value / 100) * 100;
        // Colors based on the theme (Tailwind colors manually matched)
        // Brand-500: #465fff
        // Gray-200 (Light Track): #e4e7ec
        // Gray-700 (Dark Track): #344054
        const trackColor = theme === "dark" ? "#344054" : "#e4e7ec";

        return {
            background: `linear-gradient(to right, #465fff ${percentage}%, ${trackColor} ${percentage}%)`
        };
    };

    return (
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={getBackgroundStyle()}
            className={`w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 hover:[&::-webkit-slider-thumb]:bg-brand-600 transition-colors ${className}`}
        />
    );
}
