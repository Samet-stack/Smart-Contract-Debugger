import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DebuggerState, Breakpoint, InstructionInfo, MemorySegment } from '../types/ApolloAPI';
import type { Breakpoint as EngineBreakpoint } from '../types/ApolloAPI'; // Re-export or just use local definition if needed, but Breakpoint is already imported above

import type { StackItem } from '../types/StackItem';
import type { StorageItem, TransientStorageItem, StorageUpdate, TransientStorageUpdate } from '../types/Storage';
import type {
    transaction_info,
    trace_iterator,
    log_infos,
    stack as EngineStack,
    storage as EngineStorage,
    transient_storage as EngineTransientStorage,
    instr
} from '../types/ApolloEngine';

export type ApolloStatus = "Ready" | "Loading" | "Error";

// Type for the visible stack window
export interface VisibleStackWindow {
    current: StackItem | null;  // Green - current step
    previous: StackItem | null; // Red - previous step
}

// Type for contract code/opcodes
export interface ContractOpcode {
    pc: number;
    op: string;
    arg?: string;
}

// Type for transaction info exposed to UI
export interface TransactionDetails {
    hash: string;
    to: string;
    gas: string;
    gasUsed: string;
    blockHash: string;
    transactionIndex: number;
}

// Helper to extract actual Map from logMap structure
const getActualLogMap = (logMap: any): Map<number, log_infos> | undefined => {
    if (logMap?.instr_map instanceof Map) return logMap.instr_map;
    if (logMap instanceof Map) return logMap;
    return undefined;
};

// Helper: Map Engine Stack to UI StackItem
const mapStack = (engineStack: EngineStack, logMap?: any): StackItem[] => {
    if (!engineStack || !Array.isArray(engineStack)) return [];

    const actualLogMap = getActualLogMap(logMap);

    return engineStack.map((item, index) => {
        let modifiedAt = { pc: 0, opcode: 'GENESIS' };
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
            status: 'neutral',
            modifiedAt
        };
    });
};

