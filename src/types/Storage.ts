// Storage.ts
// Types for EVM Storage and Transient Storage

export interface StorageItem {
    // Storage slot key (32 bytes hex)
    key: string;

    // Stored value (32 bytes hex)
    value: string;

    // Log ID that modified this slot (for tracing origin)
    logId?: number;

    // Modification info
    modifiedAt?: {
        pc: number;
        opcode: string;
    };

    // Is this slot newly created?
    isNewSlot?: boolean;

    // Was this slot modified in this step?
    isModifiedInCurrentStep?: boolean;
}

export interface StorageUpdate {
    key: string;
    value: string;
    creatingSlot: boolean;
}

export interface TransientStorageItem {
    // Transient slot key (32 bytes hex)
    key: string;

    // Stored value (32 bytes hex)
    value: string;

    // Log ID that modified this slot
    logId: number;

    // Modification info
    modifiedAt?: {
        pc: number;
        opcode: string;
    };

    // Was this slot modified in this step?
    isModifiedInCurrentStep?: boolean;
}

export interface TransientStorageUpdate {
    key: string;
    value: string;
    creatingSlot: boolean;
}
