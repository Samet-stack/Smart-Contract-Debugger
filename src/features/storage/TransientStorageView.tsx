// TransientStorageView.tsx
// Composant pour afficher le Transient Storage de l'EVM (EIP-1153)

import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui-lib/components/Table";
import type { TransientStorageItem } from "../../types/Storage";

interface TransientStorageViewProps {
    items: TransientStorageItem[];
    className?: string;
}

export default function TransientStorageView({ items, className = "" }: TransientStorageViewProps) {
    // Fonction pour tronquer les hex longs
    const truncateHex = (hex: string, start = 6, end = 4) => {
        if (hex.length <= start + end + 2) return hex;
        return `${hex.slice(0, start + 2)}...${hex.slice(-end)}`;
    };

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader>Key</TableCell>
                        <TableCell isHeader>Value</TableCell>
                        <TableCell isHeader>Modified at</TableCell>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item, index) => (
                        <TableRow
                            key={item.key + index}
                            className={item.isModifiedInCurrentStep ? "bg-cyan-50 dark:bg-cyan-900/20" : ""}
                        >
                            {/* Key */}
                            <TableCell
                                className="text-cyan-600 dark:text-cyan-400 font-mono text-xs"
                                title={item.key}
                            >
                                {truncateHex(item.key)}
                            </TableCell>

                            {/* Value */}
                            <TableCell
                                className="max-w-xs break-all text-xs font-mono"
                                title={item.value}
                            >
                                {truncateHex(item.value, 10, 6)}
                            </TableCell>

                            {/* Modified At */}
                            <TableCell className="text-green-600 dark:text-green-400 text-xs">
                                {item.modifiedAt ? (
                                    <>
                                        <span className="font-mono mr-2">{item.modifiedAt.pc}</span>
                                        <span className="text-gray-500">{item.modifiedAt.opcode}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}

                    {items.length === 0 && (
                        <TableRow>
                            <TableCell className="text-center text-gray-500 italic" colSpan={3}>
                                No transient storage data
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