// Helper: Map Engine Storage to UI StorageItem[]
const mapStorage = (engineStorage: EngineStorage | undefined, logMap: any, storageUpdate?: { key: string; value: string; creating_slot: boolean }): StorageItem[] => {
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
const mapTransientStorage = (
    engineTransient: EngineTransientStorage | undefined,
    logMap: any,
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
const mapContractCode = (code: instr[]): ContractOpcode[] => {
    return code.map(instr => ({
        pc: instr.pc,
        op: instr.op,
        arg: instr.arg
    }));
};

// Helper: Convert ArrayBuffer to Hex String
const bufferToHex = (buffer: ArrayBuffer | undefined): string => {
    if (!buffer) return "";
    return "0x" + Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0"))
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
const buildFullMemoryMappings = (
    memoryLogIds: Map<string, number> | Record<string, number> | undefined,
    logMap: any // Can be Map or {counter, instr_map} structure
): FullMemoryMapping[] => {
    // Extract the actual Map from logMap structure if needed
    const actualLogMap: Map<number, log_infos> | undefined =
        logMap?.instr_map instanceof Map ? logMap.instr_map :
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
const mapLogToState = (
    log: log_infos | undefined,
    totalSteps: number,
    currentStep: number,
    txHash: string,
    logMap?: Map<number, log_infos>
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

    const memoryChanges = log.next_instr.memory_update?.map(mu => ({
        offset: Number(mu.offset),
        size: Number(mu.size)
    })) || [];

    const memoryMappings = memoryChanges.map(mc => ({
        range: `[${mc.offset};${mc.offset + mc.size}]`,
        pc: log.next_instr.pc,
        opcode: log.next_instr.op
    }));

    const currentInstr: InstructionInfo = {
        pc: log.next_instr.pc,
        opcode: log.next_instr.op,
        gas: Number(log.remaining_gas),
        gasCost: Number(log.next_instr.gas_cost),
        stepNumber: currentStep + 1, // 1-based index for display
        totalSteps: effectiveTotalSteps,
        description: `Executed ${log.next_instr.op}`,
        memoryMappings,
        memoryChanges,
        // Last conditional jump (pc only from engine)
        lastConditionalJump: log.last_conditional_jump !== undefined ? {
            pc: log.last_conditional_jump,
            opcode: "JUMPI",
            condition: "" // Condition not available in current API
        } : undefined
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
            /* const hexVal = bufferToHex(chunk); // Reuse helper if bufferToHex handles Uint8Array or slice buffer properly */
            // Manual hex for now to be safe with slice
            const hexVal = Array.from(chunk)
                .map(b => b.toString(16).padStart(2, "0"))
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
                ascii: Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".").join(""),
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
        currentInstruction: currentInstr,
        nextInstruction: null,
        stack: mappedStack,
        memory: memorySegments,
        storage: storageItems,
        transientStorage: transientItems,
        isLoading: false,
        error: null,
        traceId: txHash
    };
};

export const useApollo = () => {
    // 1. Core Engine State
    const [status, setStatus] = useState<ApolloStatus>("Ready");
    const [txInfo, setTxInfo] = useState<transaction_info | null>(null);
    const [iterator, setIterator] = useState<trace_iterator | null>(null);

    // 2. UI State
    const [state, setState] = useState<DebuggerState | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // 3. NEW: Storage States
    const [storage, setStorage] = useState<StorageItem[]>([]);
    const [transientStorage, setTransientStorage] = useState<TransientStorageItem[]>([]);
    const [storageUpdate, setStorageUpdate] = useState<StorageUpdate | null>(null);
    const [transientStorageUpdate, setTransientStorageUpdate] = useState<TransientStorageUpdate | null>(null);

    // 4. NEW: Contract Code & Transaction Details
    const [contractCode, setContractCode] = useState<ContractOpcode[]>([]);
    const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);

    // 5. NEW: Call Data & Return Data
    const [callData, setCallData] = useState<string>("");
    const [returnData, setReturnData] = useState<string>("");
    const [selector, setSelector] = useState<string>("");

    // 6. NEW: Current context info
    const [depth, setDepth] = useState<number>(0);
    const [address, setAddress] = useState<string>("");
    const [gasUsed, setGasUsed] = useState<{ main: string; other: string }>({ main: "0", other: "0" });

    // 6.5. Full Memory Mappings (like old Apollo - shows all regions and who wrote them)
    // 6.5. Full Memory Mappings (like old Apollo - shows all regions and who wrote them)
    const [fullMemoryMappings, setFullMemoryMappings] = useState<FullMemoryMapping[]>([]);

    // 6.6 Filters & Breakpoints
    const [filters, setFilters] = useState<string[]>([]);
    const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
    const [skipContract, setSkipContract] = useState(false);



    // Refs for persistence tracking
    const lastDepthRef = useRef<number>(-1);

    // 7. Stack History Tracking & Dynamic Total Steps
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const [dynamicTotalSteps, setDynamicTotalSteps] = useState<number>(0); // Initialize with 0
    const lastStepRef = useRef<number>(-1);

    // 8. Current log reference for extracting all data
    const currentLogRef = useRef<log_infos | null>(null);

    // 8.5. Previous instruction log (from peek backward) - for LAST_RUN_INSTR
    const [prevLogData, setPrevLogData] = useState<log_infos | null>(null);
    const [nextInstruction, setNextInstruction] = useState<InstructionInfo | null>(null);

    const mapLogToInstruction = useCallback((
        log: log_infos,
        stepIndex: number,
        totalSteps: number
    ): InstructionInfo => {
        const memoryChanges = log.next_instr.memory_update?.map(mu => ({
            offset: Number(mu.offset),
            size: Number(mu.size)
        })) || [];

        const memoryMappings = memoryChanges.map(mc => ({
            range: `[${mc.offset};${mc.offset + mc.size}]`,
            pc: log.next_instr.pc,
            opcode: log.next_instr.op
        }));

        return {
            pc: log.next_instr.pc,
            opcode: log.next_instr.op,
            gas: Number(log.remaining_gas),
            gasCost: Number(log.next_instr.gas_cost),
            stepNumber: stepIndex + 1, // 1-based display
            totalSteps,
            description: `Executed ${log.next_instr.op}`,
            memoryMappings,
            memoryChanges,
            depth: log.depth,
            address: log.address,
            callData: log.call_data?.value ? bufferToHex(log.call_data.value) : "",
            functionSelector: log.selector ? bufferToHex(log.selector) : "",
            lastConditionalJump: log.last_conditional_jump !== undefined ? {
                pc: log.last_conditional_jump,
                opcode: "JUMPI",
                condition: ""
            } : undefined
        };
    }, []);

    // Update all state from current log
    // Warning: 'initialTotalSteps' arg here is the initial trace length
    // iter is optional - if provided, we'll peek the next instruction
    const updateFromLog = useCallback((
        log: log_infos | undefined,
        initialTotalSteps: number,
        stepIndex: number,
        txHash: string,
        logMap?: Map<number, log_infos>,
        iter?: trace_iterator
    ) => {
        if (!log) return;

        currentLogRef.current = log;

        // PEEK BACKWARD: Get the PREVIOUS instruction (what just ran)
        // Because log.next_instr is the instruction ABOUT to run,
        // to show "LAST_RUN_INSTR" we need the previous step's next_instr
        let prevLog: log_infos | null = null;
        if (iter && stepIndex > 0) {
            const hasPrev = iter.prev();
            if (hasPrev) {
                prevLog = iter.current_log() || null;
                iter.next(); // Rewind back to current position
            }
        }

        setPrevLogData(prevLog);

        // Update dynamic total steps if we exceed current known max
        setDynamicTotalSteps(prev => {
            const currentMax = Math.max(prev, initialTotalSteps);
            return Math.max(currentMax, stepIndex + 1);
        });

        // Pass the LATEST known max (calculated locally for this render cycle) to mapLogToState
        // Note: state update setDynamicTotalSteps is async, so we compute local value for immediate usage
        // But mapLogToState needs a value. We can pass Math.max(initialTotalSteps, stepIndex + 1)
        const effectiveTotal = Math.max(initialTotalSteps, stepIndex + 1);

        // Check for depth change
        const depthChanged = log.depth !== lastDepthRef.current;
        lastDepthRef.current = log.depth;

        // Update main debugger state
        setState(mapLogToState(log, effectiveTotal, stepIndex, txHash, logMap));
        setNextInstruction(mapLogToInstruction(log, stepIndex, effectiveTotal));

        // Update Storage (for standalone hook variable)
        const storageUpd = log.next_instr.storage_update;
        setStorage(mapStorage(log.exec_state.storage, logMap, storageUpd));
        setStorageUpdate(storageUpd ? {
            key: storageUpd.key,
            value: storageUpd.value,
            creatingSlot: storageUpd.creating_slot
        } : null);

        // Update Transient Storage
        const transientUpd = log.next_instr.transient_storage_update;
        setTransientStorage(mapTransientStorage(log.exec_state.transient_storage, logMap, transientUpd));
        setTransientStorageUpdate(transientUpd ? {
            key: transientUpd.key,
            value: transientUpd.value,
            creatingSlot: transientUpd.creating_slot
        } : null);

        // Update Call Data
        // Logic: If depth changed, we MUST take new data (or clear if empty).
        // If depth same, we keep old data unless new data is provided.
        if (depthChanged) {
            setCallData(log.call_data?.value ? bufferToHex(log.call_data.value) : "");
        } else if (log.call_data?.value) {
            setCallData(bufferToHex(log.call_data.value));
        }

        // Update Return Data - Accumulate or keep last know return data?
        // Logic: If current step has return data, show it. Otherwise keep previous?
        // Let's try: only update if non-empty, otherwise keep.
        if (log.next_instr.return_data) {
            setReturnData(log.next_instr.return_data);
        }

        // Update Selector
        if (depthChanged) {
            setSelector(log.selector ? bufferToHex(log.selector) : "");
        } else if (log.selector) {
            setSelector(bufferToHex(log.selector));
        }

        // Update Context Info
        setDepth(log.depth);
        setAddress(log.address);
        setGasUsed({
            main: log.gas_used.main_contract.toString(),
            other: log.gas_used.other_contracts.toString()
        });

        // Build full memory mappings (like old Apollo - shows ALL memory regions and who wrote them)
        setFullMemoryMappings(buildFullMemoryMappings(log.exec_state.memory?.log_ids, logMap));

        // Next instruction is derived from current log (next_instr).
    }, [mapLogToInstruction]);

    // 9. Initialization
    const loadTransaction = useCallback(async (hash: string) => {
        if (!hash) return;

        setStatus("Loading");
        setState(null);
        setStackHistory([]);
        setStorage([]);
        setTransientStorage([]);
        setContractCode([]);
        setTransactionDetails(null);
        setNextInstruction(null);
        lastStepRef.current = -1;
        setDynamicTotalSteps(0); // Reset dynamic total steps on new load

        try {
            if (typeof Apollo === 'undefined') {
                // @ts-ignore
                throw new Error("Apollo global not found. Is apollo-engine.js loaded?");
            }


            const config = {
                node_url: "/reth",
                tx_hash: hash
            };

            const info = await Apollo.load_transaction(config);

            setTxInfo(info);
            setIterator(info.trace_iterator);

            // Set contract code
            setContractCode(mapContractCode(info.code));

            // Set transaction details
            setTransactionDetails({
                hash: info.transaction.info.hash,
                // ... (details kept) ...
                to: info.transaction.info.dst,
                gas: info.transaction.info.gas.toString(),
                gasUsed: info.transaction.receipt.gas_used.toString(),
                blockHash: info.transaction.receipt.block_hash,
                transactionIndex: info.transaction.receipt.transaction_index
            });

            // PRE-CALCULATE TOTAL STEPS (Dry Run)
            let calculatedTotal = 0;

            if (info.trace.length < 5000) {
                const tempIter = info.trace_iterator;
                // Count forward
                while (tempIter.next()) {
                    calculatedTotal++;
                }

                // Rewind exactly by the amount we advanced
                for (let i = 0; i < calculatedTotal; i++) {
                    tempIter.prev();
                }
            } else {
                calculatedTotal = info.trace.length;
            }

            // Set initial state from first log
            const initialLog = info.trace_iterator.current_log();

            // Use calculatedTotal as the Single Source of Truth
            // Pass iterator for peek functionality
            updateFromLog(initialLog, calculatedTotal, 0, hash, info.log_map, info.trace_iterator);
            setDynamicTotalSteps(calculatedTotal);
            setCurrentStepIndex(0);

            setStatus("Ready");

        } catch (err: any) {
            console.error("Failed to initialize Apollo:", err);
            setStatus("Error");
        }
    }, [updateFromLog]);


    // 10. Update stack history when step changes (limited to 200 items to prevent memory issues)
    const MAX_STACK_HISTORY = 200;
    useEffect(() => {
        const currentStep = state?.currentStep ?? -1;
        const stackArr = state?.stack || [];
        const latestItem = stackArr[stackArr.length - 1];

        // Ensure we have a valid state step
        if (currentStep === -1 || lastStepRef.current === -1) {
            if (currentStep !== -1) {
                // Initialization or first load
                if (latestItem) setStackHistory([latestItem]);
                else setStackHistory([]);
                lastStepRef.current = currentStep;
            }
            return;
        }

        const diff = currentStep - lastStepRef.current;

        if (diff === 0) return; // No change

        if (Math.abs(diff) > 1) {
            // JUMP DETECTED (Forward or Backward > 1 step)
            // We cannot maintain continuous history. Reset or set to current.
            // Best UX: Show current item as the start of a new history segment.
            if (latestItem) {
                setStackHistory([latestItem]);
            } else {
                setStackHistory([]);
            }
        } else if (diff === 1) {
            // Sequential Next
            if (latestItem) {
                setStackHistory(prev => {
                    const newHistory = [...prev, latestItem];
                    if (newHistory.length > MAX_STACK_HISTORY) {
                        return newHistory.slice(-MAX_STACK_HISTORY);
                    }
                    return newHistory;
                });
            }
        } else if (diff === -1) {
            // Sequential Prev
            setStackHistory(prev => prev.slice(0, -1));
        }

        lastStepRef.current = currentStep;
    }, [state?.currentStep, state?.stack]);

    // 11. Navigation Actions (supports stepping multiple instructions)


    // Helper: Check if we should stop based on Breakpoints
    const shouldStop = useCallback((log: log_infos): boolean => {
        if (!breakpoints || breakpoints.length === 0) return false;

        // Check each breakpoint
        for (const bp of breakpoints) {
            if (!bp.enabled) continue;

            // 1. Storage Breakpoint
            if (bp.type === "Storage") {
                const storageUpd = log.next_instr.storage_update;
                // If this step modifies the specific storage key
                if (storageUpd && storageUpd.key.toLowerCase() === bp.value.toLowerCase()) {
                    return true;
                }
            }

            // 2. Transient Storage Breakpoint
            if (bp.type === "Transient") {
                const transientUpd = log.next_instr.transient_storage_update;
                if (transientUpd && transientUpd.key.toLowerCase() === bp.value.toLowerCase()) {
                    return true;
                }
            }

            // 3. Memory Breakpoint
            if (bp.type === "Memory") {
                const memUpdates = log.next_instr.memory_update;
                if (memUpdates && memUpdates.length > 0) {
                    // Check range [min, max]
                    // Format value usually: "[0;32]" or similar, but let's rely on min/max props if available
                    // Or parse value if strictly formatted.
                    // The UI sends: value: `[${memoryMin};${memoryMax}]`, min: ..., max: ...
                    let start = 0;
                    let end = 32;

                    if (bp.min && bp.max) {
                        start = parseInt(bp.min);
                        end = parseInt(bp.max);
                    }

                    // Check collision with any memory update
                    for (const update of memUpdates) {
                        const upStart = Number(update.offset);
                        const upEnd = upStart + Number(update.size);

                        // Overlap check: NOT (UpdateEnd <= WatchStart OR UpdateStart >= WatchEnd)
                        if (!(upEnd <= start || upStart >= end)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }, [breakpoints]);

    // Helper: Check if current instruction matches filters (for "Next" skipping)
    const matchesFilter = useCallback((log: log_infos): boolean => {
        if (!filters || filters.length === 0) return true; // No filters = all match

        const op = log.next_instr.op.toUpperCase();
        const pc = "0x" + log.next_instr.pc.toString(16).toUpperCase(); // Canonical hex PC
        const pcShort = log.next_instr.pc.toString(); // Decimal PC string if user types that? Assuming hex.

        // Check if filter list includes OP or PC
        // Filters usually: ["SSTORE", "0x14"]
        return filters.some(f =>
            f.toUpperCase() === op ||
            f.toLowerCase() === pc.toLowerCase()
        );
    }, [filters]);


    const stepForward = useCallback((count = 1) => {
        if (!iterator || !txInfo) return;
        const steps = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
        let moved = 0;
        let log: log_infos | null = null;
        let hitBreakpoint = false;

        // MODE 1: Normal Step (or Filter Skipping)
        // If we have filters, "Step 1" means "Find NEXT match"
        const isFiltering = filters.length > 0;
        const maxSearchSteps = isFiltering ? 5000 : steps; // Safety limit for filters

        // We loop until we moved 'steps' VALID times (usually 1)
        // In filter mode, 1 valid step means finding 1 matching instruction
        let validStepsFound = 0;

        // Safety break for huge traces
        let totalScanned = 0;
        // Increase limit to 10M for large traces
        const SCAN_LIMIT = 10_000_000;

        // SKIP CONTRACT STATE
        // If we are "skipping contract", we need to track the depth where we started skipping.
        // We only stop skipping when we return to this depth (or valid lower depth).
        // Actually, simplest logic: If skipContract is ON, we simply treat "depth > currentDepth" as "skip".
        // But we need to know what "currentDepth" was BEFORE we started stepping?
        // No, "Skip Contract" usually means "Don't show instructions deeper than CURRENT depth".
        // So if we are at depth 0, and next instr is depth 1, we skip until depth 0 again.
        const startingDepth = currentLogRef.current?.depth ?? 0;

        while (validStepsFound < steps && totalScanned < SCAN_LIMIT) {
            if (!iterator.next()) break; // End of trace

            log = iterator.current_log();
            if (!log) break;

            totalScanned++;

            // 0. SKIP CONTRACT CHECK
            // If skipContract is ON, and we went DEEPER than starting depth, this step is "invalid" (skipped)
            // UNLESS it matches a filter? Usually "Skip Contract" overrides filters inside that contract.
            if (skipContract && log.depth > startingDepth) {
                // We are inside a sub-call. Skip this instruction entirely.
                // We do NOT increment `validStepsFound`.
                // We do increment `totalScanned` (consumed work).
                continue;
            }
            moved++; // We physically moved the iterator (and it counts as a move we might want to render if not skipping)
            // Wait, "moved" logic in my previous code was for index calculation.
            // If we "continue" above, we effectively skipped it, so we shouldn't count it as a "step" for the UI?
            // Actually, `moved` variable here tracks how many raw iterator steps we took,
            // so we can update `currentStepIndex`. We MUST increment `moved` for EVERY iterator.next().
            // BUT `validStepsFound` is what controls the loop exit.

            // So:
            // if (skipContract && log.depth > startingDepth) { continue; } -> moved++ happens implicity?
            // No, I need to restructure the loop slightly to ensure `moved` tracks iterator.next().


            // 1. Check Breakpoints (Always interrupt!)
            if (shouldStop(log)) {
                hitBreakpoint = true;
                // We stopped AT the instruction that triggers the breakpoint.
                validStepsFound++;
                break;
            }

            // 2. Check Filter
            if (isFiltering) {
                if (matchesFilter(log)) {
                    validStepsFound++;
                }
            } else {
                validStepsFound++;
            }
        }


        if (moved > 0 && log) {
            const newIndex = currentStepIndex + moved;
            setCurrentStepIndex(newIndex);
            // Use dynamicTotalSteps to preserve the pre-calculated count
            updateFromLog(log, dynamicTotalSteps || txInfo.trace.length, newIndex, txInfo.transaction.info.hash, txInfo.log_map, iterator);

            if (hitBreakpoint) {
                // Stop auto-play if active
                setIsPlaying(false);
            }
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog, dynamicTotalSteps, filters, matchesFilter, shouldStop, skipContract]);



    const stepBackward = useCallback((count = 1) => {
        if (!iterator || !txInfo) return;
        const steps = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
        let moved = 0;
        let log: log_infos | null = null;
        let hitBreakpoint = false; // Breakpoints in reverse? Maybe, but usually filters are the main concern for navigation.

        // MODE 1: Normal Step Back (or Filter Skipping Back)
        const isFiltering = filters.length > 0;

        let validStepsFound = 0;
        let totalScanned = 0;
        const SCAN_LIMIT = 10_000_000;
        const startingDepth = currentLogRef.current?.depth ?? 0;

        while (validStepsFound < steps && totalScanned < SCAN_LIMIT) {
            if (!iterator.prev()) break; // End of trace (start)

            log = iterator.current_log();
            if (!log) break;

            totalScanned++;
            moved++;

            // 0. SKIP CONTRACT CHECK (Reverse)
            // If we are skipping, we ignore anything deeper than startingDepth.
            // Note: In reverse, "startingDepth" is the depth we *were* at.
            // If we were at depth 0, and we step back into depth 1 (returning from a call?),
            // we should skip it.
            // Wait, if I am at depth 0, `prev` could be the `RETURN` of a sub-call (depth 1).
            // So yes, `log.depth > startingDepth` means we are stepping BACK into a sub-call.
            if (skipContract && log.depth > startingDepth) {
                continue;
            }

            // 1. Check Breakpoints

            if (shouldStop(log)) {
                hitBreakpoint = true;
                validStepsFound++;
                break;
            }

            // 2. Check Filter
            if (isFiltering) {
                if (matchesFilter(log)) {
                    validStepsFound++;
                }
            } else {
                validStepsFound++;
            }
        }

        if (moved > 0 && log) {
            const newIndex = currentStepIndex - moved;
            setCurrentStepIndex(newIndex);
            // Pass iterator for peek functionality
            updateFromLog(log, dynamicTotalSteps || txInfo.trace.length, newIndex, txInfo.transaction.info.hash, txInfo.log_map, iterator);

            if (hitBreakpoint) {
                setIsPlaying(false);
            }
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog, dynamicTotalSteps, filters, matchesFilter, shouldStop]);

    const next = useCallback((count = 1) => {
        stepForward(count);
    }, [stepForward]);

    const prev = useCallback((count = 1) => {
        stepBackward(count);
    }, [stepBackward]);

    const setBreakpointWrapper = useCallback((bp: Breakpoint) => {
        setBreakpoints(prev => {
            // Avoid duplicates by ID
            if (prev.find(p => p.id === bp.id)) return prev;
            return [...prev, bp];
        });
    }, []);

    const removeBreakpoint = useCallback((id: string) => {
        setBreakpoints(prev => prev.filter(bp => bp.id !== id));
    }, []);


    // 12. Computed Data
    const visibleStack: VisibleStackWindow = useMemo(() => {
        const len = stackHistory.length;
        return {
            current: len > 0 ? { ...stackHistory[len - 1], status: 'produced' as const } : null,
            previous: len > 1 ? { ...stackHistory[len - 2], status: 'consumed' as const } : null
        };
    }, [stackHistory]);

    // 13. Auto-Play Logic
    const [isPlaying, setIsPlaying] = useState<false | 'forward' | 'backward'>(false);
    const [speed, setSpeed] = useState(40);
    const [stepSize, setStepSize] = useState(1);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            const delay = Math.max(50, 1000 - (speed * 9));
            interval = setInterval(() => {
                if (isPlaying === 'forward') stepForward(stepSize);
                else if (isPlaying === 'backward') stepBackward(stepSize);
            }, delay);
        }
        return () => clearInterval(interval);
    }, [isPlaying, speed, stepSize, stepForward, stepBackward]);

    const togglePlay = (direction: 'forward' | 'backward' = 'forward') => {
        setIsPlaying(current => (current === direction ? false : direction));
    };

    // 14. Get current log raw data (for advanced use)
    const getCurrentLog = useCallback(() => {
        return currentLogRef.current;
    }, []);

    // 14.5. Track if we're in an external contract (don't clear code, just track it)
    const isExternalContract = useMemo(() => {
        if (!address || !txInfo?.transaction.info.dst) return false;
        return address.toLowerCase() !== txInfo.transaction.info.dst.toLowerCase();
    }, [address, txInfo?.transaction.info.dst]);

    // Restore main contract code when returning from external call
    useEffect(() => {
        if (!txInfo) return;

        // If we're back in main contract and code was somehow lost, restore it
        if (!isExternalContract && contractCode.length === 0 && txInfo.code) {
            setContractCode(mapContractCode(txInfo.code));
        }
    }, [isExternalContract, txInfo]);

    // 15. Derive LAST INSTRUCTION (what just executed) from prevLogData
    const derivedLastInstruction = useMemo((): InstructionInfo | null => {
        // At step 0, there's no previous instruction
        if (!prevLogData || currentStepIndex === 0) return null;

        const lastInstr = prevLogData.next_instr;
        const lastMemoryChanges = lastInstr.memory_update?.map(mu => ({
            offset: Number(mu.offset),
            size: Number(mu.size)
        })) || [];
        const lastMemoryMappings = lastMemoryChanges.map(mc => ({
            range: `[${mc.offset};${mc.offset + mc.size}]`,
            pc: lastInstr.pc,
            opcode: lastInstr.op
        }));

        return {
            pc: lastInstr.pc,
            opcode: lastInstr.op,
            gas: Number(prevLogData.remaining_gas),
            gasCost: Number(lastInstr.gas_cost),
            stepNumber: currentStepIndex, // The step that just ran
            totalSteps: dynamicTotalSteps || state?.totalSteps || 0,
            description: `Executed ${lastInstr.op}`,
            depth: prevLogData.depth,
            address: prevLogData.address,
            callData: prevLogData.call_data?.value ? bufferToHex(prevLogData.call_data.value) : "",
            functionSelector: prevLogData.selector ? bufferToHex(prevLogData.selector) : "",
            memoryMappings: lastMemoryMappings,
            memoryChanges: lastMemoryChanges,
            lastConditionalJump: prevLogData.last_conditional_jump ? {
                pc: prevLogData.last_conditional_jump,
                opcode: "JUMPI",
                condition: ""
            } : undefined
        };
    }, [prevLogData, currentStepIndex, dynamicTotalSteps, state?.totalSteps]);

    const derivedNextInstruction = nextInstruction;

    return {
        // Load
        loadTransaction,
        status,

        // Main State
        rawState: state,
        currentStep: currentStepIndex,
        currentOpcode: state?.currentInstruction?.opcode,

        // Stack
        stack: state?.stack || [],
        visibleStack,
        stackHistoryLength: stackHistory.length,
        stackHistory,

        // Memory
        memory: state?.memory || [],
        fullMemoryMappings,

        // NEW: Storage
        storage,
        storageUpdate,

        // NEW: Transient Storage
        transientStorage,
        transientStorageUpdate,

        // NEW: Contract Code
        contractCode,

        // NEW: Transaction Details
        transactionDetails,

        // NEW: Call/Return Data
        callData,
        returnData,
        selector,

        // NEW: Context Info
        depth,
        address,
        gasUsed,
        isExternalContract,

        // Instructions (LAST = what ran, NEXT = what's about to run)
        lastInstruction: derivedLastInstruction,
        nextInstruction: derivedNextInstruction,

        // Navigation
        next,
        prev,
        setBreakpoint: setBreakpointWrapper, // Use the new wrapper
        removeBreakpoint,
        filters,
        setFilters,
        breakpoints,

        // Skip Contract
        skipContract,
        setSkipContract,




        // Auto-play

        isPlaying,
        togglePlay,
        speed,
        setSpeed,
        stepSize,
        setStepSize,

        // Advanced
        getCurrentLog
    };
};
