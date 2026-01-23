// MemorySegment.ts
// Ce type représente un segment de mémoire dans l'EVM.
// en fonction du feed back de thomas, j'ai fais une structure plus simple

export interface MemorySegment {
    // Position en mémoire (adresse). Ex: 0, 32, 64, 96...
    offset: number;

    // Valeur hexadécimale stockée à cet offset
    value: string;

    // Information sur l'instruction qui a modifié ce segment
    // Information sur l'instruction qui a modifié ce segment
    modifiedAt?: {
        // Program Counter (PC) : position de l'instruction dans le bytecode
        pc: number;

        // Opcode : nom de l'instruction EVM (MSTORE, CALLDATACOPY, etc.)
        opcode: string;
    };

    isModifiedInCurrentStep: boolean;
}
