import { useState } from "react";
import Button from "../../ui-lib/components/Button";
import Input from "../../ui-lib/components/Input";
import Card from "../../ui-lib/components/Card";
import { cn } from "../../ui-lib/utils/cn";
import type { Breakpoint } from "../../types/ApolloAPI";
import type { BreakpointType } from "../../types/DebuggerTypes";

interface BreakpointManagerProps {
    breakpoints: Breakpoint[];
    addBreakpoint: (type: BreakpointType, inputValue: string, setInput: (v: string) => void) => void;
    removeBreakpoint: (id: string) => void;
    toggleMemoryRange: () => void;
    memoryRangeEnabled: boolean;
    memoryMin: number;
    setMemoryMin: (v: number) => void;
    memoryMax: number;
    setMemoryMax: (v: number) => void;
    metacall: boolean;
    handleMetacallToggle: (enabled: boolean) => void;
    showAliases: boolean;
    setShowAliases: (enabled: boolean) => void;
    skipContract: boolean;
    setSkipContract: (enabled: boolean) => void;
}

/**
 * Side Panel for managing Breakpoints, Filters, and Memory Ranges.
 */
export default function BreakpointManager({
    breakpoints,
    addBreakpoint,
    removeBreakpoint,
    toggleMemoryRange,
    memoryRangeEnabled,
    memoryMin,
    setMemoryMin,
    memoryMax,
    setMemoryMax,
    metacall,
    handleMetacallToggle,
    showAliases,
    setShowAliases,
    skipContract,
    setSkipContract
}: BreakpointManagerProps) {
    const [storageInput, setStorageInput] = useState("");
    const [transientInput, setTransientInput] = useState("");

    return (
        <Card title="Breakpoints">
            <div className="space-y-4">

                {/* --- Active Breakpoints Display Area --- */}
                {breakpoints.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                        {breakpoints.map(bp => (
                            <span key={bp.id} className={
                                cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border",
                                    bp.type === "Storage" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800" :
                                        bp.type === "Transient" ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800" :
                                            "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                                )
                            }>
                                <span className="font-bold">{bp.type.charAt(0)}</span>
                                {bp.value.substring(0, 6)}...{bp.value.substring(bp.value.length - 4)}
                                <button onClick={() => removeBreakpoint(bp.id)} className="hover:text-red-500 rounded-full p-0.5">
                                    {/* Petite croix SVG interne */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* --- Add Forms --- */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Storage (32 bytes hex)</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="0x..."
                            className="h-8 text-xs flex-1"
                            value={storageInput}
                            onChange={(e) => setStorageInput(e.target.value)}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addBreakpoint("Storage", storageInput, setStorageInput)}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Transient Storage</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="0x..."
                            className="h-8 text-xs flex-1"
                            value={transientInput}
                            onChange={(e) => setTransientInput(e.target.value)}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addBreakpoint("Transient", transientInput, setTransientInput)}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Memory Range</p>

                    {/* Interface avancée style Memory Range avec +/- */}
                    <div className="flex flex-col gap-2">
                        {/* Enable Button - Full Width */}
                        <Button
                            size="sm"
                            className={cn("w-full justify-center", memoryRangeEnabled
                                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                            )}
                            onClick={toggleMemoryRange}
                        >
                            {memoryRangeEnabled ? "Range Enabled" : "Enable Range"}
                        </Button>

                        {/* Min / Max Row */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Min Stepper */}
                            <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-1">
                                <button
                                    className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                                    onClick={() => setMemoryMin(Math.max(0, memoryMin - 1))}
                                >−</button>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[10px] text-gray-400">min</span>
                                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{memoryMin}</span>
                                </div>
                                <button
                                    className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                                    onClick={() => setMemoryMin(memoryMin + 1)}
                                >+</button>
                            </div>

                            {/* Max Stepper */}
                            <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-1">
                                <button
                                    className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                                    onClick={() => setMemoryMax(Math.max(memoryMin + 1, memoryMax - 1))}
                                >−</button>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[10px] text-gray-400">max</span>
                                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{memoryMax}</span>
                                </div>
                                <button
                                    className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                                    onClick={() => setMemoryMax(memoryMax + 1)}
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* J'utilise flex-wrap pour que ça passe à la ligne si c'est trop serré */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Metacall</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={metacall}
                                onChange={(e) => handleMetacallToggle(e.target.checked)}
                            />

                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Show Aliases</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showAliases}
                                onChange={(e) => setShowAliases(e.target.checked)}
                            />

                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Skip called contract</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={skipContract}
                                onChange={(e) => setSkipContract(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </Card>
    );
}
