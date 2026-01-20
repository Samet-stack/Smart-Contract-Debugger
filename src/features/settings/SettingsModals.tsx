import { useState } from "react";
import Button from "../../ui-lib/components/Button";
import Input from "../../ui-lib/components/Input";
import Modal from "../../ui-lib/components/Modal";
import type { SettingsTab } from "./SettingsMenu";

interface SettingsModalsProps {
    activeTab: SettingsTab | null;
    onClose: () => void;
}

export default function SettingsModals({ activeTab, onClose }: SettingsModalsProps) {
    // --- STATE MANAGEMENT ---

    // 1. General Settings State
    const [nodeUrl, setNodeUrl] = useState("https://app.functori.com/nod...");

    // 2. Alias Settings State
    interface Alias {
        id: string;
        label: string;
        address: string;
    }
    const [aliases, setAliases] = useState<Alias[]>([]);
    const [newAliasLabel, setNewAliasLabel] = useState("");
    const [newAliasAddress, setNewAliasAddress] = useState("");

    const handleAddAlias = () => {
        if (!newAliasLabel || !newAliasAddress) return;
        const newAlias: Alias = {
            id: Date.now().toString(),
            label: newAliasLabel,
            address: newAliasAddress,
        };
        setAliases([...aliases, newAlias]);
        setNewAliasLabel("");
        setNewAliasAddress("");
    };

    const handleRemoveAlias = (id: string) => {
        setAliases(aliases.filter(alias => alias.id !== id));
    };

    // 3. Shortcuts Data
    const shortcutsList = [
        { label: "Previous instruction", key: "[p]" },
        { label: "Next instruction", key: "[n]" },
        { label: "Toggle backward auto-play", key: "[P]" },
        { label: "Toggle forward auto-play", key: "[N]" },
        { label: "Increase auto-play speed", key: "[a]" },
        { label: "Decrease auto-play speed", key: "[d]" },
    ];


    // --- RENDER HELPERS ---

    const renderGeneralContent = () => (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">Node URL</label>
                <div className="flex gap-2">
                    <Input
                        value={nodeUrl}
                        onChange={(e) => setNodeUrl(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                    <Button variant="outline" className="whitespace-nowrap bg-gray-50 dark:bg-gray-800">
                        Reset Default
                    </Button>
                </div>
                <p className="text-xs text-gray-500">The URL of the Tezos node to connect to.</p>
            </div>
        </div>
    );

    // Helper for deterministic address colors
    const getAddressColor = (address: string) => {
        const colors = [
            "text-red-600 dark:text-red-400",
            "text-orange-600 dark:text-orange-400",
            "text-amber-600 dark:text-amber-400",
            "text-green-600 dark:text-green-400",
            "text-emerald-600 dark:text-emerald-400",
            "text-teal-600 dark:text-teal-400",
            "text-cyan-600 dark:text-cyan-400",
            "text-sky-600 dark:text-sky-400",
            "text-blue-600 dark:text-blue-400",
            "text-indigo-600 dark:text-indigo-400",
            "text-violet-600 dark:text-violet-400",
            "text-purple-600 dark:text-purple-400",
            "text-fuchsia-600 dark:text-fuchsia-400",
            "text-pink-600 dark:text-pink-400",
            "text-rose-600 dark:text-rose-400",
        ];
        let hash = 0;
        for (let i = 0; i < address.length; i++) {
            hash = address.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const renderAliasContent = () => (
        <div className="space-y-6">
            {/* Add New Alias Form */}
            <div className="bg-indigo-50/50 dark:bg-gray-800/50 rounded-lg p-4 border border-indigo-100 dark:border-gray-700">
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                            <label className="text-xs font-semibold text-indigo-900/60 dark:text-indigo-400/80 uppercase tracking-wider mb-1 block">Label</label>
                            <Input
                                placeholder="e.g. MyContract"
                                value={newAliasLabel}
                                onChange={(e) => setNewAliasLabel(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                                className="bg-white dark:bg-gray-900 border-indigo-200 dark:border-gray-700 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-indigo-900/60 dark:text-indigo-400/80 uppercase tracking-wider mb-1 block">Address</label>
                            <Input
                                placeholder="e.g. KT1..."
                                value={newAliasAddress}
                                onChange={(e) => setNewAliasAddress(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
                                className="bg-white dark:bg-gray-900 border-indigo-200 dark:border-gray-700 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddAlias}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
                            disabled={!newAliasLabel || !newAliasAddress}
                        >
                            Add Alias
                        </Button>
                    </div>
                </div>
            </div>

            {/* List of Aliases */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Registered Aliases</h4>
                {aliases.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm italic bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                        No aliases configured yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {aliases.map((alias) => (
                            <div key={alias.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg border border-indigo-100 dark:border-gray-800 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{alias.label}</span>
                                    <span className={`font-mono text-[10px] tracking-wide ${getAddressColor(alias.address)}`}>{alias.address}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveAlias(alias.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100"
                                    title="Remove alias"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderShortcutsContent = () => (
        <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                    {shortcutsList.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{item.label}</span>
                            <kbd className="hidden sm:inline-block px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-mono text-gray-500 dark:text-gray-400 shadow-sm min-w-[2rem] text-center">
                                {item.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
                Tip: You can use these keys to control the debugger navigation.
            </p>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={activeTab === "general"}
                onClose={onClose}
                title="General Settings"
                className="max-w-xl"
            >
                {renderGeneralContent()}
            </Modal>

            <Modal
                isOpen={activeTab === "alias"}
                onClose={onClose}
                title="Address Aliases"
                className="max-w-2xl"
            >
                {renderAliasContent()}
            </Modal>

            <Modal
                isOpen={activeTab === "shortcuts"}
                onClose={onClose}
                title="Keyboard Shortcuts"
                className="max-w-lg"
            >
                {renderShortcutsContent()}
            </Modal>
        </>
    );
}
