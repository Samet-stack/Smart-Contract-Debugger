import { type Dispatch, type SetStateAction } from "react";
import Button from "../../ui-lib/components/Button";
import Input from "../../ui-lib/components/Input";
import SettingsButton from "../../ui-lib/components/SettingsButton";
import ThemeToggle from "../../ui-lib/components/ThemeToggle";
import SettingsMenu, { type SettingsTab } from "../settings/SettingsMenu";
import SettingsModals from "../settings/SettingsModals";
import LOGO_IMG from "../../assets/logo.png";
import { type ApolloStatus } from "../../hooks/useApollo";

interface HeaderProps {
    txHash: string;
    setTxHash: Dispatch<SetStateAction<string>>;
    handleLoad: () => void;
    status: ApolloStatus;
    settingsMenuOpen: boolean;
    setSettingsMenuOpen: Dispatch<SetStateAction<boolean>>;
    activeSettingsTab: SettingsTab | null;
    setActiveSettingsTab: Dispatch<SetStateAction<SettingsTab | null>>;
}

/**
 * Header Component
 * Displays the Logo, Transaction Search Bar, Settings, and Load Button.
 * It handles the "Load URL" action and theme toggling.
 */
export default function Header({
    txHash,
    setTxHash,
    handleLoad,
    status,
    settingsMenuOpen,
    setSettingsMenuOpen,
    activeSettingsTab,
    setActiveSettingsTab
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-sm">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-y-3 gap-x-2 px-4 py-3 md:px-6">

                {/* 1. Logo section */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 order-1">
                    <img src={LOGO_IMG} alt="Apollo Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
                    <div>
                        <span className="font-bold text-gray-900 dark:text-white tracking-tight text-sm md:text-base">Apollo</span>
                        <span className="hidden lg:inline-flex ml-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Debugger</span>
                    </div>
                </div>

                {/* 2. Search bar */}
                <div className="flex-1 order-2 mx-2 md:mx-6 max-w-3xl min-w-0">
                    <Input
                        placeholder="Tx hash..."
                        className="w-full h-9 md:h-10 text-xs md:text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                    />
                </div>

                {/* 3. Settings / Theme */}
                <div className="flex items-center gap-1 flex-shrink-0 order-3 md:order-4 relative">
                    <SettingsButton onClick={() => setSettingsMenuOpen(!settingsMenuOpen)} />
                    {settingsMenuOpen && (
                        <SettingsMenu
                            onSelect={(tab) => {
                                setActiveSettingsTab(tab);
                                setSettingsMenuOpen(false);
                            }}
                            onClose={() => setSettingsMenuOpen(false)}
                        />
                    )}
                    <ThemeToggle />
                    <SettingsModals
                        activeTab={activeSettingsTab}
                        onClose={() => setActiveSettingsTab(null)}
                    />
                </div>

                {/* 4. Action buttons */}
                <div className="order-4 md:order-3 w-full md:w-auto md:flex-none flex-shrink-0 md:ml-auto flex items-center justify-start md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide pt-3 md:pt-0 border-t md:border-t-0 border-gray-100/50 dark:border-gray-800/50 md:border-none mt-1 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors px-2 lg:px-3"
                        onClick={handleLoad}
                        disabled={status === "Loading"}
                    >
                        <svg className="w-4 h-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <span className="hidden lg:inline">{status === "Loading" ? "Loading..." : "Load URL"}</span>
                    </Button>

                    {/* Status Badge */}
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 text-[10px] md:text-xs font-medium text-orange-500 whitespace-nowrap h-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        Ready
                    </div>
                </div>

            </div>
        </header>
    );
}
