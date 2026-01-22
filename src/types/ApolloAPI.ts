
export type StackItemStatus = "consumed" | "produced" | "neutral";
export interface StackItem {
    value: string; // 32 bytes hex
    label?: string;
    status: StackItemStatus;
    modifiedAt?: { pc: number; opcode: string };
}
export interface MemorySegment {
    offset: number;
    value: string;
    modifiedAt?: { pc: number; opcode: string };
    isModifiedInCurrentStep: boolean;
}
export interface InstructionInfo {
    pc: number;
    opcode: string;
    gas: number;
    gasCost: number;
    stepNumber: number;
    totalSteps: number;
    description?: string;
}
export interface Breakpoint {
    id: string;
    type: "Storage" | "Transient" | "Memory" | "Opcode" | "PC";
    value: string;
    enabled: boolean;
}
export interface DebuggerState {
    currentStep: number;
    totalSteps: number;
    currentInstruction: InstructionInfo | null;
    stack: StackItem[];
    memory: MemorySegment[];
    isLoading: boolean;
    error: string | null;
    traceId: string | null;
}

export interface ApolloDebuggerAPI {
    loadTrace(traceData: any): void;
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