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
        // Access the global API injected by Jsoo
        const api = window.ApolloDebugger;

        if (api) {
            setEngine(api);
            setStatus("Ready");

            // Load initial state immediately
            setState(api.getCurrentState());

            // Subscribe to Engine updates (Automatic UI Refresh)
            // This callback is triggered by OCaml whenever the state changes (next/prev/etc)
            const unsubscribe = api.subscribe((newState) => {
                setState(newState);

                // Derive status from the new state
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

    // Data extractors with safe defaults
    const stack = state?.stack || [];
    const memory = state?.memory || [];
    const nextInstruction = state?.nextInstruction || null; // Restored

    return {

        status,
        rawState: state,


        currentStep,
        currentOpcode,
        stack,
        memory,
        nextInstruction,

        // Actions
        next,
        prev,
        setBreakpoint,
    };
};
