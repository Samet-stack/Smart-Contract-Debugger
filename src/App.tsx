import { useState } from "react";

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
import InstructionFilters from "./features/filters/InstructionFilters"; // Nouveau composant Feature
import SettingsMenu, { type SettingsTab } from "./features/settings/SettingsMenu";
import SettingsModals from "./features/settings/SettingsModals";

import ConsoleModal from "./features/console/ConsoleModal"; // Import ConsoleModal
import MemoryMappingsView from "./features/memory/MemoryMappingsView"; // Import MemoryMappingsView

import { useApollo } from "./hooks/useApollo";   // Import Hook

export default function App() {
  const [speed, setSpeed] = useState(40);
  const [stepSize, setStepSize] = useState(1);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false); // Console State


  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab | null>(null);

  // --- HOOK INTEGRATION ---
  const {
    status,
    stack,
    memory,
    currentStep,
    currentOpcode,
    rawState,
    next,
    prev,
    setBreakpoint
  } = useApollo();

  // --- ADAPTERS (To match existing UI Props) ---

  // Stack Adapter
  const stackItems: StackItem[] = stack.map((item, index) => ({
    value: item.value,
    label: item.label || `stack[${index}]`, // Fallback label
    status: item.status,
    modifiedAt: item.modifiedAt
  }));

  // Memory Adapter
  // (Assuming memory from hook matches MemorySegment interface, which we control in state)
  const memorySegments: MemorySegment[] = memory;

  // TxInstrs Adapter (Dynamic from Hook)
  const txInstrsData: TxInstrs = {
    // Fake Gas data for now (or derive if available in rawState later)
    ourGas: rawState?.currentInstruction?.gas || 0,
    theirGas: 1000,
    lastRunInstr: rawState?.currentInstruction ? {
      number: rawState.currentInstruction.stepNumber,
      total: rawState.totalSteps,
      pc: rawState.currentInstruction.pc,
      opcode: currentOpcode || "UNKNOWN",
      gas: rawState.currentInstruction.gas,
      gasCost: rawState.currentInstruction.gasCost,
      memoryMappings: rawState.currentInstruction.memoryMappings || [],
      memoryChanges: rawState.currentInstruction.memoryChanges || [],
      // For now, placeholders for detailed fields not yet in DebuggerState
      functionSelector: "swap(...)",
      callData: "0x...",
    } : null,
    nextInstrToRun: null // Simple view: current is last run
  };


  type BreakpointType = "Storage" | "Transient" | "Memory";

  interface Breakpoint {
    id: string;
    type: BreakpointType;
    value: string;
    min?: string;
    max?: string;
  }

  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [storageInput, setStorageInput] = useState("");
  const [transientInput, setTransientInput] = useState("");
  const [memoryMin, setMemoryMin] = useState<number>(0);
  const [memoryMax, setMemoryMax] = useState<number>(32);
  const [memoryRangeEnabled, setMemoryRangeEnabled] = useState(false);
  const [metacall, setMetacall] = useState(false);
  const [alias, setAlias] = useState(false);
  const [skipContract, setSkipContract] = useState(false);

  const addBreakpoint = (type: BreakpointType, inputValue: string, setInput: (v: string) => void) => {
    if (!inputValue) return;
    if (!/^0x[0-9a-fA-F]+$/.test(inputValue)) {
      alert("Invalid format! Must start with 0x...");
      return;
    }
    const newBp: Breakpoint = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      value: inputValue
    };

    // Call Hook Action
    setBreakpoint({
      id: newBp.id,
      type: newBp.type,
      value: newBp.value,
      enabled: true
    });

    setBreakpoints([...breakpoints, newBp]);
    setInput("");
  };

  const toggleMemoryRange = () => {
    const newState = !memoryRangeEnabled;
    setMemoryRangeEnabled(newState);
    if (newState) {
      const newBp: Breakpoint = {
        id: Date.now().toString() + Math.random().toString(),
        type: "Memory",
        value: `[${memoryMin};${memoryMax}]`,
        min: memoryMin.toString(),
        max: memoryMax.toString()
      };
      setBreakpoints([...breakpoints, newBp]);
    } else {
      setBreakpoints(breakpoints.filter(bp => bp.type !== "Memory"));
    }
  };

  const removeBreakpoint = (id: string) => {
    setBreakpoints(breakpoints.filter(bp => bp.id !== id));
  };



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
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors px-2 lg:px-3">
              <svg className="w-4 h-4 lg:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="hidden lg:inline">Load URL</span>
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
          <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4">
            {/* Execution - Modern Panel */}
            <ExecutionPanel
              speed={speed}
              onSpeedChange={setSpeed}
              stepSize={stepSize}
              onStepSizeChange={setStepSize}
              onNext={next}
              onPrev={prev}
            />

            {/* Filters */}
            <InstructionFilters />

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
                        onChange={(e) => setMetacall(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Alias</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={alias}
                        onChange={(e) => setAlias(e.target.checked)}
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

          </div>

          {/* ===== CENTER COLUMN (5/12 on LG, 8/12 on MD) ===== */}
          <div className="col-span-12 md:col-span-8 lg:col-span-5 space-y-4">
            {/* Opcodes - EN HAUT */}
            <Card title="Contract & OpCodes" className="h-[500px] flex flex-col">
              <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-2 font-mono text-sm leading-normal">
                <div className="text-gray-600">/* Opcodes will appear here. */</div>
                <div className="text-blue-400">0000 PUSH1 0x80</div>
                <div className="text-blue-400">0002 PUSH1 0x40</div>
                <div className="text-yellow-400">0004 MSTORE</div>
                <div className="text-red-400">PUSH32 0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2</div>
                <div className="text-blue-400">0005 CALLVALUE</div>
                <div className="text-purple-400">0006 DUP1</div>
                <div className="text-green-400">0007 ISZERO</div>
                <div className="text-blue-400">0008 PUSH2 0x0010</div>
                <div className="text-red-400">000B JUMPI</div>
                <div className="text-blue-400">000C PUSH1 0x00</div>
                <div className="text-purple-400">000E DUP1</div>
                <div className="text-red-400">000F REVERT</div>
                <div className="text-blue-400">0010 JUMPDEST</div>
                <div className="text-purple-400">0011 POP</div>
                <div className="text-blue-400">0012 PUSH1 0x04</div>
                <div className="text-purple-400">0014 CALLDATASIZE</div>
                <div className="text-gray-400">0015 LT</div>
                <div className="text-blue-400">0016 PUSH2 0x0036</div>
                <div className="text-red-400">0019 JUMPI</div>
                <div className="text-blue-400">001A PUSH1 0x00</div>
                <div className="text-purple-400">001C CALLDATALOAD</div>
                <div className="text-blue-400">001D PUSH1 0xe0</div>
                <div className="text-gray-400">001F SHR</div>
                <div className="text-purple-400">0020 DUP1</div>
                <div className="text-blue-400">0021 PUSH4 0x10c86684</div>
                <div className="text-gray-400">0026 EQ</div>
                <div className="text-blue-400">0027 PUSH2 0x003b</div>
                <div className="text-red-400">002A JUMPI</div>
                <div className="text-blue-400">002B JUMPDEST</div>
                <div className="text-blue-400">002C PUSH1 0x00</div>
                <div className="text-purple-400">002E DUP1</div>
                <div className="text-red-400">002F REVERT</div>
                <div className="text-blue-400">0030 JUMPDEST</div>
                <div className="text-blue-400">0031 PUSH2 0x005a</div>
                <div className="text-blue-400">0034 PUSH2 0x0047</div>
                <div className="text-red-400">0037 JUMP</div>
                <div className="text-gray-500">...</div>
              </div>
            </Card>

            <Card title="Instructions">
              <TxInstrsView data={txInstrsData} />
            </Card>
          </div>

          {/* ===== RIGHT COLUMN (4/12 on LG, 12/12 on MD) ===== */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 space-y-4">
            {/* Stack */}
            <Card title="Stack">
              <StackView items={stackItems} className="max-h-64" />
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

                {/* Mappings Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Active Mappings</h4>
                  <MemoryMappingsView mappings={txInstrsData.lastRunInstr?.memoryMappings || []} />
                </div>
              </div>
            </Card>

            {/* Transient Storage */}
            <Card title="Transient Storage">
              <div className="h-24 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3 font-mono text-xs text-cyan-600 dark:text-cyan-400">
                <div>0xab: 0x42</div>
              </div>
            </Card>

            {/* Storage */}
            <Card title="Storage">
              <div className="h-28 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3 font-mono text-xs text-purple-600 dark:text-purple-400">
                <div>0x00: 0x0</div>
                <div>0x01: 0xdead</div>
              </div>
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
