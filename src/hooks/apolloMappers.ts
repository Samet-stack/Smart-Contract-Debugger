import type { DebuggerState, InstructionInfo, MemorySegment } from "../types/ApolloAPI";
import type { StackItem } from "../types/StackItem";
import type { StorageItem, TransientStorageItem } from "../types/Storage";
import type {
    log_infos,
    stack as EngineStack,
    storage as EngineStorage,
    transient_storage as EngineTransientStorage,
    instr
} from "../types/ApolloEngine";

type LogMapLike = Map<number, log_infos> | { instr_map: Map<number, log_infos> } | undefined;

export interface ContractOpcode {
    pc: number;
    op: string;
    arg?: string;
}

// Helper to extract actual Map from logMap structure
const getActualLogMap = (logMap: LogMapLike): Map<number, log_infos> | undefined => {
    if (!logMap) return undefined;
    if (logMap instanceof Map) return logMap;
    if ("instr_map" in logMap && logMap.instr_map instanceof Map) return logMap.instr_map;
    return undefined;
};

// Helper: Map Engine Stack to UI StackItem
export const mapStack = (engineStack: EngineStack, logMap?: LogMapLike): StackItem[] => {
    if (!engineStack || !Array.isArray(engineStack)) return [];

    const actualLogMap = getActualLogMap(logMap);

    return engineStack.map((item, index) => {
        let modifiedAt = { pc: 0, opcode: "GENESIS" };
        if (actualLogMap && item.log_id !== undefined) {
            const log = actualLogMap.get(item.log_id);
            if (log) {
                modifiedAt = {
                    pc: log.next_instr.pc,
                    opcode: log.next_instr.op
                };
            }
        }

        return {
            value: item.value,
            label: `stack[${index}]`,
            status: "neutral",
            modifiedAt
        };
    });
};

// Helper: Map Engine Storage to UI StorageItem[]
export const mapStorage = (
    engineStorage: EngineStorage | undefined,
    logMap: LogMapLike,
    storageUpdate?: { key: string; value: string; creating_slot: boolean }
): StorageItem[] => {
    if (!engineStorage) return [];

    const actualLogMap = getActualLogMap(logMap);
    const items: StorageItem[] = [];

    // Handle both Map and plain object
    const entries: [string, { value: string; log_id?: number }][] =
        engineStorage instanceof Map
            ? Array.from(engineStorage.entries())
            : Object.entries(engineStorage);

    for (const [key, data] of entries) {
        const isModified = storageUpdate?.key === key;

        // Look up log_id to find who modified this slot
        let modifiedAt = undefined;
        if (actualLogMap && data.log_id !== undefined) {
            const log = actualLogMap.get(data.log_id);
            if (log) {
                modifiedAt = {
                    pc: log.next_instr.pc,
                    opcode: log.next_instr.op
                };
            }
        }

        items.push({
            key,
            value: data.value,
            logId: data.log_id,
            isNewSlot: isModified && storageUpdate?.creating_slot,
            isModifiedInCurrentStep: isModified,
            modifiedAt
        });
    }

    return items;
};

// Helper: Map Engine Transient Storage to UI TransientStorageItem[]
export const mapTransientStorage = (
    engineTransient: EngineTransientStorage | undefined,
    logMap: LogMapLike,
    transientUpdate?: { key: string; value: string; creating_slot: boolean }
): TransientStorageItem[] => {
    if (!engineTransient) return [];

    const actualLogMap = getActualLogMap(logMap);
    const items: TransientStorageItem[] = [];

    // Handle both Map and plain object
    const entries: [string, { value: string; log_id: number }][] =
        engineTransient instanceof Map
            ? Array.from(engineTransient.entries())
            : Object.entries(engineTransient);

    for (const [key, data] of entries) {
        const isModified = transientUpdate?.key === key;

        let modifiedAt = undefined;
        if (actualLogMap && data.log_id !== undefined) {
            const log = actualLogMap.get(data.log_id);
            if (log) {
                modifiedAt = {
                    pc: log.next_instr.pc,
                    opcode: log.next_instr.op
                };
            }
        }

        items.push({
            key,
            value: data.value,
            logId: data.log_id,
            isModifiedInCurrentStep: isModified,
            modifiedAt
        });
    }

    return items;
};

// Helper: Map contract code to UI opcodes
export const mapContractCode = (code: instr[]): ContractOpcode[] => {
    return code.map((instr) => ({
        pc: instr.pc,
        op: instr.op,
        arg: instr.arg
    }));
};

