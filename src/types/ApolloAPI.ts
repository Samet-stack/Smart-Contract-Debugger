
export type StackItemStatus = "consumed" | "produced" | "neutral";
export interface StackItem {
    value: string; // 32 bytes hex
    label?: string;
    status: StackItemStatus;
    modifiedAt?: { pc: number; opcode: string };
    stepNumber?: number; // Step when this item was added to history
}
export interface MemorySegment {
    offset: number;
    value: string;
    ascii?: string; // ASCII representation for display
    modifiedAt?: { pc: number; opcode: string };
    isModifiedInCurrentStep: boolean;
}
export interface MemoryMapping {
    range: string;
    pc: number;
    opcode: string;
}

export interface MemoryChange {
    offset: number;
    size: number;
}

export interface ConditionalJump {
    pc: number;
    opcode: string;
    condition: string;
}

export interface InstructionInfo {
    pc: number;
    opcode: string;
    gas: number;
    gasCost: number;
    number: number;
    total: number;
    description?: string;

    callData?: string;
    functionSelector?: string;
    address?: string;
    depth?: number;
    memoryMappings?: MemoryMapping[];
    memoryChanges?: MemoryChange[];
    lastConditionalJump?: ConditionalJump;
}
export interface Breakpoint {
    id: string;
    type: "Storage" | "Transient" | "Memory" | "Opcode" | "PC";
    value: string;
    enabled: boolean;
    min?: string;
    max?: string;
}
import type { StorageItem, TransientStorageItem } from "./Storage";

export interface DebuggerState {
    currentStep: number;
    totalSteps: number;
    pcCoverage: number;
    currentInstruction: InstructionInfo | null;
    nextInstruction: InstructionInfo | null;
    stack: StackItem[];
    memory: MemorySegment[];
    storage: StorageItem[];
    transientStorage: TransientStorageItem[];
    isLoading: boolean;
    error: string | null;
    traceId: string | null;
}

export interface ApolloDebuggerAPI {
    loadTrace(traceData: unknown): void;
    getCurrentState(): DebuggerState;
    next(): DebuggerState;
    prev(): DebuggerState;
    run(): void;
    pause(): void;
    setSpeed(speed: number): void;
    setStepSize(stepSize: number): void;
    setBreakpoint(bp: Breakpoint): void;


    subscribe(callback: (state: DebuggerState) => void): () => void;
}
declare global {
    interface Window {
        ApolloDebugger?: ApolloDebuggerAPI;
    }
}
