import { useState, useCallback, useRef } from "react";

import { cn } from "./ui-lib/utils/cn"; // Import cn utility
import Button from "./ui-lib/components/Button";
import Input from "./ui-lib/components/Input";
import Card from "./ui-lib/components/Card";
import ThemeToggle from "./ui-lib/components/ThemeToggle";
import SettingsButton from "./ui-lib/components/SettingsButton";
import ExecutionPanel from "./features/execution/ExecutionPanel";
import MemoryView from "./features/memory/MemoryView";
import StackView from "./features/stack/StackView";
import TxInstrsView from "./features/tx/TxInstrsView";
import type { MemorySegment } from "./types/MemorySegment";
import type { StackItem } from "./types/StackItem";
import type { TxInstrs } from "./types/TxInstrs";
import type { Breakpoint } from "./types/ApolloAPI"; // Import Breakpoint
import CallContextView from "./features/tx/CallContextView"; // Newly created
import InstructionFilters from "./features/filters/InstructionFilters"; // Nouveau composant Feature


import SettingsMenu, { type SettingsTab } from "./features/settings/SettingsMenu";
import SettingsModals from "./features/settings/SettingsModals";

import ConsoleModal from "./features/console/ConsoleModal"; // Import ConsoleModal
import MemoryMappingsView from "./features/memory/MemoryMappingsView"; // Import MemoryMappingsView
import ContractViewer from "./features/contract/ContractViewer"; // Import ContractViewer

import { useApollo } from "./hooks/useApollo";   // Import Hook
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"; // Import Shortcuts Hook

import StorageView from "./features/storage/StorageView"; // Import StorageView
import TransientStorageView from "./features/storage/TransientStorageView"; // Import TransientStorageView

// CALL-type opcodes for Metacall breakpoint
const METACALL_OPCODES = ["CALL", "STATICCALL", "DELEGATECALL", "CALLCODE", "CREATE", "CREATE2"];

