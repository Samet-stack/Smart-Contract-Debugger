// StackView.tsx
// Stack visualization with sliding window (2 items max: current=green, previous=red)
// History displayed in a popup modal - Light/Dark theme support

import { useState } from "react";
import type { VisibleStackWindow } from "../../hooks/useApollo";
import type { StackItem } from "../../types/StackItem";

interface StackViewProps {
    visibleStack: VisibleStackWindow;
    fullHistory?: StackItem[];
    neutralItems?: StackItem[]; // Rest of the stack (non-active)
    className?: string;
}

// Modal component for stack history
function HistoryModal({
    isOpen,
    onClose,
    history,
    current,
    neutralItems = []
}: {
    isOpen: boolean;
    onClose: () => void;
    history: StackItem[];
    current: StackItem | null;
    neutralItems?: StackItem[];
}) {
    const [activeTab, setActiveTab] = useState<'history' | 'fullStack'>('history');

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Tabs */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                        >
                            History <span className="text-xs font-normal opacity-75">({history.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('fullStack')}
                            className={`text-sm font-semibold transition-colors ${activeTab === 'fullStack' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                        >
                            Full Stack <span className="text-xs font-normal opacity-75">({(current ? 1 : 0) + neutralItems.length})</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'history' ? (
                        <>
                            {/* History Table Header */}
                            <div className="grid grid-cols-[60px_1fr_120px] bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase sticky top-0 z-10">
                                <div className="px-4 py-2">Step</div>
                                <div className="px-4 py-2">Value</div>
                                <div className="px-4 py-2 text-center">PC: Opcode</div>
                            </div>
                            {/* History List */}
                            <div>
                                {[...history].reverse().map((item, idx) => {
                                    const itemIndex = history.length - idx;
                                    const isLast = idx === 0;
                                    return (
                                        <div
                                            key={idx}
                                            className={`grid grid-cols-[60px_1fr_120px] border-b border-gray-100 dark:border-gray-800/50 ${isLast ? 'bg-green-50 dark:bg-green-900/10' : 'bg-white dark:bg-gray-900'}`}
                                        >
                                            <div className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-sm">{itemIndex}</div>
                                            <div className="px-4 py-3 overflow-x-auto"><code className="text-gray-800 dark:text-gray-200 text-sm font-mono break-all">{item.value}</code></div>
                                            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">{item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : "-"}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Full Stack Header */}
                            <div className="grid grid-cols-[60px_1fr] bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase sticky top-0 z-10">
                                <div className="px-4 py-2">Idx</div>
                                <div className="px-4 py-2">Value</div>
                            </div>
                            {/* Full Stack List */}
                            <div className="bg-white dark:bg-gray-900">
                                {current && (
                                    <div className="grid grid-cols-[60px_1fr] border-b border-gray-100 dark:border-gray-800/50 bg-green-50 dark:bg-green-900/20">
                                        <div className="px-4 py-3 text-green-600 dark:text-green-400 font-mono text-sm font-bold">TOP</div>
                                        <div className="px-4 py-3 overflow-x-auto"><code className="text-gray-900 dark:text-white text-sm font-mono break-all">{current.value}</code></div>
                                    </div>
                                )}
                                {neutralItems.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-[60px_1fr] border-b border-gray-100 dark:border-gray-800/50">
                                        <div className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-sm">stack[{idx + 1}]</div>
                                        <div className="px-4 py-3 overflow-x-auto"><code className="text-gray-800 dark:text-gray-200 text-sm font-mono break-all">{item?.value}</code></div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-500 text-right">
                    Click outside to close
                </div>
            </div>
        </div>
    );
}

export default function StackView({ visibleStack, fullHistory = [], neutralItems = [], className = "" }: StackViewProps) {
    const [showModal, setShowModal] = useState(false);
    const { current, previous } = visibleStack || { current: null, previous: null };

    return (
        <>
            <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className} flex flex-col`}>
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto] bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center min-w-[100px]">PC: OP</div>
                </div>

                {/* Previous item (Red) */}
                {previous && (
                    <div className="grid grid-cols-[1fr_auto] bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800/50 shrink-0">
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
                    <div className="grid grid-cols-[1fr_auto] bg-green-100 dark:bg-green-900/40 shrink-0">
                        <div className="px-4 py-3">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">curr : </span>
                            <span className="font-mono text-gray-800 dark:text-gray-200 text-sm break-all">{current.value}</span>
                        </div>
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center min-w-[100px] flex items-center justify-center">
                            {current.modifiedAt ? `${current.modifiedAt.pc}: ${current.modifiedAt.opcode}` : "-"}
                        </div>
                    </div>
                )}

                {/* Empty state fill */}
                {!current && !previous && (
                    <div className="px-4 py-6 text-center text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 flex-1 flex items-center justify-center">
                        No stack data
                    </div>
                )}

                <div className="flex-1 bg-white dark:bg-gray-900 min-h-0"></div>

                {/* Always Visible View Details Button */}
                <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full px-4 py-2.5 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium text-gray-600 dark:text-gray-300"
                    >
                        View Details & History
                    </button>
                </div>
            </div>

            {/* Modal */}
            <HistoryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                history={fullHistory}
                current={current}
                neutralItems={neutralItems}
            />
        </>
    );
}