// Helper: Convert ArrayBuffer to Hex String
export const bufferToHex = (buffer: ArrayBuffer | undefined): string => {
    if (!buffer) return "";
    return "0x" + Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

// Type for full memory mappings (like old Apollo)
export interface FullMemoryMapping {
    range: string;      // "[0;4]"
    pc: number;
    opcode: string;
}

// Helper: Build full memory mappings from memory.log_ids
// The WASM engine already provides ranges as keys like "[0;4]", "[4;36]", etc.
export const buildFullMemoryMappings = (
    memoryLogIds: Map<string, number> | Record<string, number> | undefined,
    logMap: LogMapLike // Can be Map or {counter, instr_map} structure
): FullMemoryMapping[] => {
    // Extract the actual Map from logMap structure if needed
    const actualLogMap: Map<number, log_infos> | undefined =
        logMap && 'instr_map' in logMap && logMap.instr_map instanceof Map ? logMap.instr_map :
            logMap instanceof Map ? logMap : undefined;


    if (!memoryLogIds || !actualLogMap) {
        return [];
    }

    const mappings: FullMemoryMapping[] = [];

    // Keys are already ranges like "[0;4]", "[4;36]", etc.
    const entries = memoryLogIds instanceof Map
        ? Array.from(memoryLogIds.entries())
        : Object.entries(memoryLogIds);

    for (const [rangeKey, logId] of entries) {
        const srcLog = actualLogMap.get(logId as number);
        if (srcLog) {
            mappings.push({
                range: rangeKey, // Already formatted as "[start;end]"
                pc: srcLog.next_instr.pc,
                opcode: srcLog.next_instr.op
            });
        }
    }

    // Sort by start offset (extract number from "[start;end]")
    mappings.sort((a, b) => {
        const aStart = parseInt(a.range.slice(1)); // "[0;4]" -> "0"
        const bStart = parseInt(b.range.slice(1));
        return aStart - bStart;
    });

    return mappings;
};

// Helper: Map Engine Log to DebuggerState
export const mapLogToState = (
    log: log_infos | undefined,
    totalSteps: number,
    currentStep: number,
    txHash: string,
    logMap?: LogMapLike
): DebuggerState => {
    if (!log) {
        return {
            currentStep: 0,
            totalSteps,
            pcCoverage: 0,
            currentInstruction: null,
            nextInstruction: null,
            stack: [],
            memory: [],
            storage: [],
            transientStorage: [],
            isLoading: false,
            error: null,
            traceId: null
        };
    }

    // Dynamic total steps to allow exceeding initial estimate
    const effectiveTotalSteps = Math.max(totalSteps, currentStep + 1);

    const memoryChanges = log.next_instr.memory_update?.map((mu) => ({
        offset: Number(mu.offset),
        size: Number(mu.size)
    })) || [];

    const memoryMappings = memoryChanges.map((mc) => ({
        range: `[${mc.offset};${mc.offset + mc.size}]`,
        pc: log.next_instr.pc,
        opcode: log.next_instr.op
    }));

    const currentInstr: InstructionInfo = {
        pc: log.next_instr.pc,
        opcode: log.next_instr.op,
        gas: Number(log.remaining_gas),
        gasCost: Number(log.next_instr.gas_cost),
        number: currentStep + 1, // 1-based index for display
        total: effectiveTotalSteps,

        description: `Executed ${log.next_instr.op}`,
        memoryMappings,
        memoryChanges,
        // Last conditional jump (pc only from engine)
        lastConditionalJump: log.last_conditional_jump !== undefined ? {
            pc: log.last_conditional_jump,
            opcode: "JUMPI",
            condition: ""
        } : undefined,

        // Add Context Data
        address: log.address,
        callData: log.call_data?.value ? bufferToHex(log.call_data.value) : "",
        functionSelector: log.selector ? bufferToHex(log.selector) : "",
        depth: log.depth

    };

    // Map Stack
    const mappedStack = mapStack(log.exec_state.stack, logMap);

    // Map Memory (ModifiedAt Logic)
    const memorySegments: MemorySegment[] = [];
    const memoryValue = log.exec_state.memory?.value;
    const memoryLogIds = log.exec_state.memory?.log_ids;

    if (memoryValue) {
        const uint8Memory = new Uint8Array(memoryValue);
        for (let i = 0; i < uint8Memory.length; i += 32) {
            const chunk = uint8Memory.slice(i, i + 32);
            // Manual hex for now to be safe with slice
            const hexVal = Array.from(chunk)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            // Look up log_id for this segment
            // Keys in memoryLogIds are ranges like "[0;4]", "[4;36]", etc.
            // We need to find which range contains our offset 'i'
            let modifiedAt = undefined;
            if (memoryLogIds && logMap) {
                const actualLogMap = getActualLogMap(logMap);

                // Find the range that contains offset 'i'
                const entries = memoryLogIds instanceof Map
                    ? Array.from(memoryLogIds.entries())
                    : Object.entries(memoryLogIds);

                for (const [rangeKey, logId] of entries) {
                    // Parse range "[start;end]"
                    const match = rangeKey.match(/\[(\d+);(\d+)\]/);
                    if (match) {
                        const start = parseInt(match[1]);
                        const end = parseInt(match[2]);
                        // Check if our 32-byte chunk starting at 'i' overlaps with this range
                        if (i >= start && i < end) {
                            const srcLog = actualLogMap?.get(logId as number);
                            if (srcLog) {
                                modifiedAt = { pc: srcLog.next_instr.pc, opcode: srcLog.next_instr.op };
                            }
                            break; // Found a match
                        }
                    }
                }
            }

            memorySegments.push({
                offset: i,
                value: "0x" + hexVal,
                ascii: Array.from(chunk).map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".").join(""),
                isModifiedInCurrentStep: false,
                modifiedAt
            });
        }
    }

    // Map Storage
    const storageUpdate = log.next_instr.storage_update;
    const storageItems = mapStorage(log.exec_state.storage, logMap, storageUpdate ? {
        key: storageUpdate.key,
        value: storageUpdate.value,
        creating_slot: storageUpdate.creating_slot
    } : undefined);

    // Map Transient Storage
    const transientUpdate = log.next_instr.transient_storage_update;
    const transientItems = mapTransientStorage(log.exec_state.transient_storage, logMap, transientUpdate ? {
        key: transientUpdate.key,
        value: transientUpdate.value,
        creating_slot: transientUpdate.creating_slot
    } : undefined);

    return {
        currentStep,
        totalSteps,
        pcCoverage: 0,
        currentInstruction: null,
        nextInstruction: currentInstr,

        stack: mappedStack,
        memory: memorySegments,
        storage: storageItems,
        transientStorage: transientItems,
        isLoading: false,
        error: null,
        traceId: txHash
    };
};