export default function App() {
  const [leftCollapsed, setLeftCollapsed] = useState(false); // Sidebar State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false); // Console State


  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab | null>(null);

  // --- HOOK INTEGRATION ---
  const {
    status,
    stack,
    memory,
    rawState,
    next,
    prev,

    lastInstruction,
    nextInstruction,
    // Auto-Play
    isPlaying,
    togglePlay,
    speed,
    setSpeed,
    stepSize,
    setStepSize,

    // Sliding Window Stack
    visibleStack,
    stackHistory,
    loadTransaction,

    // NEW: Storage & Transient Storage
    storage,
    transientStorage,

    // NEW: Contract Code
    contractCode,
    address,
    gasUsed,
    isExternalContract,

    // Full Memory Mappings (like old Apollo)
    fullMemoryMappings,


    // NEW: Filters & Breakpoints
    filters,
    setFilters,
    breakpoints,
    setBreakpoint,
    removeBreakpoint,
    clearMemoryBreakpoints,

    // Skip Contract
    skipContract,
    setSkipContract,

  } = useApollo();

  const [txHash, setTxHash] = useState("0xcae715cc39730aeaada34f4a405e92cb21a9d1820e7d48bee58d681fd515bae0"); // Default hash for demo

  const handleLoad = () => {
    if (txHash) {
      loadTransaction(txHash);
    }
  };

  const stopAutoPlay = useCallback(() => {
    if (isPlaying) togglePlay(isPlaying);
  }, [isPlaying, togglePlay]);

  // --- KEYBOARD SHORTCUTS ---
  useKeyboardShortcuts({
    onNext: () => {
      stopAutoPlay(); // Stop auto-play on manual step
      next(stepSize);
    },
    onPrev: () => {
      stopAutoPlay();
      prev(stepSize);
    },
    onToggleAutoNext: () => {
      togglePlay("forward");
    },
    onToggleAutoPrev: () => {
      togglePlay("backward");
    },
    onSpeedUp: () => setSpeed(s => Math.min(s + 5, 100)),
    onSpeedDown: () => setSpeed(s => Math.max(s - 5, 0)),
    onTogglePlay: () => {
      // Spacebar toggles forward play by default
      if (isPlaying) togglePlay(isPlaying);
      else togglePlay("forward");
    }
  });

  // --- ADAPTERS (To match existing UI Props) ---



  // Memory Adapter
  // (Assuming memory from hook matches MemorySegment interface, which we control in state)
  const memorySegments: MemorySegment[] = memory;

  // TxInstrs Adapter (Dynamic from Hook)
  // SEMANTIC FIX:
  // - lastInstruction = what JUST EXECUTED (from previous step's next_instr)
  // - nextInstruction = what's ABOUT TO EXECUTE (from current step's next_instr)
  const txInstrsData: TxInstrs = {
    // Gas data from hook
    ourGas: parseInt(gasUsed.main) || 0,
    theirGas: parseInt(gasUsed.other) || 0,
    // LAST_RUN_INSTR: Uses lastInstruction (what just executed)
    lastRunInstr: lastInstruction ? {
      number: lastInstruction.number,
      total: lastInstruction.total,

      pc: lastInstruction.pc,
      opcode: lastInstruction.opcode,
      gas: lastInstruction.gas,
      gasCost: lastInstruction.gasCost,
      memoryMappings: lastInstruction.memoryMappings || [],
      memoryChanges: lastInstruction.memoryChanges || [],
      address: lastInstruction.address,
      functionSelector: lastInstruction.functionSelector || "",
      callData: lastInstruction.callData || "",
      depth: lastInstruction.depth,
      lastConditionalJump: lastInstruction.lastConditionalJump,
    } : null,
    // NEXT_INSTR_TO_RUN: Uses nextInstruction (what's about to execute)
    nextInstrToRun: nextInstruction ? {
      number: nextInstruction.number ?? 0,
      total: nextInstruction.total ?? 0,

      pc: nextInstruction.pc,
      opcode: nextInstruction.opcode,
      gas: nextInstruction.gas,
      gasCost: nextInstruction.gasCost,
      memoryMappings: nextInstruction.memoryMappings || [],
      memoryChanges: nextInstruction.memoryChanges || [],
      address: nextInstruction.address,
      functionSelector: nextInstruction.functionSelector || "",
      callData: nextInstruction.callData || "",
      description: nextInstruction.description,
      depth: nextInstruction.depth,
      lastConditionalJump: nextInstruction.lastConditionalJump,
    } : null
  };


  type BreakpointType = "Storage" | "Transient" | "Memory";






  const [storageInput, setStorageInput] = useState("");
  const [transientInput, setTransientInput] = useState("");
  const [memoryMin, setMemoryMin] = useState<number>(0);
  const [memoryMax, setMemoryMax] = useState<number>(32);
  const [metacall, setMetacall] = useState(false);
  const [showAliases, setShowAliases] = useState(true); // Renamed for clarity

  const metacallAddedRef = useRef<Set<string>>(new Set());

  const handleFiltersChange = useCallback((nextFilters: string[]) => {
    setFilters(prev => {
      if (metacall) {
        const prevSet = new Set(prev);
        const nextSet = new Set(nextFilters);

        METACALL_OPCODES.forEach(op => {
          // If user removes an opcode or adds one manually, don't treat it as auto-added
          if (!nextSet.has(op) || !prevSet.has(op)) {
            metacallAddedRef.current.delete(op);
          }
        });
      }
      return nextFilters;
    });
  }, [setFilters, metacall]);

  // Handle Metacall toggle - adds/removes CALL-type opcodes from filters
  const handleMetacallToggle = (enabled: boolean) => {
    setMetacall(enabled);
    if (enabled) {
      // Add CALL opcodes to filters (avoiding duplicates)
      setFilters(prev => {
        const additions = METACALL_OPCODES.filter(op => !prev.includes(op));
        metacallAddedRef.current = new Set(additions);
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    } else {
      // Remove only opcodes auto-added by metacall
      const toRemove = metacallAddedRef.current;
      setFilters(prev => prev.filter(f => !toRemove.has(f)));
      metacallAddedRef.current.clear();
    }
  };


  const addBreakpoint = (type: BreakpointType, inputValue: string, setInput: (v: string) => void) => {
    if (!inputValue) return;

    // Strict validation for Storage/Transient keys (32 bytes = 66 chars with 0x)
    if (type === "Storage" || type === "Transient") {
      if (!/^0x[0-9a-fA-F]{64}$/.test(inputValue)) {
        alert("Invalid format! Must be a 32-byte hex string (0x + 64 chars).");
        return;
      }
    } else {
      // Basic hex validation for others (PC, etc.)
      if (!/^0x[0-9a-fA-F]+$/.test(inputValue)) {
        alert("Invalid format! Must start with 0x...");
        return;
      }
    }

    const newBp: Breakpoint = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      value: inputValue,
      enabled: true
    };


    // Call Hook Action
    setBreakpoint({
      id: newBp.id,
      type: newBp.type,
      value: newBp.value,
      enabled: true
    });

    setInput("");
  };



  const memoryRangeEnabled = breakpoints.some(bp => bp.type === "Memory");

  const toggleMemoryRange = () => {
    const newState = !memoryRangeEnabled;
    if (newState) {
      const newBp: Breakpoint = {
        id: Date.now().toString() + Math.random().toString(),
        type: "Memory",
        value: `[${memoryMin};${memoryMax}]`,
        min: memoryMin.toString(),
        max: memoryMax.toString(),
        enabled: true
      };

      setBreakpoint(newBp); // Use hook setter
    } else {
      // Remove any Memory type breakpoint
      clearMemoryBreakpoints();
    }
  };


  // removeBreakpoint is now imported from hook


  // Arrow keys are handled in useKeyboardShortcuts



  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-sm">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-y-3 gap-x-2 px-4 py-3 md:px-6">

          {/* 1. Logo section (using order-1 to keep it left) */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 order-1">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-brand/20 shadow-lg">
              <span className="text-lg md:text-xl font-bold text-white">A</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white tracking-tight text-sm md:text-base">Apollo</span>
              {/* Caché sur mobile pour éviter que ça fasse trop compréssé */}
              <span className="hidden lg:inline-flex ml-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Debugger</span>
            </div>
          </div>

          {/* 2. Search bar, prominent (with order-2 and flex-1 it adapts) */}
          {/* on la garde au milieu, sur mobile comme sur ordi */}
          <div className="flex-1 min-w-0 order-2 md:flex-none md:w-auto md:flex-1 mx-1 md:mx-2 max-w-xl">
            <Input
              placeholder="Tx hash..."
              className="w-full h-9 md:h-10 text-xs md:text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            />
          </div>

          {/* 3. Réglages / Thème - Aligné à droite (order-3 ou order-4 selon la taille) */}
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

          {/* 4. Action buttons (scrollable on mobile) */}
          {/* Sur mobile on les mets en bas (order-4), sur ordi on les remonte au milieu (order-3) */}
          <div className="order-4 md:order-3 w-full md:w-auto md:flex-1 flex items-center justify-start md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide pt-3 md:pt-0 border-t md:border-t-0 border-gray-100/50 dark:border-gray-800/50 md:border-none mt-1 md:mt-0">
            {/* Console Trigger */}
            <button
              onClick={() => setIsConsoleOpen(true)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-1"
              title="Open Console"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors px-2 lg:px-3">
              <svg className="w-4 h-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="hidden lg:inline">Load</span>
            </Button>
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
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors px-2 lg:px-3">
              <svg className="w-4 h-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden lg:inline">Import</span>
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

      {/* ========== MAIN CONTENT ========== */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ===== LEFT COLUMN (3/12 on LG, 4/12 on MD) ===== */}
          <div className={cn(
            "space-y-4 transition-all duration-300 relative",
            leftCollapsed ? "hidden" : "col-span-12 md:col-span-4 lg:col-span-3"
          )}>
            {/* Collapse Toggle - Floating on the Right Edge */}
            <button
              type="button"
              onClick={() => setLeftCollapsed(true)}
              title="Collapse panels"
              className="absolute z-20 h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand-500 hover:border-brand-500 transition-all flex items-center justify-center shadow-sm -right-3 top-6"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <>
              {/* Execution - Modern Panel */}
              <ExecutionPanel
                speed={speed}
                onSpeedChange={setSpeed}
                stepSize={stepSize}
                onStepSizeChange={setStepSize}
                onNext={() => next(stepSize)}
                onPrev={() => prev(stepSize)}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
              />

              {/* Filters */}
              <InstructionFilters filters={filters} onChange={handleFiltersChange} />


              {/* Breakpoints */}
              <Card title="Breakpoints">
                <div className="space-y-4">

                  {/* --- Active Breakpoints Display Area --- */}
                  {breakpoints.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                      {breakpoints.map(bp => (
                        <span key={bp.id} className={
                          cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border",
                            bp.type === "Storage" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800" :
                              bp.type === "Transient" ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800" :
                                "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                          )
                        }>
                          <span className="font-bold">{bp.type.charAt(0)}</span>
                          {bp.value.substring(0, 6)}...{bp.value.substring(bp.value.length - 4)}
                          <button onClick={() => removeBreakpoint(bp.id)} className="hover:text-red-500 rounded-full p-0.5">
                            {/* Petite croix SVG interne */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* --- Add Forms --- */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Storage (32 bytes hex)</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0x..."
                        className="h-8 text-xs flex-1"
                        value={storageInput}
                        onChange={(e) => setStorageInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBreakpoint("Storage", storageInput, setStorageInput)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Transient Storage</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0x..."
                        className="h-8 text-xs flex-1"
                        value={transientInput}
                        onChange={(e) => setTransientInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBreakpoint("Transient", transientInput, setTransientInput)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                    <p className="text-xs text-gray-500 mb-2">Memory Range</p>

                    {/* Interface avancée style Memory Range avec +/- */}
                    {/* Interface avancée style Memory Range avec +/- */}
                    <div className="flex flex-col gap-2">
                      {/* Enable Button - Full Width */}
                      <Button
                        size="sm"
                        className={cn("w-full justify-center", memoryRangeEnabled
                          ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                        )}
                        onClick={toggleMemoryRange}
                      >
                        {memoryRangeEnabled ? "Range Enabled" : "Enable Range"}
                      </Button>

                      {/* Min / Max Row */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Min Stepper */}
                        <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-1">
                          <button
                            className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                            onClick={() => setMemoryMin(Math.max(0, memoryMin - 1))}
                          >−</button>
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] text-gray-400">min</span>
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{memoryMin}</span>
                          </div>
                          <button
                            className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                            onClick={() => setMemoryMin(memoryMin + 1)}
                          >+</button>
                        </div>

                        {/* Max Stepper */}
                        <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-1">
                          <button
                            className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                            onClick={() => setMemoryMax(Math.max(memoryMin + 1, memoryMax - 1))}
                          >−</button>
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] text-gray-400">max</span>
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{memoryMax}</span>
                          </div>
                          <button
                            className="p-1 px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
                            onClick={() => setMemoryMax(memoryMax + 1)}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* J'utilise flex-wrap pour que ça passe à la ligne si c'est trop serré */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Metacall</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={metacall}
                          onChange={(e) => handleMetacallToggle(e.target.checked)}
                        />

                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Show Aliases</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={showAliases}
                          onChange={(e) => setShowAliases(e.target.checked)}
                        />

                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Skip called contract</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={skipContract}
                          onChange={(e) => setSkipContract(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          </div>


          {/* ===== CENTER COLUMN (5/12 on LG, 8/12 on MD) ===== */}
          <div className={cn(
            "col-span-12 md:col-span-8 space-y-4 transition-all duration-300 relative",
            leftCollapsed ? "lg:col-span-8" : "lg:col-span-5"
          )}>
            {/* Expand Button - Visible only when sidebar is collapsed */}
            {leftCollapsed && (
              <button
                type="button"
                onClick={() => setLeftCollapsed(false)}
                title="Expand panels"
                className="absolute z-20 h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand-500 hover:border-brand-500 transition-all flex items-center justify-center shadow-sm -left-3 top-6"
              >
                <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            {/* Opcodes - EN HAUT */}
            <Card title="Contract & OpCodes" className="h-[350px] flex flex-col">
              <ContractViewer
                code={contractCode}
                currentPc={rawState?.currentInstruction?.pc}
                isExternalContract={isExternalContract}
                externalAddress={address}
              />
            </Card>

            <Card title="Instructions">
              <TxInstrsView data={txInstrsData} />
            </Card>



          </div>

          {/* ===== RIGHT COLUMN (4/12 on LG, 12/12 on MD) ===== */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 space-y-4">
            {/* Stack */}
            <Card title="Stack">
              <StackView
                visibleStack={visibleStack}
                fullHistory={stackHistory}
                neutralItems={(() => {
                  try {
                    // Smart Slice Calculation for Neutral Items (Rest of Stack)
                    // Depends on visibleStack.previous (Red item)
                    const prevVal = visibleStack?.previous?.value;
                    let sliceIndex = 1;

                    // Safety check on stack
                    if (!stack || !Array.isArray(stack)) return [];

                    // Check for duplicate of Red item
                    if (stack.length > 1 && prevVal && stack[1]?.value === prevVal) {
                      sliceIndex = 2;
                    }

                    // Return slice of raw stack
                    return stack.slice(sliceIndex).map((item, index) => {
                      if (!item) return null;
                      return {
                        ...item,
                        label: item.label || `stack[${index + sliceIndex}]`,
                        status: 'neutral' as const
                      };
                    }).filter(Boolean) as StackItem[];
                  } catch (err) {
                    console.error("Error calculating neutralItems:", err);
                    return [];
                  }
                })()}
                className="max-h-64"
              />
            </Card>

            {/* Combined Memory & Mappings Card */}
            <Card title="Memory & Mappings">
              <div className="space-y-6">
                {/* Memory View Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Memory Segments</h4>
                  <MemoryView segments={memorySegments} className="max-h-64" />
                </div>

                {/* Separator */}
                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Mappings Section - Full Memory Mappings (like old Apollo) */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Memory Mappings</h4>
                  <MemoryMappingsView mappings={fullMemoryMappings} />
                </div>
              </div>
            </Card>

            {/* Transient Storage */}
            <Card title="Transient Storage">
              <TransientStorageView items={transientStorage} className="max-h-32" />
            </Card>

            {/* Storage */}
            <Card title="Storage">
              <StorageView items={storage} className="max-h-36" />
            </Card>

            {/* Call Context (Moved from Center to Right) */}
            <Card title="Current Call Context">
              {/* Show context for the NEXT instruction to run (usually where we are stopped) */}
              <CallContextView instr={rawState?.nextInstruction || null} showAliases={showAliases} />
            </Card>
          </div>

        </div>


        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-gray-600">
          Shortcuts: Space Run / Pause • ←/→ Step • A/D Auto
        </div>
      </main>

      <ConsoleModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />
    </div>
  );
}
