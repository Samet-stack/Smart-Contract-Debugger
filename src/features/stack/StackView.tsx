// StackView.tsx
// Stack visualization with 3 tabs: Value (curr/prev), Full Stack (accordion), History (accordion)

import { useState } from "react";
import type { VisibleStackWindow } from "../../hooks/useApollo";
import type { StackItem } from "../../types/StackItem";

interface StackViewProps {
    visibleStack: VisibleStackWindow;
    fullHistory?: StackItem[];
    neutralItems?: StackItem[]; // Rest of the stack (non-active)
    className?: string;
}

type TabType = 'value' | 'fullStack' | 'history';

// Accordion Item Component
function AccordionItem({
    label,
    value,
    detail,
    isHighlighted = false,
    highlightColor = 'green'
}: {
    label: string;
    value: string;
    detail?: string;
    isHighlighted?: boolean;
    highlightColor?: 'green' | 'red';
}) {
    const [isOpen, setIsOpen] = useState(false);

    const bgClass = isHighlighted
        ? highlightColor === 'green'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800';

    const labelColor = isHighlighted
        ? highlightColor === 'green'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400';

    return (
        <div className={`border-b ${bgClass} transition-colors`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-xs font-mono font-medium ${labelColor} shrink-0`}>{label}</span>
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                        {value.length > 40 ? `${value.slice(0, 20)}...${value.slice(-16)}` : value}
                    </code>
                </div>
                <span className="text-gray-400 text-xs shrink-0 ml-2">
                    {isOpen ? '▼' : '►'}
                </span>
            </button>

            {isOpen && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-2">
                        <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Full Value:</span>
                            <code className="block mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                {value}
                            </code>
                        </div>
                        {detail && (
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">PC: Opcode:</span>
                                <span className="ml-2 text-xs font-mono text-gray-700 dark:text-gray-300">{detail}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StackView({ visibleStack, fullHistory = [], neutralItems = [], className = "" }: StackViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('value');
    const { current, previous } = visibleStack || { current: null, previous: null };

    const tabs: { key: TabType; label: string; count?: number }[] = [
        { key: 'value', label: 'Value' },
        { key: 'fullStack', label: 'Full Stack', count: (current ? 1 : 0) + neutralItems.length },
        { key: 'history', label: 'History', count: fullHistory.length }
    ];

    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className} flex flex-col h-full`}>
            {/* Tabs Header */}
            <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 ${activeTab === tab.key
                                ? 'text-brand-600 dark:text-brand-400 border-brand-500 bg-white dark:bg-gray-900'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* === VALUE TAB === */}
                {activeTab === 'value' && (
                    <div className="flex flex-col h-full">
                        {/* Header Row */}
                        <div className="grid grid-cols-[1fr_auto] bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 shrink-0">
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

                        {/* Empty state */}
                        {!current && !previous && (
                            <div className="px-4 py-6 text-center text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 flex-1 flex items-center justify-center">
                                No stack data
                            </div>
                        )}

                        <div className="flex-1 bg-white dark:bg-gray-900"></div>
                    </div>
                )}

                {/* === FULL STACK TAB === */}
                {activeTab === 'fullStack' && (
                    <div>
                        {current && (
                            <AccordionItem
                                label="TOP"
                                value={current.value}
                                detail={current.modifiedAt ? `${current.modifiedAt.pc}: ${current.modifiedAt.opcode}` : undefined}
                                isHighlighted
                                highlightColor="green"
                            />
                        )}
                        {neutralItems.map((item, idx) => (
                            <AccordionItem
                                key={idx}
                                label={`[${idx + 1}]`}
                                value={item?.value || ''}
                                detail={item?.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : undefined}
                            />
                        ))}
                        {!current && neutralItems.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-500 italic">
                                Stack is empty
                            </div>
                        )}
                    </div>
                )}

                {/* === HISTORY TAB === */}
                {activeTab === 'history' && (
                    <div>
                        {[...fullHistory].reverse().map((item, idx) => {
                            const stepNumber = fullHistory.length - idx;
                            const isLatest = idx === 0;
                            return (
                                <AccordionItem
                                    key={idx}
                                    label={`#${stepNumber}`}
                                    value={item.value}
                                    detail={item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : undefined}
                                    isHighlighted={isLatest}
                                    highlightColor="green"
                                />
                            );
                        })}
                        {fullHistory.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-500 italic">
                                No history yet
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
