import { useState, useCallback, useRef, useEffect } from "react";

import { Panel, Group as PanelGroup, type PanelImperativeHandle } from "react-resizable-panels";
import ResizeHandle from "./ui-lib/components/ResizeHandle";
import Card from "./ui-lib/components/Card";
import ExecutionPanel from "./features/execution/ExecutionPanel";
import MemoryView from "./features/memory/MemoryView";
import StackView from "./features/stack/StackView";
import TxInstrsView from "./features/tx/TxInstrsView";
import CallContextView from "./features/tx/CallContextView";

import type { MemorySegment } from "./types/MemorySegment";
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

// --- ICONS ---
// Chevron Left (Collapse)
const IconSidebarClose = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m11 17-5-5 5-5" />
    <path d="m18 17-5-5 5-5" />
  </svg>
);

// Chevron Right (Expand)
const IconSidebarOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
);

/**
 * Main App Component.
 * Layout container that initializes `useApollo` and distributes state to child views.
 */
export default function App() {

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

    // NEW: Execution tracking
    visitedPcs,
    pcExecutionCount,

  } = useApollo();

  const [txHash, setTxHash] = useState("0xcae715cc39730aeaada34f4a405e92cb21a9d1820e7d48bee58d681fd515bae0"); // Default hash for demo

  // Sidebar Ref for Collapse/Expand
  const leftPanelRef = useRef<PanelImperativeHandle>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.matchMedia("(max-width: 1279px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1279px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isCompactLayout) {
      leftPanelRef.current?.expand();
    }
  }, [isCompactLayout]);

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
    },
  });

  // --- ADAPTERS (To match existing UI Props) ---



  // Memory Adapter
  // (Assuming memory from hook matches MemorySegment interface, which we control in state)
  const memorySegments: MemorySegment[] = memory;

  // TxInstrs Adapter (Dynamic from Hook)
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
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300 flex flex-col overflow-x-hidden">
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
      <main className="flex-1 overflow-visible relative">
        <PanelGroup orientation={isCompactLayout ? "vertical" : "horizontal"} className="h-full">

          {/* ===== LEFT COLUMN (Execution) ===== */}
          <Panel
            panelRef={leftPanelRef}
            collapsible={!isCompactLayout}
            onResize={(size) => setIsLeftCollapsed(size.inPixels === 0)}
            defaultSize={isCompactLayout ? 34 : 25}
            minSize={isCompactLayout ? 25 : 20}
            collapsedSize={0}
            className={isCompactLayout ? "flex flex-col p-3 pb-1 min-w-0 min-h-[300px]" : "flex flex-col p-4 pr-1 min-w-0"}
          >
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto overflow-x-hidden h-full pr-1 pb-4">
              <ExecutionPanel
                speed={speed}
                onSpeedChange={setSpeed}
                stepSize={stepSize}
                onStepSizeChange={setStepSize}
                onNext={() => next(stepSize)}
                onPrev={() => prev(stepSize)}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                headerAction={!isCompactLayout ? (
                  <button
                    type="button"
                    onClick={() => leftPanelRef.current?.collapse()}
                    title="Collapse sidebar"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-110 active:scale-95"
                  >
                    <IconSidebarClose className="w-5 h-5" />
                  </button>
                ) : undefined}
              />

              <InstructionFilters filters={filters} onChange={handleFiltersChange} />

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
            </div>
          </Panel>

          <ResizeHandle direction={isCompactLayout ? "vertical" : "horizontal"} />

          {/* ===== CENTER COLUMN (Code & Instructions) ===== */}
          <Panel
            defaultSize={isCompactLayout ? 36 : 45}
            minSize={isCompactLayout ? 30 : 30}
            className={isCompactLayout ? "relative min-w-0 min-h-[420px]" : "relative min-w-0"}
          >
            <PanelGroup orientation="vertical" className="h-full">

              {/* Top: Contract Viewer */}
              <Panel defaultSize={40} minSize={20} className="p-4 px-1 pb-1 min-h-[200px]">
                <Card
                  title="Contract & OpCodes"
                  className="h-full"
                  stickyHeader
                  headerStart={(!isCompactLayout && isLeftCollapsed) ? (
                    <button
                      type="button"
                      onClick={() => leftPanelRef.current?.expand()}
                      title="Expand sidebar"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      <IconSidebarOpen className="w-5 h-5" />
                    </button>
                  ) : undefined}
                >
                  <ContractViewer
                    code={contractCode}
                    currentPc={rawState?.nextInstruction?.pc}
                    isExternalContract={isExternalContract}
                    externalAddress={address}
                    visitedPcs={visitedPcs}
                    pcExecutionCount={pcExecutionCount}
                  />
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Middle: Instructions */}
              <Panel defaultSize={40} minSize={20} className="p-1 px-1 min-h-[200px]">
                <Card
                  title="Instructions"
                  className="h-full relative"
                  headerEnd={(
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {/* Playback Controls (Always visible in this layout) */}
                      <div className="inline-flex rounded-lg shadow-sm isolate">
                        <button
                          className={`relative inline-flex items-center justify-center px-2 py-1 rounded-l-lg border transition-all text-xs focus:z-10 focus:ring-2 active:scale-95
                                  ${isPlaying === 'backward'
                              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                            }`}
                          onClick={() => togglePlay('backward')}
                          title={isPlaying === 'backward' ? "Stop" : "Auto-P"}
                        >
                          {/* Icon for Auto-Prev */}
                          {isPlaying === 'backward' ? (
                            <span className="font-bold">■</span> // Stop
                          ) : (
                            <span className="font-bold">◄</span> // Auto-Prev
                          )}
                        </button>
                        <button
                          onClick={() => prev(stepSize)}
                          title="Previous"
                          className="relative inline-flex items-center justify-center px-2 py-1 -ml-px text-xs text-slate-500 bg-white border border-slate-200 rounded-r-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        >
                          Prev
                        </button>
                      </div>

                      <div className="inline-flex rounded-lg shadow-sm isolate">
                        <button
                          onClick={() => next(stepSize)}
                          title="Next"
                          className="relative inline-flex items-center justify-center px-2 py-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-l-lg hover:bg-slate-50 hover:text-slate-700 focus:z-10 focus:ring-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        >
                          Next
                        </button>
                        <button
                          className={`relative inline-flex items-center justify-center px-2 py-1 -ml-px border rounded-r-lg transition-all text-xs focus:z-10 focus:ring-2 active:scale-95
                                  ${isPlaying === 'forward'
                              ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 focus:ring-red-500/50 shadow-md z-10'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:ring-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                            }`}
                          onClick={() => togglePlay('forward')}
                          title={isPlaying === 'forward' ? "Stop" : "Auto-N"}
                        >
                          {/* Icon for Auto-Next */}
                          {isPlaying === 'forward' ? (
                            <span className="font-bold">■</span> // Stop
                          ) : (
                            <span className="font-bold">►</span> // Auto-Next
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                >
                  {/* Scrollable Container for Instructions */}
                  <div className="h-full overflow-y-auto pr-1">
                    <TxInstrsView data={txInstrsData} className="" />
                  </div>
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Bottom: Call Context */}
              <Panel defaultSize={20} minSize={10} className="p-4 px-1 pt-1 min-h-[100px]">
                <Card title="Current Call Context" className="h-full">
                  <CallContextView
                    lastInstr={txInstrsData.lastRunInstr}
                    nextInstr={txInstrsData.nextInstrToRun}
                    showAliases={showAliases}
                  />
                </Card>
              </Panel>

            </PanelGroup>
          </Panel>

          <ResizeHandle direction={isCompactLayout ? "vertical" : "horizontal"} />

          {/* ===== RIGHT COLUMN (Stack & Memory) ===== */}
          <Panel
            defaultSize={isCompactLayout ? 30 : 30}
            minSize={isCompactLayout ? 25 : 20}
            className={isCompactLayout ? "min-w-0 min-h-[320px]" : "min-w-0"}
          >
            <PanelGroup orientation="vertical" className="h-full">

              {/* Top: Stack */}
              <Panel defaultSize={30} minSize={20} className="p-4 pl-1 pb-1 min-h-[150px]">
                <Card title="Stack" className="h-full">
                  <StackView
                    visibleStack={visibleStack}
                    fullHistory={stackHistory}
                    neutralItems={(() => {
                      if (!stack || !Array.isArray(stack) || stack.length <= 1) return [];
                      const producedCount = visibleStack?.produced?.length ?? 0;
                      return stack.slice(producedCount).map((item, index) => ({
                        ...item,
                        label: item.label || `stack[${index + producedCount}]`,
                        status: 'neutral' as const
                      }));
                    })()}
                    className="h-full border-0 shadow-none"
                  />
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Middle: Memory */}
              <Panel defaultSize={35} minSize={20} className="p-1 pl-1 min-h-[150px]">
                <Card title="Memory & Mappings" className="h-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto p-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Memory Segments</h4>
                      <MemoryView segments={memorySegments} className="" />
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Memory Mappings</h4>
                      <MemoryMappingsView mappings={fullMemoryMappings} />
                    </div>
                  </div>
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Bottom: Storage */}
              <Panel defaultSize={35} minSize={20} className="p-4 pl-1 pt-1 min-h-[100px]">
                <div className="h-full flex flex-col gap-2 overflow-auto pb-4">
                  <Card title="Storage" className="flex-1 min-h-[100px]">
                    <StorageView items={storage} className="h-full border-0 shadow-none" />
                  </Card>
                  <Card title="Transient" className="flex-1 min-h-[100px]">
                    <TransientStorageView items={transientStorage} className="h-full border-0 shadow-none" />
                  </Card>
                </div>
              </Panel>

            </PanelGroup>
          </Panel>

        </PanelGroup>

        {/* Footer Info */}
        <div className="fixed bottom-0 left-0 w-full h-6 bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 hidden sm:flex items-center justify-center text-[10px] text-gray-500 z-50 pointer-events-none">
          Shortcuts: Space Run / Pause • ←/→ Step • A/D Auto
        </div>
      </main >

      <ConsoleModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />
    </div >
  );
}
