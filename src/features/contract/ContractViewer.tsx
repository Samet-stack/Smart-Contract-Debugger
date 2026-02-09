
import { useEffect, useRef } from "react";
import { cn } from "../../ui-lib/utils/cn";
import type { ContractOpcode } from "../../hooks/useApollo";
import { useAliases } from "../../context/AliasContext";

interface ContractViewerProps {
    code: ContractOpcode[];
    currentPc: number | undefined;
    isExternalContract?: boolean;
    externalAddress?: string;
    visitedPcs?: Set<number>;
    pcExecutionCount?: Map<number, number>;
}

/**
 * Contract Viewer Component.
 * Displays the list of opcodes for the current contract.
 * Highlights the current program counter (PC) and handles scrolling.
 * Supports displaying external contract info if available.
 */
export default function ContractViewer({ code, currentPc, isExternalContract, externalAddress, visitedPcs, pcExecutionCount }: ContractViewerProps) {
    const activeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { findAlias } = useAliases();
    const aliasLabel = externalAddress ? findAlias(externalAddress)?.label : undefined;
    const shortAddress = externalAddress
        ? `${externalAddress.slice(0, 10)}...${externalAddress.slice(-8)}`
        : "unknown";

    // P1 FIX: Improved auto-scroll that works reliably in both directions
    useEffect(() => {
        if (activeRef.current && containerRef.current) {
            const element = activeRef.current;
            
            // Use scrollIntoView with 'nearest' to keep element visible without unnecessary scrolling
            // 'smooth' behavior for better UX, but ensure it happens even in fast navigation
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
            
            // Fallback: force scroll after a short delay to ensure visibility in rapid navigation
            const timeoutId = setTimeout(() => {
                if (activeRef.current) {
                    activeRef.current.scrollIntoView({
                        behavior: 'auto',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [currentPc]);

    if (!code || code.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                <span className="text-3xl mb-2 opacity-20">📝</span>
                <p className="font-semibold text-sm">External Contract</p>
                <p className="text-xs font-mono mt-1 opacity-70 break-all">
                    {externalAddress
                        ? `Executing at ${aliasLabel ? `${aliasLabel} (${shortAddress})` : shortAddress}`
                        : "Code not available for this address"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* External Contract Banner */}
            {isExternalContract && (
                <div className="bg-orange-100 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800 px-3 py-2 text-xs">
                    <span className="text-orange-700 dark:text-orange-300 font-medium">
                        ⚠️ External Call - Executing at:
                    </span>
                    <span className="font-mono text-orange-600 dark:text-orange-400 ml-1">
                        {aliasLabel ? `${aliasLabel} (${shortAddress})` : shortAddress}
                    </span>
                </div>
            )}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-2 font-mono text-xs leading-relaxed"
            >
                <div className="space-y-0.5">
                    {code.map((op, index) => {
                        const isCurrentPc = currentPc === op.pc;
                        const isVisited = visitedPcs?.has(op.pc) ?? false;
                        const execCount = pcExecutionCount?.get(op.pc) ?? 0;
                        return (
                            <div
                                key={index}
                                ref={isCurrentPc ? activeRef : null}
                                className={cn(
                                    "flex items-center gap-3 px-2 py-1 rounded transition-colors duration-150",
                                    isCurrentPc
                                        ? "bg-green-400 dark:bg-green-600/80 text-green-950 dark:text-green-50 font-semibold shadow-md"
                                        : isVisited
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                            : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                )}
                            >
                                <span className={cn(
                                    "w-10 text-right font-mono text-[10px]",
                                    isCurrentPc ? "text-green-800 dark:text-green-100 font-bold" : isVisited ? "text-green-600 dark:text-green-400" : "opacity-60"
                                )}>
                                    {op.pc}
                                </span>
                                <span className={cn(
                                    "font-mono font-medium",
                                    isCurrentPc ? "text-green-900 dark:text-green-50" : isVisited ? "text-green-700 dark:text-green-300" : "text-purple-600 dark:text-purple-400"
                                )}>
                                    {op.op}
                                </span>
                                {op.arg && (
                                    <span className={cn(
                                        "text-[10px] truncate max-w-[200px]",
                                        // P1 FIX: Better contrast for PUSH arguments on active line
                                        isCurrentPc 
                                            ? "text-green-100 dark:text-green-100" 
                                            : "text-gray-500 dark:text-gray-400"
                                    )} title={op.arg}>
                                        {op.arg}
                                    </span>
                                )}
                                {execCount > 1 && (
                                    <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                        ×{execCount}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
