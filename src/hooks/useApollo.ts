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
    return engineStack.map((item, index) => {
        let modifiedAt = { pc: 0, opcode: 'GENESIS' };
        if (logMap && item.log_id !== undefined) {
            const log = logMap.get(item.log_id);
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

    engineStorage.forEach((data, key) => {
        const isModified = storageUpdate?.key === key;

        // Look up log_id to find who modified this slot
        let modifiedAt = undefined;
        if (logMap && data.log_id !== undefined) {
            const log = logMap.get(data.log_id);
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
    });

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

    engineTransient.forEach((data, key) => {
        const isModified = transientUpdate?.key === key;

        let modifiedAt = undefined;
        if (logMap && data.log_id !== undefined) {
            const log = logMap.get(data.log_id);
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
    });

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

    const currentInstr: InstructionInfo = {
        pc: log.next_instr.pc,
        opcode: log.next_instr.op,
        gas: Number(log.remaining_gas),
        gasCost: Number(log.next_instr.gas_cost),
        stepNumber: currentStep,
        totalSteps: totalSteps,
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
                const logId = memoryLogIds.get(i.toString()); // Try offset as key
                if (logId !== undefined) {
                    const srcLog = logMap.get(logId);
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

    // 7. Stack History Tracking
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const lastStepRef = useRef<number>(-1);

    // 8. Current log reference for extracting all data
    const currentLogRef = useRef<log_infos | null>(null);

    // Update all state from current log
    const updateFromLog = useCallback((log: log_infos | undefined, totalSteps: number, stepIndex: number, txHash: string) => {
        if (!log) return;

        currentLogRef.current = log;

        // Update main debugger state
        setState(mapLogToState(log, totalSteps, stepIndex, txHash, txInfo?.log_map));

        // Update Storage (for standalone hook variable)
        const storageUpd = log.next_instr.storage_update;
        setStorage(mapStorage(log.exec_state.storage, txInfo?.log_map, storageUpd));
        setStorageUpdate(storageUpd ? {
            key: storageUpd.key,
            value: storageUpd.value,
            creatingSlot: storageUpd.creating_slot
        } : null);

        // Update Transient Storage
        const transientUpd = log.next_instr.transient_storage_update;
        setTransientStorage(mapTransientStorage(log.exec_state.transient_storage, txInfo?.log_map, transientUpd));
        setTransientStorageUpdate(transientUpd ? {
            key: transientUpd.key,
            value: transientUpd.value,
            creatingSlot: transientUpd.creating_slot
        } : null);

        // Update Call Data
        if (log.call_data?.value) {
            setCallData(bufferToHex(log.call_data.value));
        }

        // Update Return Data
        setReturnData(log.next_instr.return_data || "");

        // Update Selector
        if (log.selector) {
            setSelector(bufferToHex(log.selector));
        }

        // Update Context Info
        setDepth(log.depth);
        setAddress(log.address);
        setGasUsed({
            main: log.gas_used.main_contract.toString(),
            other: log.gas_used.other_contracts.toString()
        });

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

            setTxInfo(info);
            setIterator(info.trace_iterator);

            // Set contract code
            setContractCode(mapContractCode(info.code));

            // Set transaction details
            setTransactionDetails({
                hash: info.transaction.info.hash,
                to: info.transaction.info.dst,
                gas: info.transaction.info.gas.toString(),
                gasUsed: info.transaction.receipt.gas_used.toString(),
                blockHash: info.transaction.receipt.block_hash,
                transactionIndex: info.transaction.receipt.transaction_index
            });

            // Set initial state from first log
            const initialLog = info.trace_iterator.current_log();
            updateFromLog(initialLog, info.trace.length, 0, hash);
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

    // 10. Update stack history when step changes
    useEffect(() => {
        const currentStep = state?.currentStep ?? -1;
        const stackArr = state?.stack || [];
        const latestItem = stackArr[stackArr.length - 1];

        if (currentStep !== lastStepRef.current && latestItem) {
            if (currentStep > lastStepRef.current) {
                setStackHistory(prev => [...prev, latestItem]);
            } else if (currentStep < lastStepRef.current) {
                setStackHistory(prev => prev.slice(0, -1));
            }
            lastStepRef.current = currentStep;
        }
    }, [state?.currentStep, state?.stack]);

    // 11. Navigation Actions
    const next = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasNext = iterator.next();
        if (hasNext) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex + 1;
            setCurrentStepIndex(newIndex);
            updateFromLog(log, txInfo.trace.length, newIndex, txInfo.transaction.info.hash);
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog]);

    const prev = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasPrev = iterator.prev();
        if (hasPrev) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex - 1;
            setCurrentStepIndex(newIndex);
            updateFromLog(log, txInfo.trace.length, newIndex, txInfo.transaction.info.hash);
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog]);

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
        nextInstruction: state?.nextInstruction || null,

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
