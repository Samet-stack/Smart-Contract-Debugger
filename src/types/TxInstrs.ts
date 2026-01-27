// Type pour les informations de transaction et d'instructions EVM
// Inspiré du vrai Apollo son ancien version 
export interface MemoryMapping {
    range: string;       // "[0;4]", "[4;36]", etc.
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
    number: number;
    total: number;
    pc: number;
    opcode: string;
    functionSelector?: string;
    callData?: string;
    memoryMappings?: MemoryMapping[];
    gas?: number;
    gasCost?: number;
    depth?: number;
    memoryChanges?: MemoryChange[];
    lastConditionalJump?: ConditionalJump;
    // Storage updates
    storageUpdate?: {
        key: string;
        value: string;
        isNew: boolean;
    };
    transientStorageUpdate?: {
        key: string;
        value: string;
        isNew: boolean;
    };
}
export interface TxInstrs {
    ourGas: number;
    theirGas: number;
    lastRunInstr: InstructionInfo | null;
    nextInstrToRun: InstructionInfo | null;
}