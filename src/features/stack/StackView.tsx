// StackView.tsx
// Stack visualization with 3 tabs: Value (consumed/produced), Full Stack (accordion), History (accordion)

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
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate" title={value}>
                        {value}
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

/**
 * Stack View Component.
 * Displays the current EVM stack with realistic argument consumption.
 * Highlights:
 * - Produced items (Green) — values the last instruction pushed
 * - Consumed items (Red) — values the last instruction popped
 * - Neutral items (Gray) — rest of the stack
 */
export default function StackView({ visibleStack, fullHistory = [], neutralItems = [], className = "" }: StackViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('value');
    const { produced, consumed } = visibleStack || { produced: [], consumed: [] };

    // P2 FIX: Clearer tab labels with tooltips explaining what each tab shows
    const tabs: { key: TabType; label: string; count?: number; description: string }[] = [
        { 
            key: 'value', 
            label: 'Changes', 
            count: produced.length + consumed.length,
            description: 'What the last instruction consumed (red) vs produced (green)'
        },
        { 
            key: 'fullStack', 
            label: 'Full Stack', 
            count: produced.length + neutralItems.length,
            description: 'Complete stack state with current values highlighted'
        },
        { 
            key: 'history', 
            label: 'History', 
            count: fullHistory.length,
            description: 'Timeline of all stack modifications'
        }
    ];

    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className} flex flex-col h-full`}>
            {/* Tabs Header with tooltips */}
            <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        title={tab.description}
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
                {/* === CHANGES TAB (formerly Value) === */}
                {activeTab === 'value' && (
                    <div className="flex flex-col h-full">
                        {/* Compact legend */}
                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-200 flex items-center gap-2 flex-wrap">
                            <span className="text-red-500">popped</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-green-600 dark:text-green-400">pushed</span>
                            <span className="text-blue-600 dark:text-blue-400 italic ml-auto">
                                {consumed.length === 0 && produced.length === 0 && 'no stack change'}
                                {consumed.length > 0 && produced.length === 0 && 'consumed only'}
                                {consumed.length === 0 && produced.length > 0 && 'produced only'}
                                {consumed.length > 0 && produced.length > 0 && 'replaced values'}
                            </span>
                        </div>
                        {/* Header Row */}
                        <div className="grid grid-cols-[1fr_auto] bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {consumed.length > 0 ? 'Consumed → Produced' : 'Produced'}
                            </div>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center min-w-[100px]">PC: OP</div>
                        </div>

                        {/* Consumed items (Red) — all arguments the last instruction popped */}
                        {consumed.map((item, idx) => (
                            <div key={`consumed-${idx}`} className="grid grid-cols-[1fr_auto] bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800/50 shrink-0">
                                <div className="px-4 py-3 min-w-0">
                                    <span className="text-red-600 dark:text-red-400 font-medium text-xs">{item.label || 'arg'}: </span>
                                    <span className="font-mono text-gray-800 dark:text-gray-200 text-sm break-all">{item.value}</span>
                                </div>
                                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center min-w-[100px] flex items-center justify-center">
                                    {item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : "-"}
                                </div>
                            </div>
                        ))}

                        {/* Produced items (Green) — all values the last instruction pushed */}
                        {produced.map((item, idx) => (
                            <div key={`produced-${idx}`} className="grid grid-cols-[1fr_auto] bg-green-100 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800/50 shrink-0">
                                <div className="px-4 py-3 min-w-0">
                                    <span className="text-green-600 dark:text-green-400 font-medium text-xs">{item.label || 'result'}: </span>
                                    <span className="font-mono text-gray-800 dark:text-gray-200 text-sm break-all">{item.value}</span>
                                </div>
                                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center min-w-[100px] flex items-center justify-center">
                                    {item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : "-"}
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {produced.length === 0 && consumed.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 flex-1 flex items-center justify-center">
                                No changes yet
                            </div>
                        )}

                        <div className="flex-1 bg-white dark:bg-gray-900"></div>
                    </div>
                )}

                {/* === FULL STACK TAB === */}
                {activeTab === 'fullStack' && (
                    <div>
                        {produced.map((item, idx) => (
                            <AccordionItem
                                key={`produced-${idx}`}
                                label={item.label || 'TOP'}
                                value={item.value}
                                detail={item.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : undefined}
                                isHighlighted
                                highlightColor="green"
                            />
                        ))}
                        {neutralItems.map((item, idx) => (
                            <AccordionItem
                                key={idx}
                                label={item?.label || `[${idx + 1}]`}
                                value={item?.value || ''}
                                detail={item?.modifiedAt ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}` : undefined}
                            />
                        ))}
                        {produced.length === 0 && neutralItems.length === 0 && (
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
