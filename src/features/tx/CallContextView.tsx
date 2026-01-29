// CallContextView.tsx
// Displays the current execution context (Address, Selector, CallData)
// Extracted from TxInstrsView to be displayed in the right column

import { useAliases } from "../../context/AliasContext";
import type { InstructionInfo } from "../../types/TxInstrs";
import Badge from "../../ui-lib/components/Badge";

interface CallContextViewProps {
    instr: InstructionInfo | null;
    showAliases?: boolean;
}

// Helper to format hex strings into chunks of 32 bytes (64 chars)
function formatHexChunk(hex: string, chunkSize = 64) {
    if (!hex) return "";
    const regex = new RegExp(`.{1,${chunkSize}}`, 'g');
    return hex.match(regex)?.join('\n') || hex;
}

export default function CallContextView({ instr, showAliases = true }: CallContextViewProps) {
    const { findAlias } = useAliases();

    // If no instruction or no address context, show placeholder or empty
    if (!instr || !instr.address) {
        return (
            <div className="p-4 text-center text-gray-400 italic text-xs">
                No active call context
            </div>
        );
    }

    const alias = showAliases ? findAlias(instr.address) : undefined;

    return (
        <div className="p-4 space-y-4">
            {/* Address Section */}
            <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-semibold">Contract Address</span>
                {alias?.label && (
                    <div className="flex items-center gap-2 mt-1">
                        <Badge color="primary" variant="light" size="sm">{alias.label}</Badge>
                    </div>
                )}
                <p className="font-mono text-xs text-gray-800 dark:text-gray-200 mt-1 break-all bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded border border-gray-100 dark:border-gray-700">
                    {instr.address}
                </p>
            </div>

            {/* Function Selector */}
            <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-semibold">Function Selector</span>
                <p className="font-mono text-xs text-cyan-600 dark:text-cyan-400 mt-1 break-all bg-cyan-50 dark:bg-cyan-900/10 p-1.5 rounded border border-cyan-100 dark:border-cyan-800/30">
                    {instr.functionSelector || <span className="text-gray-400 italic">0x...</span>}
                </p>
            </div>

            {/* Call Data */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-semibold">Call Data</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                        {instr.callData ? `${(instr.callData.length - 2) / 2} bytes` : '0 bytes'}
                    </span>
                </div>
                <pre className="font-mono text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {instr.callData ? formatHexChunk(instr.callData) : <span className="text-gray-400 italic">Empty</span>}
                </pre>
            </div>
        </div>
    );
}
