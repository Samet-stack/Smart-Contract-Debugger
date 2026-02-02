/**
 * Defines the types of breakpoints supported by the debugger.
 * - Storage: Watch for changes in a specific storage slot
 * - Transient: Watch for changes in transient storage
 * - Memory: Watch for changes in a memory range
 */
export type BreakpointType = "Storage" | "Transient" | "Memory";
