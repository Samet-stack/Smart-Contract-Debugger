import { createContext, useContext, useMemo, useState } from "react";
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

export const AliasProvider = ({ children }: { children: ReactNode }) => {
    const [aliases, setAliases] = useState<Alias[]>([]);

    const addAlias = (label: string, address: string) => {
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
    };

    const removeAlias = (id: string) => {
        setAliases((prev) => prev.filter((a) => a.id !== id));
    };

    const findAlias = (address: string) => {
        if (!address) return undefined;
        const normalized = normalizeAddress(address);
        return aliases.find((a) => normalizeAddress(a.address) === normalized);
    };

    const value = useMemo(
        () => ({ aliases, addAlias, removeAlias, findAlias }),
        [aliases]
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
