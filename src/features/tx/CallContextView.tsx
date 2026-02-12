import { useState } from "react";
import { useAliases } from "../../context/AliasContext";
import type { InstructionInfo } from "../../types/TxInstrs";
import Badge from "../../ui-lib/components/Badge";

// ...
interface CallContextViewProps {
    lastInstr: InstructionInfo | null;
    nextInstr: InstructionInfo | null;
    showAliases?: boolean;
    className?: string;
}

// Helper to display a single context block
function ContextBlock({ instr, showAliases }: { instr: InstructionInfo | null, showAliases: boolean }) {
    const { findAlias } = useAliases();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!instr || !instr.address) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60px] text-gray-400 italic text-[10px]">
                No context
            </div>
        );
    }

    const alias = showAliases ? findAlias(instr.address) : undefined;
    const callDataSize = instr.callData ? (instr.callData.length - 2) / 2 : 0;
    const hasCallData = callDataSize > 0;

    return (
        <div className="space-y-2">
            {/* Badges Container */}
            <div className="flex flex-wrap gap-2 items-center">

                {/* Contract Address Badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700 min-w-0 max-w-full flex-1">
                    <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">Contract</span>
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden text-[9px]">
                        {alias?.label && (
                            <Badge color="primary" variant="light" size="sm" className="px-1 py-0 text-[8px] h-3 leading-none flex-shrink-0">{alias.label}</Badge>
                        )}
                        <span className="font-mono text-gray-800 dark:text-gray-200 truncate" title={instr.address}>
                            {instr.address}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                {/* Function Selector Badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-50 dark:bg-cyan-900/10 rounded border border-cyan-100 dark:border-cyan-800/30 flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">Selector</span>
                    <span className="font-mono text-[9px] text-cyan-600 dark:text-cyan-400 truncate min-w-0" title={instr.functionSelector}>
                        {instr.functionSelector || <span className="text-gray-400 italic">0x...</span>}
                    </span>
                </div>
            </div>

            {/* Call Data */}
            <div className="w-full">
                <button
                    onClick={() => hasCallData && setIsExpanded(!isExpanded)}
                    disabled={!hasCallData}
                    className={`w-full flex items-center justify-between group rounded px-2 py-1 transition-colors border border-gray-100 dark:border-gray-800 ${hasCallData ? 'bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer' : 'opacity-50 cursor-default'}`}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400">Call Data</span>
                        <span className="text-[9px] text-gray-400 font-mono">
                            {callDataSize} bytes
                        </span>
                    </div>

                    {hasCallData && (
                        <svg
                            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </button>

                {isExpanded && hasCallData && (
                    <div className="mt-1">
                        <pre className="font-mono text-[9px] text-gray-700 dark:text-gray-300 leading-tight bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-100 dark:border-gray-700 whitespace-pre-wrap max-h-[150px] overflow-y-auto break-all scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {instr.callData}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Call Context View.
 * Displays the context (Contract Address, Selector, Call Data) for both
 * the Last Run Instruction and the Next Instruction.
 * Supports expanding/collapsing raw call data.
 */
export default function CallContextView({ lastInstr, nextInstr, showAliases = true, className = "" }: CallContextViewProps) {
    return (
        <div className={`p-2 relative h-full flex flex-col ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Left Column: Last Instruction Context */}
                <div className="min-w-0 h-full">
                    <ContextBlock instr={lastInstr} showAliases={showAliases} />
                </div>

                {/* Vertical Separator (Hidden on mobile) */}
                <div className="hidden md:block absolute left-1/2 top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800 -translate-x-1/2" />

                {/* Right Column: Next Instruction Context */}
                <div className="min-w-0 h-full">
                    <ContextBlock instr={nextInstr} showAliases={showAliases} />
                </div>
            </div>
        </div>
    );
}
