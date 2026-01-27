// MemoryView.tsx   
// Ce composant affiche les segments mémoire de l'EVM sous forme de tableau.
// Each line shows: Offset (position), Value (hex), and the instruction
// DÉPENDANCES :
//   - Table (de ui-lib) : Composant tableau réutilisable
//   - MemorySegment (type) : Structure des données mémoire

import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui-lib/components/Table";
import type { MemorySegment } from "../../types/MemorySegment";

// Props du composant : segments = tableau de données, className = style optionnel
interface MemoryViewProps {
    segments: MemorySegment[];
    className?: string;
}

export default function MemoryView({ segments, className = "" }: MemoryViewProps) {

    return (
        // Container with scroll if table is too wide
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Table>
                {/* TABLE HEADER - 3 columns */}
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader>Offset</TableCell>
                        <TableCell isHeader>Value</TableCell>
                        <TableCell isHeader>Modified at (PC: OP)</TableCell>
                    </TableRow>
                </TableHeader>

                {/* TABLE BODY - One line per memory segment */}
                <TableBody>
                    {segments.map((segment) => (
                        <TableRow key={segment.offset}>
                            {/* Colonne 1 : Position en mémoire (0, 32, 64...) */}
                            <TableCell className="text-blue-500 dark:text-blue-400">
                                {segment.offset}
                            </TableCell>

                            {/* Colonne 2 : Valeur hexadécimale stockée */}
                            {/* break-all = permet de couper les longues chaînes */}
                            <TableCell className="max-w-xs break-all text-xs" title={segment.value}>
                                {segment.value}
                            </TableCell>

                            {/* Colonne 3 : Instruction qui a modifié ce segment */}
                            {/* Affiche le Program Counter (PC) et l'Opcode (MSTORE, etc.) */}
                            <TableCell className="text-green-600 dark:text-green-400">
                                {segment.modifiedAt ? (
                                    <>
                                        <span className="mr-3 font-mono">{segment.modifiedAt.pc}</span>
                                        {segment.modifiedAt.opcode}
                                    </>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* Message si aucun segment à afficher */}
                    {segments.length === 0 && (
                        <TableRow>
                            <TableCell className="text-center text-gray-500 italic" colSpan={3}>
                                No memory segments to display
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
