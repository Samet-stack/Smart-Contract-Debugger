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

export default function App() {
  const [speed, setSpeed] = useState(40);
  const [stepSize, setStepSize] = useState(1);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false); // Console State

  // ... (rest of state)
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab | null>(null);

  // --- Breakpoints Management ---
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
  // -----------------------------

  // Mock data for Memory View (temporary data for testing) 
  const mockMemorySegments: MemorySegment[] = [
    { offset: 0, value: "128acb0880000000000000010c8668466f67bb3376c87f384688a87ff9e63de", modifiedAt: { pc: 1139, opcode: "MSTORE" } },
    { offset: 32, value: "22264a61000000000000000000000000000000000000000000000000000000", modifiedAt: { pc: 1146, opcode: "MSTORE" } },
    { offset: 64, value: "0000000100000000000000000000000000000000000000000000000000000000", modifiedAt: { pc: 1154, opcode: "MSTORE" } },
    { offset: 96, value: "10c866840000000000000000000000000000000000000000000000000000001", modifiedAt: { pc: 1193, opcode: "MSTORE" } },
    { offset: 128, value: "000276a4000000000000000000000000000000000000000000000000000000", modifiedAt: { pc: 1184, opcode: "MSTORE" } },
    { offset: 160, value: "00000a00000000000000000000000000000000000000000000000000000000", modifiedAt: { pc: 1198, opcode: "MSTORE" } },
    { offset: 192, value: "000000e0800028ab20253eada6d85fceceeea5cd3f659281410347b7e6381de6", modifiedAt: { pc: 1202, opcode: "MSTORE" } },
    { offset: 224, value: "5afa210680000000000000000000a03155acd9f75915fcc21d34035f440da7", modifiedAt: { pc: 1208, opcode: "CALLDATACOPY" } },
  ];

  // Mock data for Stack View (exemple d'instruction SHL)
  // SHL consomme 2 éléments (shift, value) et produit 1 élément (result)
  const mockStackItems: StackItem[] = [
    // Items CONSUMED by instruction (red background)
    { value: "0x00000000000000000000000000000000000000000000000000000000000000ff", label: "shift", status: "consumed" },
    { value: "0x0000000000000000000000000000000000000000000000000000000000000001", label: "value", status: "consumed" },
    // Item PRODUCED by instruction (green background)
    { value: "0x8000000000000000000000000000000000000000000000000000000000000000", label: "result", status: "produced", modifiedAt: { pc: 1117, opcode: "SHL" } },
    // NEUTRAL items (not affected)
    { value: "0x000000000000000000000000000000000000000000000000000000000000e0", status: "neutral", modifiedAt: { pc: 1073, opcode: "SWAP1" } },
    { value: "0x80000000001a869338d1db7fae0554a476a092703abdb3ef35c80e0d76d32939f", status: "neutral", modifiedAt: { pc: 1073, opcode: "SWAP1" } },
    { value: "0x0000000000000000000000000000000000000000000000000000000000000300", status: "neutral", modifiedAt: { pc: 759, opcode: "PUSH2" } },
    { value: "0x80000000001a869338d1db7fae0554a476a092703abdb3ef35c80e0d76d32939f", status: "neutral", modifiedAt: { pc: 758, opcode: "CALLDATALOAD" } },
  ];

  // Mock data for Instruction Execution (realistic data from real Apollo execution)
  const mockTxInstrs: TxInstrs = {
    ourGas: 2880,
    theirGas: 618,
    lastRunInstr: {
      number: 267,
      total: 15701,
      pc: 2368,
      opcode: "MSTORE",
      functionSelector: "swap(address,bool,int256,uint160,bytes)",
      callData: "128acb0880000000000000010c8668466f67bb3376c87f384688a87ff9e63de22264a6100000000000000000000000000000000000000000001000000000000000000000010c866840000000000000000000000000000000000000001000276a4000000000000000000000000000000000000000a00000000000000000000000000000000000000e0800028ab20253eada6d85fceceeea5cd3f659281410347b7e6381de65afa21068000000000000000000a03155acd9f75915fcc21d34035f440da7040bd3ba08800000019501",
      gas: 159198,
      gasCost: 3,
      depth: 2,
      memoryMappings: [
        { range: "[0;4]", pc: 1139, opcode: "MSTORE" },
        { range: "[4;36]", pc: 1146, opcode: "MSTORE" },
        { range: "[36;68]", pc: 1154, opcode: "MSTORE" },
        { range: "[68;100]", pc: 1193, opcode: "MSTORE" },
        { range: "[100;132]", pc: 1184, opcode: "MSTORE" },
        { range: "[132;164]", pc: 1198, opcode: "MSTORE" },
        { range: "[164;196]", pc: 1202, opcode: "MSTORE" },
        { range: "[196;420]", pc: 1208, opcode: "CALLDATACOPY" },
      ],
      memoryChanges: [{ offset: 64, size: 32 }],
      lastConditionalJump: { pc: 2308, opcode: "JUMPI", condition: "10c86684" },
    },
    nextInstrToRun: {
      number: 268,
      total: 15701,
      pc: 2369,
      opcode: "PUSH1",
      functionSelector: "swap(address,bool,int256,uint160,bytes)",
      callData: "128acb0880000000000000010c8668466f67bb3376c87f384688a87ff9e63de22264a6100000000000000000000000000000000000000000001000000000000000000000010c866840000000000000000000000000000000000000001000276a4000000000000000000000000000000000000000a00000000000000000000000000000",
      gas: 159195,
      gasCost: 3,
      depth: 2,
      memoryMappings: [
        { range: "[0;4]", pc: 1139, opcode: "MSTORE" },
        { range: "[4;36]", pc: 1146, opcode: "MSTORE" },
        { range: "[36;68]", pc: 1154, opcode: "MSTORE" },
        { range: "[68;100]", pc: 1193, opcode: "MSTORE" },
        { range: "[100;132]", pc: 1184, opcode: "MSTORE" },
        { range: "[132;164]", pc: 1198, opcode: "MSTORE" },
        { range: "[164;196]", pc: 1202, opcode: "MSTORE" },
        { range: "[196;420]", pc: 1208, opcode: "CALLDATACOPY" },
      ],
      lastConditionalJump: { pc: 2308, opcode: "JUMPI", condition: "10c86684" },
    },
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
          <div className="flex-1 min-w-0 order-2 md:flex-none md:w-150 mx-1 md:mx-2">
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
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Load</Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Load URL</Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap h-8 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Import</Button>

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
          {/* ===== LEFT COLUMN (3/12) ===== */}
          <div className="col-span-12 xl:col-span-3 space-y-4">
            {/* Execution - Modern Panel */}
            <ExecutionPanel
              speed={speed}
              onSpeedChange={setSpeed}
              stepSize={stepSize}
              onStepSizeChange={setStepSize}
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

            {/* Coverage */}
            <Card title="Coverage">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 px-3 py-2">
                <span className="text-xs text-gray-500">Covered PCs</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">0 / 0</span>
              </div>
            </Card>
          </div>

          {/* ===== CENTER COLUMN (4/12) - Reduced width to optimize space ===== */}
          <div className="col-span-12 xl:col-span-4 space-y-4">
            {/* Opcodes - EN HAUT */}
            <Card title="Contract & OpCodes" className="h-[320px] flex flex-col">
              <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-2 font-mono text-sm leading-normal">
                <div className="text-gray-600">/* Opcodes will appear here. */</div>
                <div className="text-gray-600">// Example</div>
                <div className="text-blue-400">0000 PUSH1 0x60</div>
                <div className="text-blue-400">0002 PUSH1 0x40</div>
                <div className="text-yellow-400">0004 MSTORE</div>
                <div className="text-blue-400">0005 CALLVALUE</div>
                <div className="text-purple-400">0006 DUP1</div>
                <div className="text-green-400">0007 ISZERO</div>
                <div className="text-red-400">0008 JUMPI</div>
                <div className="text-blue-400">0009 JUMPDEST</div>
                <div className="text-gray-500">...</div>
              </div>
            </Card>

            {/* TX_INSTRS - EN DESSOUS */}
            <TxInstrsView data={mockTxInstrs} />
          </div>

          {/* ===== RIGHT COLUMN (5/12) - Increased width for Stack/Memory ===== */}
          <div className="col-span-12 xl:col-span-5 space-y-4">
            {/* Stack */}
            <Card title="Stack">
              <StackView items={mockStackItems} className="max-h-64" />
            </Card>

            {/* Memory */}
            <Card title="Memory">
              <MemoryView segments={mockMemorySegments} className="max-h-64" />
            </Card>

            {/* Transient Storage */}
            <Card title="Transient Storage">
              <div className="h-24 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-3 font-mono text-xs text-cyan-600 dark:text-cyan-400">
                <div>0xab: 0x42</div>
              </div>
            </Card>

            {/* Storage */}
            <Card title="Storage">
              <div className="h-28 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-3 font-mono text-xs text-purple-600 dark:text-purple-400">
                <div>0x00: 0x0</div>
                <div>0x01: 0xdead</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-gray-600">
          Shortcuts: Space Run/Pause • ←/→ Step • A/D Auto
        </div>
      </main>

      <ConsoleModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />
    </div>
  );
}
