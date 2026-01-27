// Storage.ts
// Types pour le Storage et Transient Storage de l'EVM

export interface StorageItem {
    // Clé du slot de storage (32 bytes hex)
    key: string;

    // Valeur stockée (32 bytes hex)
    value: string;

    // ID du log qui a modifié ce slot (pour tracer l'origine)
    logId?: number;

    // Information sur la modification
    modifiedAt?: {
        pc: number;
        opcode: string;
    };

    // Est-ce que ce slot vient d'être créé ?
    isNewSlot?: boolean;

    // Est-ce que ce slot a été modifié à cette étape ?
    isModifiedInCurrentStep?: boolean;
}

export interface StorageUpdate {
    key: string;
    value: string;
    creatingSlot: boolean;
}

export interface TransientStorageItem {
    // Clé du slot transient (32 bytes hex)
    key: string;

    // Valeur stockée (32 bytes hex)
    value: string;

    // ID du log qui a modifié ce slot
    logId: number;

    // Information sur la modification
    modifiedAt?: {
        pc: number;
        opcode: string;
    };

    // Est-ce que ce slot a été modifié à cette étape ?
    isModifiedInCurrentStep?: boolean;
}

export interface TransientStorageUpdate {
    key: string;
    value: string;
    creatingSlot: boolean;
}
