// ExecutionPanel.tsx
// Execution Panel with text buttons + readable icons

import { useState } from "react";

interface ExecutionPanelProps {
    speed: number;
    onSpeedChange: (speed: number) => void;
    stepSize: number;
    onStepSizeChange: (size: number) => void;
    className?: string;
}

// Icônes SVG
const PlayIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const PauseIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const FastForwardIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
    </svg>
);

const RewindIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
    </svg>
);

export default function ExecutionPanel({
    speed,
    onSpeedChange,
    stepSize,
    onStepSizeChange,
    className = "",
}: ExecutionPanelProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Style commun pour les boutons secondaires
    const secondaryBtnClass = `
    flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
    bg-gray-100 dark:bg-gray-800 
    text-gray-700 dark:text-gray-300
    hover:bg-gray-200 dark:hover:bg-gray-700
    border border-gray-200 dark:border-gray-700
    transition-all duration-200
    hover:shadow-sm
  `;

    return (
        <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Execution</h3>
                </div>
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {isPlaying ? "▶ RUNNING" : "⏸ PAUSED"}
                </span>
            </div>

            <div className="p-4 space-y-4">
                {/* Row 1: Main Control Buttons */}
                <div className="flex flex-wrap gap-2">
                    {/* Auto-Prev */}
                    <button className={secondaryBtnClass} title="Auto-Prev">
                        <RewindIcon />
                        <span>Auto-Prev</span>
                    </button>

                    {/* Prev */}
                    <button className={secondaryBtnClass} title="Previous Instruction">
                        <ChevronLeftIcon />
                        <span>Prev</span>
                    </button>

                    {/* RUN / PAUSE - Bouton principal */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200 shadow-md hover:shadow-lg
              ${isPlaying
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                            }
            `}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        <span>{isPlaying ? 'Pause' : 'Run'}</span>
                    </button>

                    {/* Next */}
                    <button className={secondaryBtnClass} title="Next Instruction">
                        <span>Next</span>
                        <ChevronRightIcon />
                    </button>

                    {/* Auto-Next */}
                    <button className={secondaryBtnClass} title="Auto-Next">
                        <span>Auto-Next</span>
                        <FastForwardIcon />
                    </button>
                </div>

                {/* Row 2: Speed */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Execution Speed</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{speed}</span>
                            <span className="text-xs text-gray-500">%</span>
                        </div>
                    </div>
                    <div className="relative pt-1">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={speed}
                            onChange={(e) => onSpeedChange(Number(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${speed}%, #e5e7eb ${speed}%, #e5e7eb 100%)`,
                            }}
                        />
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                🐢 Slow
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                Fast 🚀
                            </span>
                        </div>
                    </div>
                </div>

                {/* Row 3: Step Size */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Step Size</span>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Instructions per step</p>
                        </div>

                        {/* Stepper control stylé */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-inner border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => onStepSizeChange(Math.max(1, stepSize - 1))}
                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors font-bold text-lg"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={stepSize}
                                onChange={(e) => onStepSizeChange(Math.max(1, Number(e.target.value)))}
                                className="w-14 h-8 text-center text-lg font-bold text-gray-700 dark:text-gray-300 bg-transparent border-0 focus:outline-none focus:ring-0"
                                min="1"
                            />
                            <button
                                onClick={() => onStepSizeChange(stepSize + 1)}
                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Presets rapides */}
                    <div className="flex gap-1.5 mt-3">
                        {[1, 5, 10, 50, 100].map((preset) => (
                            <button
                                key={preset}
                                onClick={() => onStepSizeChange(preset)}
                                className={`
                  px-2 py-1 rounded-md text-[10px] font-medium transition-all
                  ${stepSize === preset
                                        ? 'bg-gray-700 dark:bg-gray-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                    }
                `}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer avec raccourcis */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-2 flex-wrap">
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono text-[9px]">Space</kbd>
                        <span className="ml-1">Run/Pause</span>
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono text-[9px]">←</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono text-[9px] ml-0.5">→</kbd>
                        <span className="ml-1">Prev/Next</span>
                    </span>
                </p>
            </div>
        </div>
    );
}
