// Each item has a status for highlighting (consumed, produced, neutral).
export type StackItemStatus = "consumed" | "produced" | "neutral";

export interface StackItem {
    value: string;
    label?: string;

    // Highlighting status
    // - consumed (red): The instruction consumed this item
    // - produced (green): The instruction produced this item
    // - neutral: Not affected by the current instruction
    status: StackItemStatus;


    // Info about the instruction that created this item
    modifiedAt?: {
        pc: number;
        opcode: string;

    };
    // Flag to indicate a recently popped item (ghost)
    isPopped?: boolean;
    
    // Step number when this item was added to history
    stepNumber?: number;
}
