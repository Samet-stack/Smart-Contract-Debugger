import { useState } from "react";
import Button from "../../ui-lib/components/Button";
import Input from "../../ui-lib/components/Input";
import { cn } from "../../ui-lib/utils/cn";

interface SettingsViewProps {
    onBack: () => void;
}



//  Commentary for learning how to make different pages.
export default function SettingsView({ onBack }: SettingsViewProps) {


    // 1. Navigation State
    // 'activeTab' determines which section is currently visible (General, Alias, Shortcuts)
    const [activeTab, setActiveTab] = useState<"general" | "alias" | "shortcuts">("general");

    // 2. General Settings State
    // 'nodeUrl' stores the value of the Node URL input field
    const [nodeUrl, setNodeUrl] = useState("https://app.functori.com/nod...");

    // 3. Alias Settings State
    // Definition of what an 'Alias' looks like: it has an ID, a name (label), and an address
    interface Alias {
        id: string;
        label: string;
        address: string;
    }

    // 'aliases' stores the list of all created aliases
    const [aliases, setAliases] = useState<Alias[]>([]);
    // Types states for the "Add New Alias" form inputs
    const [newAliasLabel, setNewAliasLabel] = useState("");
    const [newAliasAddress, setNewAliasAddress] = useState("");



    // Function (ocaml) called when the user clicks the "Add" button in the Alias tab
    const handleAddAlias = () => {
        // Validation: Ensure both fields are filled before adding
        if (!newAliasLabel || !newAliasAddress) return;

        // Create a new Alias object
        const newAlias: Alias = {
            id: Date.now().toString(), // Simple unique ID generation based on current time
            label: newAliasLabel,
            address: newAliasAddress,
        };

        // Add the new alias to the list (keeping existing ones)
        setAliases([...aliases, newAlias]);

        // Clear the input fields after adding
        setNewAliasLabel("");
        setNewAliasAddress("");
    };

    // List of tabs configuration to generate the navigation sidebar dynamically
    const tabs = [
        { id: "general", label: "General" },
        { id: "alias", label: "Alias" },
        { id: "shortcuts", label: "Shortcuts" },
    ] as const;

    return (
        // Main Container: Takes the full screen height and sets the background color
        <div className="min-h-screen bg-[#FFF0F0] dark:bg-gray-950 flex transition-colors duration-300">

            {/* === SIDEBAR (LEFT) === */}
            {/* Contains the logo, navigation menu, and back button. Fixed width of 64px. */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-[#FFF0F0] dark:bg-gray-900 p-6 flex flex-col gap-8">

                {/* 1. Sidebar Header: Logo and App Name */}
                <div className="flex items-center gap-3">
                    {/* Brand Logo with Gradient "A" */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand/20 shadow-lg">
                        <span className="text-lg font-bold text-white">A</span>
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-bold text-lg">Apollo</span>
                </div>

                {/* 2. Navigation Menu */}
                <nav className="flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            // When clicked, update the 'activeTab' state to switch views
                            onClick={() => setActiveTab(tab.id)}
                            // Dynamic Class: Changes style based on whether this tab is active or not
                            className={cn(
                                "text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                activeTab === tab.id
                                    ? "text-blue-500 bg-transparent" // Active: Blue text
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" // Inactive: Gray with hover effect
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* 3. Back Button: Pushed to the bottom of the sidebar */}
                <div className="mt-auto">
                    <Button variant="outline" size="sm" onClick={onBack} className="w-full gap-2">
                        {/* Wrapper for SVG Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back to Debugger
                    </Button>
                </div>
            </aside>

            {/* === MAIN CONTENT (RIGHT) === */}
            {/* The main area where settings forms are displayed. Scrollable. */}
            <main className="flex-1 bg-[#F3F4FD] dark:bg-gray-950 p-10 h-screen overflow-auto">

                {/* --- CONTENT: GENERAL TAB --- */}
                {activeTab === "general" && (
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <label className="text-gray-700 dark:text-gray-300 font-mono text-sm whitespace-nowrap">Node URL :</label>
                            <div className="flex-1 flex gap-2">
                                <Input
                                    value={nodeUrl}
                                    onChange={(e) => setNodeUrl(e.target.value)}
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9"
                                />
                                <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 whitespace-nowrap">
                                    Reset Default Node
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONTENT: ALIAS TAB --- */}
                {activeTab === "alias" && (
                    <div className="max-w-4xl space-y-6">
                        {/* Section Title */}
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Alias</h2>

                        {/* White Card containing the Add Form */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex flex-col md:flex-row gap-4 items-end">

                                {/* Input 1: Alias Name (Label) */}
                                <div className="flex-1 w-full">
                                    <Input
                                        placeholder="Alias"
                                        value={newAliasLabel}
                                        onChange={(e) => setNewAliasLabel(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                {/* Input 2: Hex Address */}
                                <div className="flex-[2] w-full"> {/* 'flex-[2]' makes this input twice as wide as the first one */}
                                    <Input
                                        placeholder="Hexadecimal value (ex: 0x...)"
                                        value={newAliasAddress}
                                        onChange={(e) => setNewAliasAddress(e.target.value)}
                                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                {/* Action Button: Add Alias */}
                                <Button
                                    onClick={handleAddAlias}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 whitespace-nowrap"
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* List of Registered Aliases (Visible only if there are aliases) */}
                        {aliases.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Registered Aliases</h3>
                                <div className="grid gap-2">
                                    {aliases.map(alias => (
                                        <div key={alias.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{alias.label}</span>
                                            <span className="font-mono text-xs text-gray-500">{alias.address}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- PLACEHOLDER FOR SHORTCUTS --- */}
                {activeTab === "shortcuts" && (
                    <div className="flex items-center justify-center h-full text-gray-400 italic">
                        Shortcuts settings coming soon...
                    </div>
                )}
            </main>
        </div>
    );
}