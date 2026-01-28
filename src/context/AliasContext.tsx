/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Alias {
    id: string;
    label: string;
    address: string;
}

interface AliasContextValue {
    aliases: Alias[];
    addAlias: (label: string, address: string) => void;
    removeAlias: (id: string) => void;
    findAlias: (address: string) => Alias | undefined;
}

const AliasContext = createContext<AliasContextValue | null>(null);

const normalizeAddress = (address: string) => address.trim().toLowerCase();
const STORAGE_KEY = "apollo.aliases.v1";

const loadAliases = (): Alias[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
                id: String(item.id ?? Date.now()),
                label: String(item.label ?? "").trim(),
                address: String(item.address ?? "").trim(),
            }))
            .filter((item) => item.label && item.address);
    } catch {
        return [];
    }
};

export const AliasProvider = ({ children }: { children: ReactNode }) => {
    const [aliases, setAliases] = useState<Alias[]>(() => loadAliases());

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases));
        } catch {
            // Ignore storage errors (e.g., quota exceeded)
        }
    }, [aliases]);

    const addAlias = useCallback((label: string, address: string) => {
        const cleanLabel = label.trim();
        const normalized = normalizeAddress(address);
        if (!cleanLabel || !normalized) return;

        setAliases((prev) => {
            const existingIndex = prev.findIndex((a) => normalizeAddress(a.address) === normalized);
            if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = { ...next[existingIndex], label: cleanLabel, address };
                return next;
            }
            return [...prev, { id: Date.now().toString(), label: cleanLabel, address }];
        });
    }, []);

    const removeAlias = useCallback((id: string) => {
        setAliases((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const findAlias = useCallback((address: string) => {
        if (!address) return undefined;
        const normalized = normalizeAddress(address);
        return aliases.find((a) => normalizeAddress(a.address) === normalized);
    }, [aliases]);

    const value = useMemo(
        () => ({ aliases, addAlias, removeAlias, findAlias }),
        [aliases, addAlias, removeAlias, findAlias]
    );

    return <AliasContext.Provider value={value}>{children}</AliasContext.Provider>;
};

export const useAliases = () => {
    const context = useContext(AliasContext);
    if (!context) {
        throw new Error("useAliases must be used within an AliasProvider");
    }
    return context;
};
