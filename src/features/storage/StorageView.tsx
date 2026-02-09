// StorageView.tsx
// Component to display EVM Storage

import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui-lib/components/Table";
import type { StorageItem } from "../../types/Storage";

interface StorageViewProps {
    items: StorageItem[];
    className?: string;
}

export default function StorageView({ items, className = "" }: StorageViewProps) {
    // Function to truncate long hex strings
    const truncateHex = (hex: string, start = 6, end = 4) => {
        if (hex.length <= start + end + 2) return hex;
        return `${hex.slice(0, start + 2)}...${hex.slice(-end)}`;
    };

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader>Slot (Key)</TableCell>
                        <TableCell isHeader>Value</TableCell>
                        <TableCell isHeader>Modified at</TableCell>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item, index) => (
                        <TableRow
                            key={item.key + index}
                            className={item.isModifiedInCurrentStep ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                        >
                            {/* Slot Key */}
                            <TableCell
                                className="text-purple-600 dark:text-purple-400 font-mono text-xs"
                                title={item.key}
                            >
                                {truncateHex(item.key)}
                                {item.isNewSlot && (
                                    <span className="ml-2 text-[10px] bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-1 rounded">
                                        NEW
                                    </span>
                                )}
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
                                        <span className="text-gray-500 dark:text-gray-400">{item.modifiedAt.opcode}</span>
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
                                No storage data
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
