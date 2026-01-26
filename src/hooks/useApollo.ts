import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DebuggerState, Breakpoint, InstructionInfo, MemorySegment } from '../types/ApolloAPI';
import type { StackItem } from '../types/StackItem';
import type { transaction_info, trace_iterator, log_infos, stack as EngineStack } from '../types/ApolloEngine';

export type ApolloStatus = "Ready" | "Loading" | "Error";

// Type for the visible stack window
export interface VisibleStackWindow {
    current: StackItem | null;  // Green - current step
    previous: StackItem | null; // Red - previous step
}

const CONFIG = {
    node_url: "https://app.functori.com/reth",
    tx_hash: "0xcae715cc39730aeaada34f4a405e92cb21a9d1820e7d48bee58d681fd515bae0"
};

// Helper: Map Engine Stack to UI StackItem
const mapStack = (engineStack: EngineStack): StackItem[] => {
    return engineStack.map((item, index) => ({
        value: item.value,
        label: `stack[${index}]`,
        status: 'neutral', // default
        modifiedAt: { pc: 0, opcode: 'UNKNOWN' } // We might need to fetch this from log_map if available
    }));
};

// Helper: Map Engine Log to DebuggerState
const mapLogToState = (log: log_infos | undefined, totalSteps: number, currentStep: number): DebuggerState => {
    if (!log) {
        return {
            currentStep: 0,
            totalSteps,
            pcCoverage: 0,
            currentInstruction: null,
            nextInstruction: null,
            stack: [],
            memory: [],
            isLoading: false,
            error: null,
            traceId: null
        };
    }

    const currentInstr: InstructionInfo = {
        pc: log.next_instr.pc,
        opcode: log.next_instr.op,
        gas: Number(log.remaining_gas), // BigInt to Number (careful with precision)
        gasCost: Number(log.next_instr.gas_cost),
        stepNumber: currentStep,
        totalSteps: totalSteps,
        description: `Executed ${log.next_instr.op}`,
        memoryMappings: [], // TODO: extract if available
        memoryChanges: []   // TODO: extract from log.next_instr.memory_update
    };

    // Map Memory (simplification for now)
    // The engine provides `log.exec_state.memory` which is `{ value: ArrayBuffer, log_ids: ... }`
    // We need to convert ArrayBuffer to MemorySegment[] for the UI.
    const memorySegments: MemorySegment[] = [];
    // TODO: Implement proper memory parsing from ArrayBuffer if needed for visualization

    return {
        currentStep,
        totalSteps,
        pcCoverage: 0, // TODO: calculate based on code coverage
        currentInstruction: currentInstr,
        nextInstruction: null, // engine iterator doesn't peek next easily without stepping
        stack: mapStack(log.exec_state.stack),
        memory: memorySegments,
        isLoading: false,
        error: null,
        traceId: CONFIG.tx_hash
    };
};

export const useApollo = () => {
    // 1. Core Engine State
    const [status, setStatus] = useState<ApolloStatus>("Loading");
    const [txInfo, setTxInfo] = useState<transaction_info | null>(null);
    const [iterator, setIterator] = useState<trace_iterator | null>(null);

    // 2. UI State
    const [state, setState] = useState<DebuggerState | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // 3. Stack History Tracking (Preserved logic)
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const lastStepRef = useRef<number>(-1);

    // 4. Initialization
    useEffect(() => {
        const initEngine = async () => {
            try {
                if (typeof Apollo === 'undefined') {
                    throw new Error("Apollo global not found. Is apollo-engine.js loaded?");
                }
                console.log("Loading transaction...", CONFIG);
                const info = await Apollo.load_transaction(CONFIG);
                console.log("Transaction loaded:", info);

                setTxInfo(info);
                setIterator(info.trace_iterator);
                setStatus("Ready");

                // Set initial state
                const initialLog = info.trace_iterator.current_log();
                setState(mapLogToState(initialLog, info.trace.length, 0)); // Approx total steps from trace length

            } catch (err: any) {
                console.error("Failed to initialize Apollo:", err);
                setStatus("Error");
            }
        };

        initEngine();
    }, []);

    // 5. Update stack history when step changes (Preserved logic)
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

    // 6. Navigation Actions (Real Engine)
    const next = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasNext = iterator.next();
        if (hasNext) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex + 1;
            setCurrentStepIndex(newIndex);
            setState(mapLogToState(log, txInfo.trace.length, newIndex)); // Note: trace length is approx total steps
        }
    }, [iterator, txInfo, currentStepIndex]);

    const prev = useCallback(() => {
        if (!iterator || !txInfo) return;
        const hasPrev = iterator.prev();
        if (hasPrev) {
            const log = iterator.current_log();
            const newIndex = currentStepIndex - 1;
            setCurrentStepIndex(newIndex);
            setState(mapLogToState(log, txInfo.trace.length, newIndex));
        }
    }, [iterator, txInfo, currentStepIndex]);

    const setBreakpoint = useCallback((bp: Breakpoint) => {
        console.warn("Breakpoints not yet implemented for Real Engine");
    }, []);

    // 7. Computed Data
    const visibleStack: VisibleStackWindow = useMemo(() => {
        const len = stackHistory.length;
        return {
            current: len > 0 ? { ...stackHistory[len - 1], status: 'produced' as const } : null,
            previous: len > 1 ? { ...stackHistory[len - 2], status: 'consumed' as const } : null
        };
    }, [stackHistory]);

    // 8. Auto-Play Logic
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

    return {
        status,
        rawState: state,
        currentStep: currentStepIndex,
        currentOpcode: state?.currentInstruction?.opcode,
        stack: state?.stack || [],
        memory: state?.memory || [],
        nextInstruction: state?.nextInstruction || null,

        visibleStack,
        stackHistoryLength: stackHistory.length,
        stackHistory,

        next,
        prev,
        setBreakpoint,

        isPlaying,
        togglePlay,
        speed,
        setSpeed
    };
};
