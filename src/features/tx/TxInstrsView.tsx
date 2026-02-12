// TxInstrsView.tsx
// Detailed component to display TX_INSTRS
// Improved design with Badge and better spacing
// Avoiding monolithic structure using the UI lib

import Badge from "../../ui-lib/components/Badge";
import type { TxInstrs, InstructionInfo } from "../../types/TxInstrs";



interface TxInstrsViewProps {
    data: TxInstrs;
    className?: string;
}







// Sub-component to display an instruction (LAST_RUN or NEXT)
// Modified to match the requested design (Dark cards, specific badges, vertical separator)
interface InstructionBlockProps {
    title: string;
    instr: InstructionInfo | null;
    showMemoryChanges?: boolean;
}



// Custom specialized badge for the metric values (PC, GAS, COST, DEPTH)
const MetricBadge = ({ label, value, colorClass }: { label: string, value: string | number, colorClass: string }) => (
    <div className={`flex items-center px-2 py-1 rounded border ${colorClass} bg-transparent`}>
        <span className={`text-xs font-bold uppercase mr-2 ${colorClass.replace('border-', 'text-')}`}>{label}</span>
        <span className={`text-xs font-mono ${colorClass.replace('border-', 'text-')}`}>{value}</span>
    </div>
);


function InstructionBlock({ title, instr, showMemoryChanges = true }: InstructionBlockProps) {
    if (!instr) return null;

    // Check if fallback instruction
    const isUnknown = instr.opcode === "UNKNOWN";

    return (
        <div className="h-full flex flex-col">
            {/* Section Title */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>

            {/* Main Info Card */}
            <div className="rounded-lg bg-[#111827] border border-gray-800 p-4 space-y-3 shadow-sm min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-gray-400 text-sm">
                            Instruction <span className="text-gray-200 font-semibold">{instr.number}</span> of {instr.total}
                        </span>
                    </div>
                    <Badge color={isUnknown ? "warning" : "primary"} variant="solid" className="shrink-0 font-bold px-2 py-0.5 text-xs">{instr.opcode}</Badge>
                </div>

                {/* Metrics Grid */}
                <div className="flex flex-wrap gap-2 mt-2">
                    <MetricBadge
                        label="PC"
                        value={instr.pc}
                        colorClass="border-blue-500/30 text-blue-400"
                    />

                    {instr.gas !== undefined && (
                        <MetricBadge
                            label="GAS"
                            value={instr.gas.toLocaleString().replace(/\s/g, ' ')}
                            colorClass="border-green-500/30 text-green-400"
                        />
                    )}

                    {instr.gasCost !== undefined && (
                        <MetricBadge
                            label="COST"
                            value={instr.gasCost}
                            colorClass="border-orange-500/30 text-orange-400"
                        />
                    )}

                    {instr.depth !== undefined && (
                        <MetricBadge
                            label="DEPTH"
                            value={instr.depth}
                            colorClass="border-purple-500/30 text-purple-400"
                        />
                    )}
                </div>
            </div>

            {/* Last Conditional Jump - BELOW the card */}
            {instr.lastConditionalJump && instr.lastConditionalJump.pc !== undefined && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Last Conditional Jump</p>
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-xs font-mono font-bold uppercase">
                            JUMPI
                        </div>
                        <span className="text-gray-400 text-xs font-mono">
                            PC = {instr.lastConditionalJump.pc}
                        </span>
                        {instr.lastConditionalJump.condition && (
                            <span className="text-gray-500 text-xs pl-2 border-l border-gray-700">
                                {instr.lastConditionalJump.condition}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Memory Changes */}
            {showMemoryChanges && instr.memoryChanges && instr.memoryChanges.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Memory Changes</p>
                    <div className="flex flex-wrap gap-2">
                        {instr.memoryChanges.map((mc, i) => (
                            <Badge key={i} color="warning" variant="light" size="sm">
                                Offset: {mc.offset} | Size: {mc.size}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Transaction Instructions View.
 * Displays detailed information about the Last Run and Next Instruction.
 * Adaptive layout: Single column if only one exists, Split view if both exist.
 */
export default function TxInstrsView({ data, className = "" }: TxInstrsViewProps) {
    const hasLast = Boolean(data.lastRunInstr);
    const hasNext = Boolean(data.nextInstrToRun);

    if (!hasLast && !hasNext) return null;

    // Determine layout mode
    const isSplitView = hasLast && hasNext;

    return (
        <div className={`space-y-6 min-w-0 h-full flex flex-col ${className}`}>
            {/* Header with Gas - Integrated at the top of content */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                {/* Small discrete label or empty if Card title exists */}
                <span className="text-xs font-medium text-gray-400">Execution Context</span>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
                    <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">
                        Our gas: <span className="font-semibold ml-1">{data.ourGas.toLocaleString()}</span>
                    </div>
                    <div className="bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">
                        Their gas: <span className="font-semibold ml-1">{data.theirGas.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Content Layout */}
            {isSplitView ? (
                /* 2-Column Split View */
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 relative items-stretch flex-1 min-h-0">
                    <div className="min-w-0 h-full">
                        <InstructionBlock title="Last Run Instruction" instr={data.lastRunInstr} showMemoryChanges={true} />
                    </div>

                    <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-800 self-stretch my-2"></div>

                    <div className="min-w-0 h-full">
                        <InstructionBlock title="Next Instruction" instr={data.nextInstrToRun} showMemoryChanges={true} />
                    </div>
                </div>
            ) : (
                /* Single Column View (Start or End of execution) */
                <div className="min-w-0 flex-1 min-h-0">
                    {hasLast && (
                        <InstructionBlock title="Last Run Instruction" instr={data.lastRunInstr} showMemoryChanges={true} />
                    )}
                    {hasNext && (
                        <InstructionBlock title="Next Instruction" instr={data.nextInstrToRun} showMemoryChanges={true} />
                    )}
                </div>
            )}
        </div>
    );
}
