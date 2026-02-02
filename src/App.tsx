import { useState, useCallback, useRef } from "react";
import { cn } from "./ui-lib/utils/cn";
import Card from "./ui-lib/components/Card";
import ExecutionPanel from "./features/execution/ExecutionPanel";
import MemoryView from "./features/memory/MemoryView";
import StackView from "./features/stack/StackView";
import TxInstrsView from "./features/tx/TxInstrsView";
import CallContextView from "./features/tx/CallContextView";

import type { MemorySegment } from "./types/MemorySegment";
import type { StackItem } from "./types/StackItem";
import type { TxInstrs } from "./types/TxInstrs";
import type { Breakpoint } from "./types/ApolloAPI";
import InstructionFilters from "./features/filters/InstructionFilters";

import Header from "./features/layout/Header";
import BreakpointManager from "./features/breakpoints/BreakpointManager";
import type { BreakpointType } from "./types/DebuggerTypes";
import { type SettingsTab } from "./features/settings/SettingsMenu";

import ConsoleModal from "./features/console/ConsoleModal";
import MemoryMappingsView from "./features/memory/MemoryMappingsView";
import ContractViewer from "./features/contract/ContractViewer";

import { useApollo } from "./hooks/useApollo";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

import StorageView from "./features/storage/StorageView";
import TransientStorageView from "./features/storage/TransientStorageView";

// CALL-type opcodes for Metacall breakpoint
const METACALL_OPCODES = ["CALL", "STATICCALL", "DELEGATECALL", "CALLCODE", "CREATE", "CREATE2"];

