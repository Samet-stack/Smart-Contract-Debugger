import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DebuggerState, Breakpoint, InstructionInfo } from '../types/ApolloAPI';
import type { StackItem } from '../types/StackItem';
import type { StorageItem, TransientStorageItem, StorageUpdate, TransientStorageUpdate } from '../types/Storage';
import type { transaction_info, trace_iterator, log_infos } from '../types/ApolloEngine';
import type { ContractOpcode, FullMemoryMapping } from './apolloMappers';
import {
    mapStorage,
    mapTransientStorage,
    mapContractCode,
    bufferToHex,
    buildFullMemoryMappings,
    mapLogToState,
    extractConsumedItems,
    extractProducedItems
} from './apolloMappers';

export type { ContractOpcode } from './apolloMappers';

export type ApolloStatus = "Ready" | "Loading" | "Error";

// Type for the visible stack window
export interface VisibleStackWindow {
    produced: StackItem[];  // Green - values produced by last instruction
    consumed: StackItem[];  // Red - values consumed by last instruction
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

/**
 * Core Debugger Hook.
 * Manages interaction with the Apollo Engine (WASM), transaction loading,
 * trace navigation, and state mapping.
 */
export const useApollo = () => {
    // ---------------------------------------------------------------------------
    // 1. Core Engine State
    // ---------------------------------------------------------------------------
    // Status of the debugger: "Ready", "Loading", or "Error"
    const [status, setStatus] = useState<ApolloStatus>("Ready");
    // Raw transaction info loaded from the engine
    const [txInfo, setTxInfo] = useState<transaction_info | null>(null);
    // Iterator to traverse the trace (Rust/Wasm binding)
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
    const [fullMemoryMappings, setFullMemoryMappings] = useState<FullMemoryMapping[]>([]);

    // 6.6 Filters & Breakpoints
    const [filters, setFilters] = useState<string[]>([]);
    const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
    const [skipContract, setSkipContract] = useState(false);

    // 6.7. Execution tracking for ContractViewer
    // Ref for O(1) in-place mutation, version counter to trigger useMemo consumers
    const executionPathRef = useRef<number[]>([]);
    const [executionPathVersion, setExecutionPathVersion] = useState(0);



    // Refs for persistence tracking
    const lastDepthRef = useRef<number>(-1);

    // 7. Stack History Tracking & Dynamic Total Steps
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const [dynamicTotalSteps, setDynamicTotalSteps] = useState<number>(0); // Initialize with 0
    const lastStepRef = useRef<number>(-1);

    // Track how many values were produced at each step (for proper backward navigation)
    const producedCountRef = useRef<number[]>([]);

    // 8. Current log reference for extracting all data
    const currentLogRef = useRef<log_infos | null>(null);
    const isProcessingRef = useRef(false);

    // 8.5. Previous instruction log - for LAST_RUN_INSTR and stack visualization
    const [prevLogData, setPrevLogData] = useState<log_infos | null>(null);
    const [nextInstruction, setNextInstruction] = useState<InstructionInfo | null>(null);

    /** Maps a log entry to `InstructionInfo` for the "Next Instruction" view. */
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
            number: stepIndex + 1, // 1-based display
            total: totalSteps,

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

    /**
     * Updates all React state from a log entry.
     * Handles Context changes (Depth/Address), Storage updates, and History.
     */
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

        // Always peek via iterator for the true previous log.
        // This is correct for both forward AND backward navigation.
        let prevLog: log_infos | null = null;
        if (stepIndex > 0 && iter) {
            const hasPrev = iter.prev();
            if (hasPrev) {
                prevLog = iter.current_log() || null;
                iter.next(); // Restore iterator to current position
            }
        }

        setPrevLogData(prevLog);

        // 10. Robust Stack History Management
        // We handle 3 cases: Sequential Next, Backward (Jump/Step), and Forward Jump
        const MAX_STACK_HISTORY = 200;

        // Handling Jumps/Backward:
        if (stepIndex < lastStepRef.current) {
            // BACKWARD: Filter out any items that belong to future steps
            // This is O(N) but N is small (200 items). 
            // We use the 'stepNumber' property we attach to items.
            setStackHistory(prev => prev.filter(item => (item as any).stepNumber <= stepIndex));
        } else if (stepIndex > lastStepRef.current + 1) {
            // FORWARD JUMP (skipped steps): We cannot reconstruct history without replaying.
            // Safer to reset or keep existing? 
            // If we keep existing, we have a gap. 
            // Let's keep existing (items 1..N) and just add the NEW one (N+10).
            // This marks a "gap" but preserves old data.
            // Or better: users usually expect "Clean" state on jump.
            // Let's strictly follow the "Value produced at step X" logic.
            // If we skip, we just don't add the intermediate ones.
        }

        // SEQUENTIAL ADDITION (Applies to both Next and Jump-Arrival):
        // We always add the items produced by the *transition* that just happened (N-1 -> N).
        // prevLog represents the state at N-1.
        // prevLog.next_instr was executed to get us to N.
        if (prevLog && stepIndex > 0) {
            const lastInstr = prevLog.next_instr;
            const produced = extractProducedItems(lastInstr.stack_output, lastInstr.pc, lastInstr.op);

            if (produced.length > 0) {
                const producedWithStep = produced.map(item => ({
                    ...item,
                    stepNumber: stepIndex // Tag with current step index
                }));

                setStackHistory(prev => {
                    // Avoid duplicates if we are just refreshing the same step
                    if (stepIndex === lastStepRef.current) return prev;

                    // Append new items
                    const newHistory = [...prev, ...producedWithStep];
                    if (newHistory.length > MAX_STACK_HISTORY) {
                        return newHistory.slice(-MAX_STACK_HISTORY);
                    }
                    return newHistory;
                });
            }
        } else if (stepIndex === 0) {
            // Reset on step 0
            setStackHistory([]);
        }

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

        // Track execution path — O(1) in-place mutation via ref
        const currentPc = log.next_instr.pc;
        const path = executionPathRef.current;
        if (stepIndex >= path.length) {
            path.push(currentPc);
        } else {
            path.length = stepIndex;
            path.push(currentPc);
        }
        setExecutionPathVersion(v => v + 1);

        // Next instruction is derived from current log (next_instr).
    }, [mapLogToInstruction]);

    // ---------------------------------------------------------------------------
    // 9. Initialization
    // ---------------------------------------------------------------------------
    /**
     * Loads a transaction by its hash using the global Apollo engine.
     * Resets all state and prepares the trace iterator.
     *
     * @param hash - The transaction hash (0x...)
     */
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
        setFilters([]);
        setBreakpoints([]);
        lastStepRef.current = -1;
        setDynamicTotalSteps(0); // Reset dynamic total steps on new load
        executionPathRef.current = [];
        setExecutionPathVersion(0);
        producedCountRef.current = [];

        try {
            if (typeof Apollo === 'undefined') {
                throw new Error("Apollo global not found. Is apollo-engine.js loaded?");
            }



            const config = {
                node_url: "https://app.functori.com/reth",
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

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error("Failed to initialize Apollo:", err);
            setState(prev => prev ? {
                ...prev,
                isLoading: false,
                error: message
            } : {
                currentStep: 0,
                totalSteps: 0,
                pcCoverage: 0,
                currentInstruction: null,
                nextInstruction: null,
                stack: [],
                memory: [],
                storage: [],
                transientStorage: [],
                isLoading: false,
                error: message,
                traceId: null
            });
            setStatus("Error");
        }
    }, [updateFromLog]);


    // 10. Update stack history for BACKWARD navigation only
    // Forward navigation is handled in updateFromLog to avoid double incrementation
    const MAX_STACK_HISTORY = 200;
    useEffect(() => {
        const currentStep = state?.currentStep ?? -1;

        // Ensure we have a valid state step
        if (currentStep === -1 || lastStepRef.current === -1) {
            lastStepRef.current = currentStep;
            return;
        }

        const diff = currentStep - lastStepRef.current;

        if (diff >= 0) {
            // Forward: handled in updateFromLog, just update ref
            lastStepRef.current = currentStep;
            return;
        }

        // BACKWARD navigation: remove produced values
        if (Math.abs(diff) > 1) {
            // BACKWARD JUMP: truncate history to match current step
            // Calculate total values to remove based on produced counts
            let valuesToRemove = 0;
            for (let i = 0; i < Math.abs(diff); i++) {
                const stepIdx = lastStepRef.current - i - 1; // -1 because stored at stepIndex - 1
                valuesToRemove += producedCountRef.current[stepIdx] || 0;
            }
            setStackHistory(prev => prev.slice(0, Math.max(0, prev.length - valuesToRemove)));
        } else if (diff === -1) {
            // Sequential Prev: remove the values produced by the instruction we're leaving
            const countToRemove = producedCountRef.current[lastStepRef.current - 1] || 0; // -1 because stored at stepIndex - 1
            setStackHistory(prev => prev.slice(0, Math.max(0, prev.length - countToRemove)));
        }

        lastStepRef.current = currentStep;
    }, [state?.currentStep]);

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

        // Check if filter list includes OP or PC
        // Filters usually: ["SSTORE", "0x14"]
        return filters.some(f =>
            f.toUpperCase() === op ||
            f.toLowerCase() === pc.toLowerCase()
        );
    }, [filters]);


    /**
     * Advanced stepping function that handles both forward and backward navigation.
     * It includes logic for:
     * - Skipping multiple steps (count)
     * - Checking Breakpoints (Storage, Transient, Memory, etc.)
     * - Applying Filters (Opcode whitelist)
     * - Skipping internal contract calls (skipContract)
     *
     * @param direction - 'forward' or 'backward'
     * @param count - Number of steps to attempt
     */
    const step = useCallback(async (direction: 'forward' | 'backward', count = 1) => {
        if (!iterator || !txInfo) return;
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {

            const isForward = direction === 'forward';
            const steps = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;

            let moved = 0;
            let log: log_infos | null = null;
            let lastValidLog: log_infos | null = null;
            let movedToLastValid = 0;
            let hitBreakpoint = false;

            const isFiltering = filters.length > 0;
            let validStepsFound = 0;
            let totalScanned = 0;
            const SCAN_LIMIT = 10_000_000;
            const CHUNK_SIZE = 500; // Drastically reduced from 5000 to keep UI responsive
            const startingDepth = currentLogRef.current?.depth ?? 0;



            // Iterator methods based on direction
            const advance = () => isForward ? iterator.next() : iterator.prev();
            const rewind = () => isForward ? iterator.prev() : iterator.next();

            while (validStepsFound < steps && totalScanned < SCAN_LIMIT) {
                // Yield to event loop periodically
                if (totalScanned > 0 && totalScanned % CHUNK_SIZE === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                if (!advance()) break; // End of trace


                log = iterator.current_log() ?? null;
                if (!log) break;


                totalScanned++;
                moved++;

                // Skip contract check: ignore instructions deeper than starting depth
                if (skipContract && log.depth > startingDepth) {
                    continue;
                }

                // Check breakpoints (always interrupt)
                if (shouldStop(log)) {
                    hitBreakpoint = true;
                    validStepsFound++;
                    lastValidLog = log;
                    movedToLastValid = moved;
                    break;
                }

                // Check filter
                if (isFiltering) {
                    if (matchesFilter(log)) {
                        validStepsFound++;
                        lastValidLog = log;
                        movedToLastValid = moved;
                    }
                } else {
                    validStepsFound++;
                    lastValidLog = log;
                    movedToLastValid = moved;
                }
            }

            if (validStepsFound > 0 && lastValidLog) {
                // Rewind to the last valid position if we overshot
                const rewindCount = moved - movedToLastValid;
                for (let i = 0; i < rewindCount; i++) {
                    if (!rewind()) break;
                }

                const indexDelta = isForward ? movedToLastValid : -movedToLastValid;
                const newIndex = currentStepIndex + indexDelta;
                setCurrentStepIndex(newIndex);
                updateFromLog(lastValidLog, dynamicTotalSteps || txInfo.trace.length, newIndex, txInfo.transaction.info.hash, txInfo.log_map, iterator);

                if (hitBreakpoint) {
                    setIsPlaying(false);
                }
            } else {
                // No valid steps found (e.g., filtered out everything or hit scan limit)
                if (totalScanned >= SCAN_LIMIT) {
                    console.warn(`Scan limit reached (${SCAN_LIMIT} steps). Stopped scanning.`);
                    setIsPlaying(false); // Stop autoplay if limit reached
                    // Optionally: Trigger a UI toast/notification here if you had a toast system
                }

                if (moved > 0) {
                    // Rewind all moves if no valid step found
                    for (let i = 0; i < moved; i++) {
                        if (!rewind()) break;
                    }
                }
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [iterator, txInfo, currentStepIndex, updateFromLog, dynamicTotalSteps, filters, matchesFilter, shouldStop, skipContract]);


    const next = useCallback((count = 1) => {
        step('forward', count).catch(console.error);
    }, [step]);

    const prev = useCallback((count = 1) => {
        step('backward', count).catch(console.error);
    }, [step]);



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

    const clearMemoryBreakpoints = useCallback(() => {
        setBreakpoints(prev => prev.filter(bp => bp.type !== "Memory"));
    }, []);


    // 12. Computed Data — use real stack_args/stack_output from the engine
    const visibleStack: VisibleStackWindow = useMemo(() => {
        // prevLogData = the log of the instruction that JUST ran
        // Its next_instr.stack_args = what it consumed, stack_output = what it produced
        if (!prevLogData) {
            // Step 0: no previous instruction yet, nothing consumed/produced
            return { produced: [], consumed: [] };
        }

        const lastInstr = prevLogData.next_instr;
        const consumed = extractConsumedItems(lastInstr.stack_args, lastInstr.pc, lastInstr.op);
        const produced = extractProducedItems(lastInstr.stack_output, lastInstr.pc, lastInstr.op);

        return { produced, consumed };
    }, [prevLogData]);

    // 13. Auto-Play Logic
    const [isPlaying, setIsPlaying] = useState<false | 'forward' | 'backward'>(false);
    const [speed, setSpeed] = useState(40);
    const [stepSize, setStepSize] = useState(1);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            const delay = Math.max(50, 1000 - (speed * 9));
            interval = setInterval(() => {
                if (isPlaying === 'forward') step('forward', stepSize).catch(console.error);
                else if (isPlaying === 'backward') step('backward', stepSize).catch(console.error);
            }, delay);
        }
        return () => clearInterval(interval);
    }, [isPlaying, speed, stepSize, step]);



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
    }, [isExternalContract, txInfo, contractCode.length]);

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
            number: currentStepIndex, // The step that just ran
            total: dynamicTotalSteps || state?.totalSteps || 0,
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

    // Derive visitedPcs from ref — recalculates when version bumps or step changes
    const visitedPcs = useMemo(() => {
        const path = executionPathRef.current;
        const limit = Math.min(path.length, currentStepIndex + 1);
        const set = new Set<number>();
        for (let i = 0; i < limit; i++) set.add(path[i]);
        return set;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [executionPathVersion, currentStepIndex]);

    // Derive execution counts from ref
    const computedPcExecutionCount = useMemo(() => {
        const path = executionPathRef.current;
        const limit = Math.min(path.length, currentStepIndex + 1);
        const counts = new Map<number, number>();
        for (let i = 0; i < limit; i++) {
            const pc = path[i];
            counts.set(pc, (counts.get(pc) || 0) + 1);
        }
        return counts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [executionPathVersion, currentStepIndex]);

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
        visitedPcs,
        pcExecutionCount: computedPcExecutionCount,

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
        clearMemoryBreakpoints,
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
