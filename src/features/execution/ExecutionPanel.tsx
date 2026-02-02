// ExecutionPanel.tsx
// Execution Panel with text buttons + readable icons
// Refactored to be stateless and controlled by parent (useApollo hook)

import type { ReactNode } from "react";
import Tooltip from "../../ui-lib/components/Tooltip";

interface ExecutionPanelProps {
    speed: number;
    onSpeedChange: (speed: number) => void;
    stepSize: number;
    onStepSizeChange: (size: number) => void;
    className?: string;
    onNext?: () => void;
    onPrev?: () => void;
    // Controlled State from useApollo
    isPlaying: false | 'forward' | 'backward';
    onTogglePlay: (direction: 'forward' | 'backward') => void;
    headerAction?: ReactNode;
}

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

const StopIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <rect x="4" y="4" width="12" height="12" rx="1" />
    </svg>
);

/**
 * Execution Control Panel.
 * Manages Play/Pause/Step actions and speed settings.
 */
export default function ExecutionPanel({
    speed,
    onSpeedChange,
    stepSize,
    onStepSizeChange,
    className = "",
    onNext,
    onPrev,
    isPlaying,
    onTogglePlay,
    headerAction,
}:
    ExecutionPanelProps) {

    // Simplified handlers that just call props
    const HandleManuelNext = () => {
        // Typically manual step pauses auto-play for better UX.
        if (isPlaying) onTogglePlay(isPlaying); // Stop
        onNext?.();
    };

    const HandleManuelPrev = () => {
        if (isPlaying) onTogglePlay(isPlaying); // Stop
        onPrev?.();
    };

    return (
        <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm ${className}`}>
            {/* Header with Compact Controls */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center bg-gray-50/50 dark:bg-gray-800/30 gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Execution</h3>
                </div>

                {/* Compact Control Group */}
                <div className="flex items-center gap-3 ml-auto">

                    {/* Left Group: Backwards */}
                    <div className="inline-flex rounded-lg shadow-sm isolate">
                        <Tooltip content={isPlaying === 'backward' ? "Stop" : "Auto-Previous"}>
                            <button
                                className={`relative inline-flex items-center justify-center px-2.5 py-1.5 rounded-l-lg border transition-all duration-200 focus:z-10 focus:ring-2 active:scale-95
                                    ${isPlaying === 'backward'
                                        ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                                    }`}
                                onClick={() => onTogglePlay('backward')}
                            >
                                {isPlaying === 'backward' ? <StopIcon /> : <RewindIcon />}
                            </button>
                        </Tooltip>
                        <Tooltip content="Previous Instruction">
                            <button
                                onClick={HandleManuelPrev}
                                className="relative inline-flex items-center justify-center px-2.5 py-1.5 -ml-px text-slate-500 bg-white border border-slate-200 rounded-r-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-primary-500/50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all duration-200"
                            >
                                <ChevronLeftIcon />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Right Group: Forwards */}
                    <div className="inline-flex rounded-lg shadow-sm isolate">
                        <Tooltip content="Next Instruction">
                            <button
                                onClick={HandleManuelNext}
                                className="relative inline-flex items-center justify-center px-2.5 py-1.5 text-slate-500 bg-white border border-slate-200 rounded-l-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-primary-500/50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all duration-200"
                            >
                                <ChevronRightIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content={isPlaying === 'forward' ? "Stop" : "Auto-Next"}>
                            <button
                                className={`relative inline-flex items-center justify-center px-2.5 py-1.5 -ml-px border rounded-r-lg transition-all duration-200 focus:z-10 focus:ring-2 active:scale-95
                                    ${isPlaying === 'forward'
                                        ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                                    }`}
                                onClick={() => onTogglePlay('forward')}
                            >
                                {isPlaying === 'forward' ? <StopIcon /> : <FastForwardIcon />}
                            </button>
                        </Tooltip>
                    </div>
                    {headerAction}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Row 2: Speed */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
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
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Step Size</span>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Instructions per step</p>
                        </div>

                        {/* Styled Stepper Control */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 rounded-lg p-0.5 shadow-inner border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => onStepSizeChange(Math.max(1, stepSize - 1))}
                                className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors font-bold text-sm"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={stepSize}
                                onChange={(e) => onStepSizeChange(Math.max(1, Number(e.target.value)))}
                                className="w-10 h-6 text-center text-sm font-bold text-gray-700 dark:text-gray-300 bg-transparent border-0 focus:outline-none focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none hover:appearance-none"
                                min="1"
                            />
                            <button
                                onClick={() => onStepSizeChange(stepSize + 1)}
                                className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors font-bold text-sm"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Quick Presets */}
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

            {/* Footer with Shortcuts */}
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