/**
 * Main App Component.
 * Layout container that initializes `useApollo` and distributes state to child views.
 */
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


  const [memoryMin, setMemoryMin] = useState<number>(0);
  const [memoryMax, setMemoryMax] = useState<number>(32);
  const [metacall, setMetacall] = useState(false);
  const [showAliases, setShowAliases] = useState(true);

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
      <Header
        txHash={txHash}
        setTxHash={setTxHash}
        handleLoad={handleLoad}
        status={status}
        settingsMenuOpen={settingsMenuOpen}
        setSettingsMenuOpen={setSettingsMenuOpen}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
      />

      {/* ========== MAIN CONTENT ========== */}
      {/* 
        Grid Layout:
        - MD: 12 columns
        - LG: 12 columns
      */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
          {/* ===== LEFT COLUMN (3/12 on LG, 4/12 on MD) ===== */}
          <div className={cn(
            "space-y-4 transition-all duration-300 relative",
            leftCollapsed ? "hidden" : "col-span-12 md:col-span-4 lg:col-span-3"
          )}>
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
                headerAction={(
                  <button
                    type="button"
                    onClick={() => setLeftCollapsed(true)}
                    title="Collapse panels"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border",
                      "bg-white/90 text-gray-700 border-gray-200 shadow-sm",
                      "hover:bg-white hover:text-gray-900 hover:border-gray-300",
                      "dark:bg-gray-900/80 dark:text-gray-200 dark:border-gray-700 dark:hover:border-gray-600",
                      "px-3 py-1.5 text-sm font-bold tracking-wide transition-all"
                    )}
                  >
                    <span className="text-sm font-bold">{`<<`}</span>
                  </button>
                )}
              />

              {/* Filters */}
              <InstructionFilters filters={filters} onChange={handleFiltersChange} />


              {/* Breakpoints */}
              <BreakpointManager
                breakpoints={breakpoints}
                addBreakpoint={addBreakpoint}
                removeBreakpoint={removeBreakpoint}
                toggleMemoryRange={toggleMemoryRange}
                memoryRangeEnabled={memoryRangeEnabled}
                memoryMin={memoryMin}
                setMemoryMin={setMemoryMin}
                memoryMax={memoryMax}
                setMemoryMax={setMemoryMax}
                metacall={metacall}
                handleMetacallToggle={handleMetacallToggle}
                showAliases={showAliases}
                setShowAliases={setShowAliases}
                skipContract={skipContract}
                setSkipContract={setSkipContract}
              />
            </>
          </div>


          {/* ===== CENTER COLUMN (5/12 on LG, 8/12 on MD) ===== */}
          <div className={cn(
            "col-span-12 md:col-span-8 transition-all duration-300 relative",
            leftCollapsed ? "lg:col-span-6 space-y-3" : "lg:col-span-5 space-y-4"
          )}>
            {/* Expand Button - Visible only when sidebar is collapsed */}
            {leftCollapsed && (
              <div className="flex items-center justify-start px-1">
                <button
                  type="button"
                  onClick={() => setLeftCollapsed(false)}
                  title="Expand panels"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border",
                    "bg-white/90 text-gray-700 border-gray-200 shadow-lg backdrop-blur",
                    "hover:bg-white hover:text-gray-900 hover:border-gray-300",
                    "dark:bg-gray-900/80 dark:text-gray-200 dark:border-gray-700 dark:hover:border-gray-600",
                    "px-3.5 py-1.5 text-sm font-bold tracking-wide transition-all"
                  )}
                >
                  <span className="text-sm font-bold">{`>>`}</span>
                </button>
              </div>
            )}

            {/* Side-by-Side Grid when collapsed: Execution Left | OpCodes Right */}
            <div className="flex flex-col gap-4">


              {/* OpCodes (Right Cell in Grid, or Full Width if not collapsed) */}
              <Card
                title="Contract & OpCodes"
                className={cn(
                  "flex flex-col",
                  leftCollapsed
                    ? "h-[260px] overflow-hidden [&>div:first-child]:py-2 [&>div:first-child]:px-3 [&>div:last-child]:p-3"
                    : "h-[350px]"
                )}
              >
                <ContractViewer
                  code={contractCode}
                  currentPc={rawState?.nextInstruction?.pc}
                  isExternalContract={isExternalContract}
                  externalAddress={address}
                />
              </Card>
            </div>

            <Card
              title="Instructions"
              className={cn(
                "relative",
                leftCollapsed && "h-[300px] overflow-hidden [&>div:first-child]:py-2 [&>div:first-child]:px-3 [&>div:last-child]:p-3 [&>div:last-child]:overflow-auto"
              )}
              headerEnd={
                leftCollapsed && (
                  <div className="flex items-center gap-2">
                    {/* Left Group: Backwards */}
                    <div className="inline-flex rounded-lg shadow-sm isolate">
                      <button
                        className={`relative inline-flex items-center justify-center px-2.5 py-1.5 rounded-l-lg border transition-all duration-200 focus:z-10 focus:ring-2 active:scale-95
                                ${isPlaying === 'backward'
                            ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                          }`}
                        onClick={() => togglePlay('backward')}
                        title={isPlaying === 'backward' ? "Stop" : "Auto-Previous (P)"}
                      >
                        {/* Icons inline to avoid extra component imports */}
                        {isPlaying === 'backward' ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="1" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg>
                        )}
                      </button>
                      <button
                        onClick={() => prev(stepSize)}
                        title="Previous Instruction"
                        className="relative inline-flex items-center justify-center px-2.5 py-1.5 -ml-px text-slate-500 bg-white border border-slate-200 rounded-r-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-primary-500/50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all duration-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                    </div>

                    {/* Right Group: Forwards */}
                    <div className="inline-flex rounded-lg shadow-sm isolate">
                      <button
                        onClick={() => next(stepSize)}
                        title="Next Instruction"
                        className="relative inline-flex items-center justify-center px-2.5 py-1.5 text-slate-500 bg-white border border-slate-200 rounded-l-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-primary-500/50 active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all duration-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button
                        className={`relative inline-flex items-center justify-center px-2.5 py-1.5 -ml-px border rounded-r-lg transition-all duration-200 focus:z-10 focus:ring-2 active:scale-95
                                ${isPlaying === 'forward'
                            ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                          }`}
                        onClick={() => togglePlay('forward')}
                        title={isPlaying === 'forward' ? "Stop" : "Auto-Next (N)"}
                      >
                        {isPlaying === 'forward' ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="1" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              }
            >
              <TxInstrsView data={txInstrsData} className={leftCollapsed ? "space-y-4" : ""} />
            </Card>

            {/* Call Context (Moved from Right to Center) */}
            <Card
              title="Current Call Context"
              className={cn(
                leftCollapsed && "h-[180px] overflow-hidden [&>div:first-child]:py-2 [&>div:first-child]:px-3 [&>div:last-child]:p-2 [&>div:last-child]:overflow-auto"
              )}
            >
              {/* Show context for BOTH last and next instructions, to mirror the instructions view */}
              <CallContextView
                lastInstr={txInstrsData.lastRunInstr}
                nextInstr={txInstrsData.nextInstrToRun}
                showAliases={showAliases}
              />
            </Card>



          </div>

          {/* ===== RIGHT COLUMN (4/12 on LG, 12/12 on MD) ===== */}
          <div className={cn(
            "col-span-12 md:col-span-12 space-y-4",
            leftCollapsed ? "lg:col-span-6" : "lg:col-span-4"
          )}>
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
