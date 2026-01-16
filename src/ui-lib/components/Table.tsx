// Composant Table réutilisable (adapté de TailAdmin)
// Utilisé pour afficher des données tabulaires (Memory, Stack, etc.)
import type { ReactNode } from "react";

// Props for Table
interface TableProps {
    children: ReactNode;
    className?: string;
}

// Props for TableHeader
interface TableHeaderProps {
    children: ReactNode;
    className?: string;
}

// Props for TableBody
interface TableBodyProps {
    children: ReactNode;
    className?: string;
}

// Props for TableRow
interface TableRowProps {
    children: ReactNode;
    className?: string;
}

// Props for TableCell
interface TableCellProps {
    children: ReactNode;
    isHeader?: boolean;
    className?: string;
    title?: string;       // Tooltip on hover
    colSpan?: number;     // Column span
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className = "" }) => {
    return (
        <table className={`min-w-full text-sm ${className}`}>
            {children}
        </table>
    );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
    return (
        <thead className={`bg-gray-100 dark:bg-gray-800 ${className}`}>
            {children}
        </thead>
    );
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
    return (
        <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
            {children}
        </tbody>
    );
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className = "" }) => {
    return (
        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${className}`}>
            {children}
        </tr>
    );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
    children,
    isHeader = false,
    className = "",
    title,
    colSpan,
}) => {
    const CellTag = isHeader ? "th" : "td";
    const baseClasses = isHeader
        ? "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
        : "px-4 py-3 text-gray-700 dark:text-gray-300 font-mono";

    return <CellTag className={`${baseClasses} ${className}`} title={title} colSpan={colSpan}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
