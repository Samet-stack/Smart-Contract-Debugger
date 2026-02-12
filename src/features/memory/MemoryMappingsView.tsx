import Badge from "../../ui-lib/components/Badge";
import type { InstructionInfo } from "../../types/TxInstrs";

interface MemoryMappingsViewProps {
    mappings: NonNullable<InstructionInfo['memoryMappings']>;
    className?: string; // Add className prop for flexibility
}

/**
 * Memory Mappings View.
 * Displays a list of memory mappings, showing which PC/Opcode mapped to which memory range.
 * Useful for debugging how memory was allocated or modified.
 */
export default function MemoryMappingsView({ mappings, className = "" }: MemoryMappingsViewProps) {
    if (!mappings || mappings.length === 0) {
        return null;
    }

    return (
        <div className={`mt-0 ${className}`}>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Headers */}
                <div className="hidden sm:flex items-center justify-between px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wide">
                    <span className="w-1/3">Range</span>
                    <div className="flex items-center gap-8">
                        <span className="w-10 text-right">PC</span>
                        <span className="w-20 text-center">Opcode</span>
                    </div>
                </div>

                {/* List */}
                {mappings.map((m, i) => {
                    // Cycle colors for range text - Change color every line
                    const colorCycle = ["text-green-600 dark:text-green-400", "text-blue-600 dark:text-blue-400", "text-purple-600 dark:text-purple-400", "text-orange-600 dark:text-orange-400"];
                    const colorClass = colorCycle[i % colorCycle.length];

                    return (
                        <div
                            key={i}
                            className={`px-3 py-2 text-xs font-mono ${i % 2 === 0 ? 'bg-white dark:bg-gray-900/20' : 'bg-gray-50 dark:bg-gray-800/10'
                                }`}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                    <span className={`font-bold ${colorClass} break-all sm:break-normal`}>{m.range}</span>
                                    <span className="text-gray-400 hidden sm:inline">→</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-8">
                                    <div className="sm:w-10">
                                        <span className="block sm:hidden text-[10px] uppercase tracking-wide text-gray-400 mb-1">PC</span>
                                        <span className="text-gray-600 dark:text-gray-400 font-mono block sm:text-right">{m.pc}</span>
                                    </div>
                                    <div className="sm:w-20">
                                        <span className="block sm:hidden text-[10px] uppercase tracking-wide text-gray-400 mb-1">Opcode</span>
                                        <div className="w-full sm:flex sm:justify-end">
                                            <Badge color="info" size="sm" className="w-full justify-center">{m.opcode}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
