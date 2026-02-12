// MemoryView.tsx
// Displays EVM memory segments as a table.
// Each line shows: Offset (position), Value (hex), and the instruction
// DEPENDENCIES:
//   - Table (from ui-lib): Reusable table component
//   - MemorySegment (type): Memory data structure

import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui-lib/components/Table";
import type { MemorySegment } from "../../types/MemorySegment";

// Component Props: segments = data array, className = optional style
interface MemoryViewProps {
    segments: MemorySegment[];
    className?: string;
}

/**
 * Memory View Component.
 * Displays the EVM memory state in 32-byte segments.
 * Highlights:
 * - Current modifications (Green/Red based on instruction)
 * - ASCII representation of valid characters
 * - Tooltip with "Modified At" info
 */
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
                            {/* Column 1: Memory Position (0, 32, 64...) */}
                            <TableCell className="text-blue-500 dark:text-blue-400 whitespace-nowrap">
                                {segment.offset}
                            </TableCell>

                            {/* Column 2: Stored Hex Value */}
                            {/* break-all = allows cutting long strings */}
                            <TableCell className="max-w-xs break-all text-xs" title={segment.value}>
                                {segment.value}
                            </TableCell>

                            {/* Column 3: Instruction that modified this segment */}
                            {/* Displays Program Counter (PC) and Opcode (MSTORE, etc.) */}
                            <TableCell className="text-green-600 dark:text-green-400 break-all">
                                {segment.modifiedAt ? (
                                    <>
                                        <span className="mr-3 font-mono">{segment.modifiedAt.pc}</span>
                                        <span className="break-all">{segment.modifiedAt.opcode}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* Message if no segments to display */}
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
