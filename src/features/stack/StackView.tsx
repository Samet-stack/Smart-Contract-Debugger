// - Rouge (consumed) : éléments consommés par l'instruction
// - Vert (produced) : éléments produits par l'instruction         j'ai trouvé ça donc ça rend le fond rouge ou vert mais avec un mode sombre
// - Neutre : éléments non affectés
//
// DÉPENDANCES :
//   - Table (de ui-lib) : Composant tableau réutilisable
//   - StackItem (type) : Structure des données stack

import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui-lib/components/Table";
import type { StackItem } from "../../types/StackItem";

interface StackViewProps {
    items: StackItem[];
    className?: string;
}

export default function StackView({ items, className = "" }: StackViewProps) {

    // Fonction qui retourne les classes CSS selon le statut
    const getStatusClasses = (status: StackItem["status"]): string => {
        switch (status) {
            case "consumed":
                return "bg-red-500/20";
            case "produced":
                return "bg-green-500/20";
            default:
                return "";
        }
    };

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Table>
                {/* EN-TÊTE */}
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader>Value</TableCell>
                        <TableCell isHeader>Modified at (PC: OP)</TableCell>
                    </TableRow>
                </TableHeader>

                {/* CORPS - Une ligne par élément de stack */}
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={index} className={getStatusClasses(item.status)}>
                            {/* Colonne 1 : Label (si présent) + Valeur */}
                            <TableCell className="break-all text-xs">
                                {item.label && (
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                                        {item.label} :
                                    </span>
                                )}
                                <span className="ml-1">{item.value}</span>
                            </TableCell>

                            {/* Colonne 2 : Instruction qui a produit cet élément */}
                            <TableCell className="text-gray-500 dark:text-gray-400">
                                {item.modifiedAt
                                    ? `${item.modifiedAt.pc}: ${item.modifiedAt.opcode}`
                                    : "-"
                                }
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* Message si stack vide */}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell className="text-center text-gray-500 italic" colSpan={2}>
                                Stack vide
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
