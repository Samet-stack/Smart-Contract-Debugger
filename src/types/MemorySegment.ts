// MemorySegment.ts
// This type represents a memory segment in the EVM.
// Simplified structure based on feedback

export interface MemorySegment {
    // Memory position (address). Ex: 0, 32, 64, 96...
    offset: number;

    // Hexadecimal value stored at this offset
    value: string;

    // Info about the instruction that modified this segment
    modifiedAt?: {
        // Program Counter (PC): instruction position in bytecode
        pc: number;

        // Opcode: EVM instruction name (MSTORE, CALLDATACOPY, etc.)
        opcode: string;
    };

    isModifiedInCurrentStep: boolean;
}
