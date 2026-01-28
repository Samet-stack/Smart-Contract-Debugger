/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ApolloDebuggerAPI, DebuggerState, Breakpoint } from "../types/ApolloAPI";
const initialState: DebuggerState = {
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
    error: null,
    traceId: null
};
interface DebuggerContextProps {
    state: DebuggerState;
    loadTrace: (traceData: unknown) => void;
    next: () => void;
    prev: () => void;
    run: () => void;
    pause: () => void;
    setSpeed: (speed: number) => void;
    setStepSize: (n: number) => void;
    setBreakpoint: (bp: Breakpoint) => void;
}
const DebuggerContext = createContext<DebuggerContextProps | null>(null);
export const DebuggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DebuggerState>(initialState);
    const [api] = useState<ApolloDebuggerAPI | null>(() => window.ApolloDebugger ?? null);

    useEffect(() => {
        if (api) {
            console.log("✅ Apollo Debugger Engine connected");
            const unsubscribe = api.subscribe((newState) => {
                setState(newState);
            });
            return () => unsubscribe();
        } else {
            console.warn("⚠️ Apollo Debugger Engine NOT found on window object.");
        }
    }, [api]);
    const next = useCallback(() => api?.next(), [api]);
    const prev = useCallback(() => api?.prev(), [api]);
    const run = useCallback(() => api?.run(), [api]);
    const pause = useCallback(() => api?.pause(), [api]);
    const loadTrace = useCallback((data: unknown) => api?.loadTrace(data), [api]);

    const setSpeed = useCallback((x: number) => api?.setSpeed(x), [api]);
    const setStepSize = useCallback((n: number) => api?.setStepSize(n), [api]);
    const setBreakpoint = useCallback((bp: Breakpoint) => api?.setBreakpoint(bp), [api]);
    const value = {
        state,
        loadTrace,
        next,
        prev,
        run,
        pause,
        setSpeed,
        setStepSize,
        setBreakpoint
    };
    return (
        <DebuggerContext.Provider value={value}>
            {children}
        </DebuggerContext.Provider>
    );
};
export const useDebugger = () => {
    const context = useContext(DebuggerContext);
    if (!context) {
        throw new Error("useDebugger must be used within a DebuggerProvider");
    }
    return context;
};
