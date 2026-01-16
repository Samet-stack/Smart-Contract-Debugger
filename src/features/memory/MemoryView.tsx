// MemoryView.tsx   
// Ce composant affiche les segments mémoire de l'EVM sous forme de tableau.
// Chaque ligne montre : Offset (position), Value (valeur hex), et l'instruction
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
        // Conteneur avec scroll horizontal si la table est trop large
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Table>
                {/* EN-TÊTE DU TABLEAU - 3 colonnes */}
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader>Offset</TableCell>
                        <TableCell isHeader>Value</TableCell>
                        <TableCell isHeader>Modified at (PC: OP)</TableCell>
                    </TableRow>
                </TableHeader>

                {/* CORPS DU TABLEAU - Une ligne par segment mémoire */}
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
                                PC={segment.modifiedAt.pc} | {segment.modifiedAt.opcode}
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* Message si aucun segment à afficher */}
                    {segments.length === 0 && (
                        <TableRow>
                            <TableCell className="text-center text-gray-500 italic" colSpan={3}>
                                Aucun segment mémoire à afficher
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
