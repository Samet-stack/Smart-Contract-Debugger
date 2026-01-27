import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DebuggerState, Breakpoint, InstructionInfo, MemorySegment } from '../types/ApolloAPI';
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

const CONFIG = {
    node_url: "https://app.functori.com/reth",
    tx_hash: "0xcae715cc39730aeaada34f4a405e92cb21a9d1820e7d48bee58d681fd515bae0"
};

// Helper: Map Engine Stack to UI StackItem
const mapStack = (engineStack: EngineStack, logMap?: Map<number, log_infos>): StackItem[] => {
    if (!engineStack || !Array.isArray(engineStack)) return [];

    return engineStack.map((item, index) => {
        let modifiedAt = { pc: 0, opcode: 'GENESIS' };
        if (logMap && item.log_id !== undefined) {
            const log = logMap instanceof Map ? logMap.get(item.log_id) : undefined;
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
const mapStorage = (engineStorage: EngineStorage | undefined, logMap: Map<number, log_infos> | undefined, storageUpdate?: { key: string; value: string; creating_slot: boolean }): StorageItem[] => {
    if (!engineStorage) return [];

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
        if (logMap && data.log_id !== undefined) {
            const log = logMap instanceof Map ? logMap.get(data.log_id) : undefined;
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
    logMap: Map<number, log_infos> | undefined,
    transientUpdate?: { key: string; value: string; creating_slot: boolean }
): TransientStorageItem[] => {
    if (!engineTransient) return [];

    const items: TransientStorageItem[] = [];

    // Handle both Map and plain object
    const entries: [string, { value: string; log_id: number }][] =
        engineTransient instanceof Map
            ? Array.from(engineTransient.entries())
            : Object.entries(engineTransient);

    for (const [key, data] of entries) {
        const isModified = transientUpdate?.key === key;

        let modifiedAt = undefined;
        if (logMap && data.log_id !== undefined) {
            const log = logMap instanceof Map ? logMap.get(data.log_id) : undefined;
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

    const currentInstr: InstructionInfo = {
        pc: log.next_instr.pc,
        opcode: log.next_instr.op,
        gas: Number(log.remaining_gas),
        gasCost: Number(log.next_instr.gas_cost),
        stepNumber: currentStep + 1, // 1-based index for display
        totalSteps: effectiveTotalSteps,
        description: `Executed ${log.next_instr.op}`,
        memoryMappings: [],
        memoryChanges: log.next_instr.memory_update?.map(mu => ({
            offset: Number(mu.offset),
            size: Number(mu.size)
        })) || []
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
            let modifiedAt = undefined;
            if (memoryLogIds && logMap) {
                let logId: number | undefined;

                // Handle Map vs Object for memoryLogIds
                if (memoryLogIds instanceof Map) {
                    logId = memoryLogIds.get(i.toString());
                } else {
                    // @ts-ignore - Handle raw object access
                    logId = memoryLogIds[i.toString()];
                }

                if (logId !== undefined) {
                    const srcLog = logMap instanceof Map ? logMap.get(logId) : undefined;
                    if (srcLog) {
                        modifiedAt = { pc: srcLog.next_instr.pc, opcode: srcLog.next_instr.op };
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

    // Refs for persistence tracking
    const lastDepthRef = useRef<number>(-1);

    // 7. Stack History Tracking & Dynamic Total Steps
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const [dynamicTotalSteps, setDynamicTotalSteps] = useState<number>(0); // Initialize with 0
    const lastStepRef = useRef<number>(-1);

    // 8. Current log reference for extracting all data
    const currentLogRef = useRef<log_infos | null>(null);

    // Update all state from current log
    // Warning: 'initialTotalSteps' arg here is the initial trace length
    const updateFromLog = useCallback((log: log_infos | undefined, initialTotalSteps: number, stepIndex: number, txHash: string, logMap?: Map<number, log_infos>) => {
        if (!log) return;

        currentLogRef.current = log;

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

        // Debug logging - remove in production
        if (stepIndex % 20 === 0) {
            console.log(`[Apollo Debug] Step ${stepIndex}:`, {
                opcode: log.next_instr.op,
                hasMemory: !!log.exec_state.memory?.value,
                memorySize: log.exec_state.memory?.value ? new Uint8Array(log.exec_state.memory.value).length : 0,
                hasStorage: !!log.exec_state.storage,
                storageType: log.exec_state.storage ? (log.exec_state.storage instanceof Map ? 'Map' : typeof log.exec_state.storage) : 'none',
                storageSize: log.exec_state.storage instanceof Map ? log.exec_state.storage.size : (log.exec_state.storage ? Object.keys(log.exec_state.storage).length : 0),
                hasTransient: !!log.exec_state.transient_storage,
            });
        }

        // Update main debugger state
        setState(mapLogToState(log, effectiveTotal, stepIndex, txHash, logMap));

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

        // Try to determine Next Instruction (Naive approach using PC + Code)
        // Since we don't have peek(), we look at the contract code.
        // Find current instruction in code by PC
        const currentPc = log.next_instr.pc;
        // Access code from state or valid source needed here. 
        // We can't access 'contractCode' state easily inside callback without deps.
        // We'll pass contractCode to this function or use a ref.
        // For now, let's leave nextInstruction null in state, but we can compute it in the view or here if we had code.



    }, []);

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
        lastStepRef.current = -1;
        setDynamicTotalSteps(0); // Reset dynamic total steps on new load

        try {
            if (typeof Apollo === 'undefined') {
                throw new Error("Apollo global not found. Is apollo-engine.js loaded?");
            }

            const config = {
                node_url: "/reth",
                tx_hash: hash
            };

            console.log("Loading transaction...", config);
            const info = await Apollo.load_transaction(config);
            console.log("Transaction loaded:", info);

            // Debug Log Map structure safely
            if (info.log_map) {
                const keys = info.log_map instanceof Map
                    ? Array.from(info.log_map.keys())
                    : Object.keys(info.log_map);

                console.log("Log Map Keys Preview:", keys.slice(0, 20));
                console.log("Log Map Size:", keys.length);

                // Inspect one entry to see what it contains
                if (keys.length > 0) {
                    // @ts-ignore
                    const firstLog = info.log_map instanceof Map ? info.log_map.get(keys[0]) : info.log_map[keys[0]];
                    console.log("First Log Entry:", firstLog);
                }
            }

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
            console.log("Starting Dry Run to count total steps...");
            let calculatedTotal = 0;

            // For debugging, log the condition check
            console.log(`Trace length hint: ${info.trace.length}`);

            if (info.trace.length < 5000) {
                const tempIter = info.trace_iterator;
                // Count forward
                while (tempIter.next()) {
                    calculatedTotal++;
                }
                console.log(`Dry Run counted: ${calculatedTotal} steps.`);

                // Rewind exactly by the amount we advanced
                console.log("Rewinding...");
                for (let i = 0; i < calculatedTotal; i++) {
                    tempIter.prev();
                }
                console.log("Rewind complete.");
            } else {
                console.warn("Skipping Dry Run (trace too large)");
                calculatedTotal = info.trace.length;
            }

            // Set initial state from first log
            const initialLog = info.trace_iterator.current_log();

            console.log(`Initializing with TotalSteps: ${calculatedTotal}`);

            // Use calculatedTotal as the Single Source of Truth
            updateFromLog(initialLog, calculatedTotal, 0, hash, info.log_map);
            setDynamicTotalSteps(calculatedTotal);
            setCurrentStepIndex(0);

            setStatus("Ready");

        } catch (err: any) {
            console.error("Failed to initialize Apollo:", err);
            setStatus("Error");
        }
    }, [updateFromLog]);

    // Initial check for global presence
    useEffect(() => {
        if (typeof Apollo === 'undefined') {
            console.warn("Apollo global is missing on mount");
        }
    }, []);

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

    // 11. Navigation Actions
    const next = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasNext = iterator.next();
        console.log(`[Navigation] Next: ${hasNext}, CurrentStep: ${currentStepIndex}`);
        if (hasNext) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex + 1;
            setCurrentStepIndex(newIndex);
            // Use dynamicTotalSteps to preserve the pre-calculated count
            // Fallback to trace.length if dynamic is 0 (should not happen if loaded)
            updateFromLog(log, dynamicTotalSteps || txInfo.trace.length, newIndex, txInfo.transaction.info.hash, txInfo.log_map);
        } else {
            console.warn("Iterator returned false for next()");
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog, dynamicTotalSteps]);

    const prev = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasPrev = iterator.prev();
        if (hasPrev) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex - 1;
            setCurrentStepIndex(newIndex);
            updateFromLog(log, dynamicTotalSteps || txInfo.trace.length, newIndex, txInfo.transaction.info.hash, txInfo.log_map);
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog, dynamicTotalSteps]);

    const setBreakpoint = useCallback((bp: Breakpoint) => {
        console.warn("Breakpoints not yet implemented for Real Engine");
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

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            const delay = Math.max(50, 1000 - (speed * 9));
            interval = setInterval(() => {
                if (isPlaying === 'forward') next();
                else if (isPlaying === 'backward') prev();
            }, delay);
        }
        return () => clearInterval(interval);
    }, [isPlaying, speed, next, prev]);

    const togglePlay = (direction: 'forward' | 'backward' = 'forward') => {
        setIsPlaying(current => (current === direction ? false : direction));
    };

    // 14. Get current log raw data (for advanced use)
    const getCurrentLog = useCallback(() => {
        return currentLogRef.current;
    }, []);

    // 14.5. Dynamic Contract Code Switching
    useEffect(() => {
        if (!state?.currentInstruction || !txInfo) return;

        // If we are executing in a different address than the main contract,
        // and we don't have code for it (currently we only load main contract code),
        // we should clear the code view to avoid misleading highlighting.
        if (address && txInfo.transaction.info.dst) {
            const isMainContract = address.toLowerCase() === txInfo.transaction.info.dst.toLowerCase();

            if (isMainContract) {
                // Restore main contract code if not already set or if it was cleared
                if (contractCode.length === 0 && txInfo.code) {
                    setContractCode(mapContractCode(txInfo.code));
                }
            } else {
                // External contract: Clear code if it's currently showing main contract code
                if (contractCode.length > 0) {
                    setContractCode([]);
                }
            }
        }
    }, [address, txInfo]);

    // 15. Derive Next Instruction from Code
    const derivedNextInstruction = useMemo(() => {
        if (!state?.currentInstruction) return null;

        // Fallback for when code is not available (External Contract)
        const fallbackNext: InstructionInfo = {
            pc: 0,
            opcode: "UNKNOWN",
            gas: state.currentInstruction.gas,
            gasCost: 0,
            stepNumber: (state.currentStep || 0) + 1,
            totalSteps: state.totalSteps,
            description: "Next instruction not available (external source)",
            // Pass through context data that remains valid
            depth: state.currentInstruction.depth,
            callData: callData,
            functionSelector: selector,
            memoryMappings: [],
            memoryChanges: []
        };

        if (contractCode.length === 0) {
            return fallbackNext;
        }

        const currentPc = state.currentInstruction.pc;
        // Find index of current opcode
        const currentIndex = contractCode.findIndex(op => op.pc === currentPc);

        // If found and not last, return next
        if (currentIndex !== -1 && currentIndex < contractCode.length - 1) {
            const nextOp = contractCode[currentIndex + 1];
            return {
                pc: nextOp.pc,
                opcode: nextOp.op,
                // Correctly populate step metadata
                gas: state.currentInstruction.gas,
                gasCost: 0,
                stepNumber: (state.currentStep || 0) + 1,
                totalSteps: state.totalSteps,
                description: "Next instruction",
                depth: state.currentInstruction.depth,
                callData: callData,
                functionSelector: selector,
                memoryMappings: [], memoryChanges: []
            } as InstructionInfo;
        }

        return fallbackNext;
    }, [state?.currentInstruction?.pc, state?.currentStep, state?.totalSteps, contractCode]);

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

        // Next Instruction
        nextInstruction: derivedNextInstruction,

        // Navigation
        next,
        prev,
        setBreakpoint,

        // Auto-play
        isPlaying,
        togglePlay,
        speed,
        setSpeed,

        // Advanced
        getCurrentLog
    };
};
