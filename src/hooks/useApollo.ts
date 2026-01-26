import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ApolloDebuggerAPI, DebuggerState, Breakpoint } from '../types/ApolloAPI';
import type { StackItem } from '../types/StackItem';

export type ApolloStatus = "Ready" | "Loading" | "Error";

// Type for the visible stack window
export interface VisibleStackWindow {
    current: StackItem | null;  // Green - current step
    previous: StackItem | null; // Red - previous step
}

/**
 * useApollo Hook
 * Connects to the global ApolloDebuggerAPI exposed by the OCaml engine.
 * Manages the connection status and syncs the debugger state with React.
 */
export const useApollo = () => {
    // 1. Local State mirroring the Engine
    const [status, setStatus] = useState<ApolloStatus>("Loading");
    const [state, setState] = useState<DebuggerState | null>(null);
    const [engine, setEngine] = useState<ApolloDebuggerAPI | null>(null);

    // 2. Stack History Tracking
    const [stackHistory, setStackHistory] = useState<StackItem[]>([]);
    const lastStepRef = useRef<number>(-1);

    // 3. Initialization & Subscription (The Plumbing)
    useEffect(() => {
        const api = window.ApolloDebugger;

        if (api) {
            setEngine(api);
            setStatus("Ready");
            setState(api.getCurrentState());

            const unsubscribe = api.subscribe((newState) => {
                setState({ ...newState });
                if (newState.error) {
                    setStatus("Error");
                } else if (newState.isLoading) {
                    setStatus("Loading");
                } else {
                    setStatus("Ready");
                }
            });

            return () => unsubscribe();
        } else {
            console.error("Apollo Debugger Engine not found!");
            setStatus("Error");
        }
    }, []);

    // 4. Update stack history when step changes
    useEffect(() => {
        const currentStep = state?.currentStep ?? -1;
        const stackArr = state?.stack || [];
        // Get the LAST item (newest) from the stack, not stack[0]
        const latestItem = stackArr[stackArr.length - 1];

        if (currentStep !== lastStepRef.current && latestItem) {
            if (currentStep > lastStepRef.current) {
                // Moving forward: add to history
                setStackHistory(prev => [...prev, latestItem]);
            } else if (currentStep < lastStepRef.current) {
                // Moving backward: remove from history
                setStackHistory(prev => prev.slice(0, -1));
            }
            lastStepRef.current = currentStep;
        }
    }, [state?.currentStep, state?.stack]);

    // 5. Compute visible stack window (2 items max)
    const visibleStack: VisibleStackWindow = useMemo(() => {
        const len = stackHistory.length;
        return {
            current: len > 0 ? { ...stackHistory[len - 1], status: 'produced' as const } : null,
            previous: len > 1 ? { ...stackHistory[len - 2], status: 'consumed' as const } : null
        };
    }, [stackHistory]);

    // 6. Action Wrappers
    const next = useCallback(() => engine?.next(), [engine]);
    const prev = useCallback(() => engine?.prev(), [engine]);
    const setBreakpoint = useCallback((bp: Breakpoint) => engine?.setBreakpoint(bp), [engine]);

    // Simplified Accessors
    const currentOpcode = state?.currentInstruction?.opcode;
    const currentStep = state?.currentStep || 0;

    // Data extractors
    const rawStack = state?.stack || [];
    const memory = state?.memory || [];
    const nextInstruction = state?.nextInstruction || null;

    // 7. Auto-Play Logic
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
        currentStep,
        currentOpcode,
        stack: rawStack,
        memory,
        nextInstruction,

        // Sliding Window Stack
        visibleStack,
        stackHistoryLength: stackHistory.length,
        stackHistory, // Full history for expandable panel

        // Actions
        next,
        prev,
        setBreakpoint,


        // Auto-Play
        isPlaying,
        togglePlay,
        speed,
        setSpeed
    };
};
