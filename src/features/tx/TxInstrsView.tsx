// TxInstrsView.tsx
// Composant détaillé pour afficher TX_INSTRS
// Design amélioré avec Badge et meilleur espacement 
// on évite  de tous mettre on structure grâce à la lib

import Badge from "../../ui-lib/components/Badge";
import type { TxInstrs, InstructionInfo } from "../../types/TxInstrs";

interface TxInstrsViewProps {
    data: TxInstrs;
    className?: string; // className is kept but usually not needed for border anymore
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
// Modifié pour enlever les bordures externes et s'intégrer dans la "Grande Case"
function InstructionBlock({ title, instr }: { title: string; instr: InstructionInfo | null }) {
    if (!instr) {
        return (
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{title}</h4>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500 italic text-sm text-center">None</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Titre de la section */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{title}</h4>

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

            {/* Memory Changes */}
            {instr.memoryChanges && instr.memoryChanges.length > 0 && (
                <div className="mt-4 px-1">
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
                <div className="mt-4 px-1">
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
        <div className={`${className} space-y-6`}>
            {/* Header avec Gas - Intégré en haut du contenu */}
            <div className="flex items-center justify-between px-1">
                {/* Petit label discrêt ou vide si on a déjà le titre de la Card */}
                <span className="text-xs font-medium text-gray-400">Execution Context</span>

                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                        Our gas: <span className="font-semibold ml-1">{data.ourGas.toLocaleString()}</span>
                    </div>
                    <div className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                        Their gas: <span className="font-semibold ml-1">{data.theirGas.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Separator discret sous le header gas */}
            {/* <div className="border-t border-gray-100 dark:border-gray-800" /> */}

            <InstructionBlock title="Last Run Instruction" instr={data.lastRunInstr} />

            {/* Separator entre Last et Next */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            <InstructionBlock title="Next Instruction" instr={data.nextInstrToRun} />
        </div>
    );
}
