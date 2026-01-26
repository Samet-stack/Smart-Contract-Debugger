import { useState, useEffect, useCallback } from 'react';
import type { ApolloDebuggerAPI, DebuggerState, Breakpoint } from '../types/ApolloAPI';

export type ApolloStatus = "Ready" | "Loading" | "Error";

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

    // 2. Initialization & Subscription (The Plumbing)
    useEffect(() => {
        const api = window.ApolloDebugger;

        if (api) {
            setEngine(api);
            setStatus("Ready");
            setState(api.getCurrentState());

            const unsubscribe = api.subscribe((newState) => {
                // Force new object reference to ensure React triggers re-render
                // checking against previous state to avoid infinite loops if needed, 
                // but spreading is safer for now.
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

    // 3. Action Wrappers
    const next = useCallback(() => engine?.next(), [engine]);
    const prev = useCallback(() => engine?.prev(), [engine]);
    const setBreakpoint = useCallback((bp: Breakpoint) => engine?.setBreakpoint(bp), [engine]);

    // Simplified Accessors
    const currentOpcode = state?.currentInstruction?.opcode;
    const currentStep = state?.currentStep || 0;

    // Data extractors
    const rawStack = state?.stack || [];
    const memory = state?.memory || [];



    // 4. Auto-Play Logic
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
        stack: rawStack, // Return RAW stack
        memory,

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
