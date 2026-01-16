// TxInstrsView.tsx
// Composant détaillé pour afficher TX_INSTRS
// Design amélioré avec Badge et meilleur espacement 
// on évite  de tous mettre on structure grâce à la lib

import Badge from "../../ui-lib/components/Badge";
import type { TxInstrs, InstructionInfo } from "../../types/TxInstrs";

interface TxInstrsViewProps {
    data: TxInstrs;
    className?: string;
}

// Sous-composant pour une ligne label: valeur
function InfoRow({ label, value, valueColor = "text-gray-700 dark:text-gray-200" }: { label: string; value: string | number; valueColor?: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <span className="text-gray-500 text-xs min-w-[100px]">{label}</span>
            <span className={`font-mono text-sm ${valueColor}`}>{value}</span>
        </div>
    );
}

// Sous-composant pour afficher une instruction (LAST_RUN ou NEXT)
function InstructionBlock({ title, instr }: { title: string; instr: InstructionInfo | null }) {
    if (!instr) {
        return (
            <div className="py-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>
                <p className="text-gray-600 italic text-sm">None</p>
            </div>
        );
    }

    return (
        <div className="py-4">
            {/* Titre de la section */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h4>

            {/* Infos principales sur fond sombre */}
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800/50 p-4 space-y-2">
                {/* Instruction + Opcode */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Instruction <span className="text-gray-900 dark:text-white font-semibold">{instr.number}</span> of {instr.total}
                    </span>
                    <Badge color="primary" variant="solid">{instr.opcode}</Badge>
                </div>

                {/* Grid des infos */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <InfoRow label="pc:" value={instr.pc} />
                    {instr.gas !== undefined && <InfoRow label="gas:" value={instr.gas.toLocaleString()} />}
                    {instr.gasCost !== undefined && <InfoRow label="gasCost:" value={instr.gasCost} />}
                    {instr.depth !== undefined && <InfoRow label="depth:" value={instr.depth} />}
                </div>

                {/* Function selector */}
                {instr.functionSelector && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500 text-xs">Function selector:</span>
                        <p className="font-mono text-xs text-cyan-400 mt-1">{instr.functionSelector}</p>
                    </div>
                )}

                {/* Call data - juste le texte, pas de boîte */}
                {instr.callData && (
                    <div className="mt-3">
                        <span className="text-gray-500 text-xs">Call data:</span>
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed mt-1">
                            {instr.callData}
                        </p>
                    </div>
                )}
            </div>

            {/* Memory Mappings - Style amélioré */}
            {instr.memoryMappings && instr.memoryMappings.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Memory Mappings</p>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {instr.memoryMappings.map((m, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between px-3 py-2 text-xs font-mono ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-gray-100 dark:bg-gray-800/50'
                                    }`}
                            >
                                <span className="text-gray-700 dark:text-gray-400">{m.range}</span>
                                <span className="text-gray-600">=&gt;</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">[ PC = {m.pc}</span>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-gray-400">OP =</span>
                                    <Badge color="info" size="sm">{m.opcode}</Badge>
                                    <span className="text-gray-500">]</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Memory Changes */}
            {instr.memoryChanges && instr.memoryChanges.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Memory Changes</p>
                    <div className="flex flex-wrap gap-2">
                        {instr.memoryChanges.map((mc, i) => (
                            <Badge key={i} color="warning" variant="light">
                                Offset: {mc.offset} | Size: {mc.size}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Last Conditional Jump */}
            {instr.lastConditionalJump && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Last Conditional Jump</p>
                    <div className="flex items-center gap-2 text-xs font-mono">
                        <Badge color="error" variant="light">JUMPI</Badge>
                        <span className="text-gray-600 dark:text-gray-400">PC = {instr.lastConditionalJump.pc}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-600 dark:text-gray-400">Condition = {instr.lastConditionalJump.condition}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TxInstrsView({ data, className = "" }: TxInstrsViewProps) {
    return (
        <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
            {/* Header avec Gas */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">INSTRUCTIONS</h3>
                <div className="flex items-center gap-6 text-sm font-mono">
                    <div>
                        <span className="text-gray-500">Our gas:</span>
                        <span className="ml-2 text-green-400 font-semibold">{data.ourGas.toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Their gas:</span>
                        <span className="ml-2 text-red-400 font-semibold">{data.theirGas.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Content - Scroll interne */}
            <div className="px-5 divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                <InstructionBlock title="Last Run Instruction" instr={data.lastRunInstr} />
                <InstructionBlock title="Next Instruction" instr={data.nextInstrToRun} />
            </div>
        </div>
    );
}
