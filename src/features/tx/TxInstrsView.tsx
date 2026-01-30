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







// Sous-composant pour afficher une instruction (LAST_RUN ou NEXT)
// Modifié pour enlever les bordures externes et s'intégrer dans la "Grande Case"
interface InstructionBlockProps {
    title: string;
    instr: InstructionInfo | null;
    showMemoryChanges?: boolean;
}

// Helper to format hex strings into chunks (64 chars = 32 bytes)
function formatHexChunk(hex: string, chunkSize = 64) {
    if (!hex) return "";
    const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
    const regex = new RegExp(`.{1,${chunkSize}}`, "g");
    const chunks = raw.match(regex) || [];
    return chunks.map(chunk => `0x${chunk}`).join("\n");
}

interface CallDataBlockProps {
    title: string;
    selector?: string;
    callData?: string;
}

function CallDataBlock({ title, selector, callData }: CallDataBlockProps) {
    if (!selector && !callData) return null;
    return (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-200 dark:border-gray-800 space-y-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            {selector && (
                <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Function selector</span>
                    <p className="font-mono text-xs text-cyan-500 mt-1 break-all">{selector}</p>
                </div>
            )}
            {callData && (
                <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Call data</span>
                    <pre className="font-mono text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed mt-1 whitespace-pre-wrap">
                        {formatHexChunk(callData)}
                    </pre>
                </div>
            )}
        </div>
    );
}


function InstructionBlock({ title, instr, showMemoryChanges = true }: InstructionBlockProps) {
    if (!instr) return null;

    // Check if fallback instruction
    const isUnknown = instr.opcode === "UNKNOWN";

    return (
        <div>
            {/* Titre de la section */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{title}</h4>

            {/* Infos principales sur fond sombre */}
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800/50 p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Instruction <span className="text-gray-900 dark:text-white font-semibold">{instr.number}</span> of {instr.total}
                    </span>
                    <Badge color={isUnknown ? "warning" : "primary"} variant="solid">{instr.opcode}</Badge>
                </div>

                {isUnknown && (
                    <div className="text-gray-500 italic text-sm py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                        {instr.description || "Instruction details not available"}
                    </div>
                )}

                {/* Grid des infos - Always render even if unknown */}
                {/* Grid des infos - Colored Badges in one line */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded">
                        <span className="text-blue-500 dark:text-blue-400 font-bold">PC</span>
                        <span className="text-blue-700 dark:text-blue-300">{instr.pc}</span>
                    </div>

                    {instr.gas !== undefined && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded">
                            <span className="text-green-500 dark:text-green-400 font-bold">GAS</span>
                            <span className="text-green-700 dark:text-green-300">{instr.gas.toLocaleString()}</span>
                        </div>
                    )}

                    {instr.gasCost !== undefined && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded">
                            <span className="text-orange-500 dark:text-orange-400 font-bold">COST</span>
                            <span className="text-orange-700 dark:text-orange-300">{instr.gasCost}</span>
                        </div>
                    )}

                    {instr.depth !== undefined && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded">
                            <span className="text-purple-500 dark:text-purple-400 font-bold">DEPTH</span>
                            <span className="text-purple-700 dark:text-purple-300">{instr.depth}</span>
                        </div>
                    )}
                </div>



            </div>

            {/* Memory Changes - Only show if there are actual changes */}
            {showMemoryChanges && instr.memoryChanges && instr.memoryChanges.length > 0 && (
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

            {/* Last Conditional Jump - Only show if present with valid PC */}
            {instr.lastConditionalJump && instr.lastConditionalJump.pc !== undefined && (
                <div className="mt-4 px-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Last Conditional Jump</p>
                    <div className="flex items-center gap-2 text-xs font-mono">
                        <Badge color="error" variant="light">JUMPI</Badge>
                        <span className="text-gray-600 dark:text-gray-400">PC = {instr.lastConditionalJump.pc}</span>
                        {instr.lastConditionalJump.condition && (
                            <>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-600 dark:text-gray-400">Condition = {instr.lastConditionalJump.condition}</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TxInstrsView({ data, className = "" }: TxInstrsViewProps) {
    const hasLast = Boolean(data.lastRunInstr);
    const hasNext = Boolean(data.nextInstrToRun);

    if (!hasLast && !hasNext) return null;

    const callInstr = data.nextInstrToRun ?? data.lastRunInstr;
    const hasCallSection = Boolean(callInstr?.callData || callInstr?.functionSelector);

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

            {/* 2-Column Layout for Last and Next Instructions */}
            <div className={`grid grid-cols-1 ${hasLast && hasNext ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 relative`}>
                {/* Column 1: Last Run */}
                {hasLast && (
                    <div>
                        <InstructionBlock title="Last Run Instruction" instr={data.lastRunInstr} showMemoryChanges={true} />
                    </div>
                )}

                {/* Vertical Separator for large screens */}
                {hasLast && hasNext && (
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gray-100 dark:bg-gray-800 -translate-x-1/2" />
                )}

                {/* Column 2: Next */}
                {hasNext && (
                    <div>
                        <InstructionBlock title="Next Instruction" instr={data.nextInstrToRun} showMemoryChanges={true} />
                    </div>
                )}
            </div>

            {hasCallSection && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Call Data</p>
                    <CallDataBlock
                        title={data.nextInstrToRun ? "Current" : "Last Run"}
                        selector={callInstr?.functionSelector}
                        callData={callInstr?.callData}
                    />
                </div>
            )}


        </div>
    );
}
