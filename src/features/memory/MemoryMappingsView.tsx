import Badge from "../../ui-lib/components/Badge";
import type { InstructionInfo } from "../../types/TxInstrs";

interface MemoryMappingsViewProps {
    mappings: NonNullable<InstructionInfo['memoryMappings']>;
    className?: string; // Add className prop for flexibility
}

export default function MemoryMappingsView({ mappings, className = "" }: MemoryMappingsViewProps) {
    if (!mappings || mappings.length === 0) {
        return null;
    }

    return (
        <div className={`mt-0 ${className}`}>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Headers */}
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wide">
                    <span className="w-1/3">Range</span>
                    <div className="flex items-center gap-8">
                        <span className="w-10 text-right">PC</span>
                        <span className="w-20 text-center">Opcode</span>
                    </div>
                </div>

                {/* List */}
                {mappings.map((m, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-2 text-xs font-mono ${i % 2 === 0 ? 'bg-white dark:bg-gray-900/20' : 'bg-gray-50 dark:bg-gray-800/10'
                            }`}
                    >
                        <div className="flex items-center gap-4 w-1/3">
                            <span className="text-gray-700 dark:text-gray-400">{m.range}</span>
                            <span className="text-gray-400">=&gt;</span>
                        </div>

                        <div className="flex items-center gap-8">
                            <span className="text-gray-600 dark:text-gray-400 font-mono w-10 text-right">{m.pc}</span>
                            <div className="w-20 flex justify-end">
                                <Badge color="info" size="sm" className="w-full justify-center">{m.opcode}</Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
