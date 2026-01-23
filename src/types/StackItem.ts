// Chaque élément a un statut pour le highlighting (consommé, produit, neutre).
export type StackItemStatus = "consumed" | "produced" | "neutral";

export interface StackItem {
    value: string;
    label?: string;

    // Status pour le highlighting
    // - consumed (rouge) : L'instruction a consommé cet élément
    // - produced (vert) : L'instruction a produit cet élément
    // - neutral : Pas affecté par l'instruction courante
    status: StackItemStatus;
    

    // Information sur l'instruction qui a créé cet élément
    modifiedAt?: {
        pc: number;
        opcode: string;
    
    };
}
    