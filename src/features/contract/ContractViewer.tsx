
import { useEffect, useRef } from "react";
import { cn } from "../../ui-lib/utils/cn";
import type { ContractOpcode } from "../../hooks/useApollo";

interface ContractViewerProps {
    code: ContractOpcode[];
    currentPc: number | undefined;
}

export default function ContractViewer({ code, currentPc }: ContractViewerProps) {
    const activeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active element whenever currentPc changes
    useEffect(() => {
        if (activeRef.current && containerRef.current) {
            const container = containerRef.current;
            const element = activeRef.current;

            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const containerTop = container.scrollTop;
            const containerHeight = container.offsetHeight;

            // If element is out of view (above or below), scroll to it centered
            if (elementTop < containerTop || elementTop + elementHeight > containerTop + containerHeight) {
                container.scrollTo({
                    top: elementTop - containerHeight / 2 + elementHeight / 2,
                    behavior: "smooth"
                });
            }
        }
    }, [currentPc]);

    if (!code || code.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                <span className="text-3xl mb-2 opacity-20">📝</span>
                <p className="font-semibold text-sm">External Contract</p>
                <p className="text-xs font-mono mt-1 opacity-70 break-all">
                    {/* We need to pass address to display it here, or just generic message */}
                    Code not available for this address
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-2 font-mono text-xs leading-relaxed h-full"
        >
            <div className="space-y-0.5">
                {code.map((op, index) => {
                    const isCurrentPc = currentPc === op.pc;
                    return (
                        <div
                            key={index}
                            ref={isCurrentPc ? activeRef : null}
                            className={cn(
                                "flex items-center gap-3 px-2 py-0.5 rounded transition-colors duration-200",
                                isCurrentPc
                                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 font-bold border-l-2 border-blue-500 shadow-sm"
                                    : "hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 opacity-80 hover:opacity-100"
                            )}
                        >
                            <span className={cn(
                                "w-10 text-right opacity-60 font-mono text-[10px]",
                                isCurrentPc && "opacity-100 font-bold"
                            )}>
                                {op.pc}
                            </span>
                            <span className={cn(
                                "font-mono font-medium",
                                isCurrentPc ? "text-blue-700 dark:text-blue-200" : "text-purple-600 dark:text-purple-400"
                            )}>
                                {op.op}
                            </span>
                            {op.arg && (
                                <span className="text-gray-500 dark:text-gray-500 text-[10px] truncate max-w-[200px]" title={op.arg}>
                                    {op.arg}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
