// StackView.tsx
// Stack visualization with sliding window (2 items max: current=green, previous=red)
// History displayed in a popup modal - Light/Dark theme support

import { useState } from "react";
import type { VisibleStackWindow } from "../../hooks/useApollo";
import type { StackItem } from "../../types/StackItem";

interface StackViewProps {
    visibleStack: VisibleStackWindow;
    historyLength: number;
    fullHistory?: StackItem[];
    neutralItems?: StackItem[]; // Rest of the stack (non-active)
    className?: string;
}

// Modal component for stack history
function HistoryModal({
    isOpen,
    onClose,
    history
}: {
    isOpen: boolean;
    onClose: () => void;
    history: StackItem[];
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        Stack History
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({history.length} items)</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[60px_1fr_120px] bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    <div className="px-4 py-2">#</div>
                    <div className="px-4 py-2">Value</div>
                    <div className="px-4 py-2 text-center">PC: Opcode</div>
                </div>

                {/* Scrollable content - No hover effects */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {[...history].reverse().map((item, idx) => {
                        const itemIndex = history.length - idx;
                        const isLast = idx === 0;
                        const isSecondLast = idx === 1;

                        return (
                            <div
                                key={idx}
                                className={`grid grid-cols-[60px_1fr_120px] border-b border-gray-100 dark:border-gray-800/50
                                    ${isLast ? 'bg-green-100 dark:bg-green-900/30' : ''}
                                    ${isSecondLast ? 'bg-red-100 dark:bg-red-900/30' : ''}
                                    ${!isLast && !isSecondLast ? 'bg-white dark:bg-gray-900' : ''}
                                `}
                            >
                                <div className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-sm">
                                    {itemIndex}
                                </div>
                                <div className="px-4 py-3 overflow-x-auto">
                                    <code className="text-gray-800 dark:text-gray-200 text-sm font-mono break-all">
                                        {item.value}
                                    </code>
                                </div>
                                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">
                                    {item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : "-"}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-500 flex items-center justify-between">
                    <span>🟢 Current | 🔴 Previous</span>
                    <span>Click outside to close</span>
                </div>
            </div>
        </div>
    );
}

export default function StackView({ visibleStack, historyLength, fullHistory = [], neutralItems, className = "" }: StackViewProps) {
    const [showModal, setShowModal] = useState(false);

    const { current, previous } = visibleStack || { current: null, previous: null };
    const hiddenCount = historyLength - 2;

    return (
        <>
            <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
                {/* Header - Same colors as other tables */}
                <div className="grid grid-cols-[1fr_auto] bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Value
                    </div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center min-w-[100px]">
                        PC: OP
                    </div>
                </div>

                {/* Previous item (Red) */}
                {previous && (
                    <div className="grid grid-cols-[1fr_auto] bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800/50">
                        <div className="px-4 py-3">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">prev : </span>
                            <span className="font-mono text-gray-800 dark:text-gray-200 text-sm break-all">{previous.value}</span>
                        </div>
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center min-w-[100px] flex items-center justify-center">
                            {previous.modifiedAt ? `${previous.modifiedAt.pc}: ${previous.modifiedAt.opcode}` : "-"}
                        </div>
                    </div>
                )}

                {/* Current item (Green) */}
                {current && (
                    <div className="grid grid-cols-[1fr_auto] bg-green-100 dark:bg-green-900/40">
                        <div className="px-4 py-3">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">curr : </span>
                            <span className="font-mono text-gray-800 dark:text-gray-200 text-sm break-all">{current.value}</span>
                        </div>
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center min-w-[100px] flex items-center justify-center">
                            {current.modifiedAt ? `${current.modifiedAt.pc}: ${current.modifiedAt.opcode}` : "-"}
                        </div>
                    </div>
                )}

                {/* Neutral items (Rest of stack) */}
                {Array.isArray(neutralItems) && neutralItems.length > 0 && neutralItems.map((item, idx) => (
                    item ? (
                        <div key={idx} className="grid grid-cols-[1fr_auto] bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/50">
                            <div className="px-4 py-3">
                                <span className="text-gray-400 dark:text-gray-600 font-medium">{item.label || `stack[${idx}]`} : </span>
                                <span className="font-mono text-gray-600 dark:text-gray-400 text-sm break-all">{item.value}</span>
                            </div>
                            <div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-sm text-center min-w-[100px] flex items-center justify-center">
                                {item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : "-"}
                            </div>
                        </div>
                    ) : null
                ))}

                {/* Empty state */}
                {!current && !previous && (
                    <div className="px-4 py-6 text-center text-gray-500 italic bg-gray-50 dark:bg-gray-800/50">
                        Empty Stack - Press Next to start
                    </div>
                )}

                {/* History button */}
                {hiddenCount > 0 && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full px-4 py-2.5 text-xs bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-700"
                    >
                        <span className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">View full history ({historyLength} items)</span>
                    </button>
                )}
            </div>

            {/* Modal */}
            <HistoryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                history={fullHistory}
            />
        </>
    );
}
