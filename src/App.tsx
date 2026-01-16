import { useState } from "react";
import Button from "./ui-lib/components/Button";
import Input from "./ui-lib/components/Input";
import Card from "./ui-lib/components/Card";
import ThemeToggle from "./ui-lib/components/ThemeToggle";
import SettingsButton from "./ui-lib/components/SettingsButton";
import RangeInput from "./ui-lib/components/RangeInput";
import MemoryView from "./features/memory/MemoryView";
import StackView from "./features/stack/StackView";
import TxInstrsView from "./features/tx/TxInstrsView";
import type { MemorySegment } from "./types/MemorySegment";
import type { StackItem } from "./types/StackItem";
import type { TxInstrs } from "./types/TxInstrs";

export default function App() {
  const [speed, setSpeed] = useState(40);

  // Mock data for Memory View (données temporaires pour tester)  j'ai mis des données pour tester juste l'affichage en résultat 
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
    // Éléments CONSOMMÉS par l'instruction (fond rouge)
    { value: "0x00000000000000000000000000000000000000000000000000000000000000ff", label: "shift", status: "consumed" },
    { value: "0x0000000000000000000000000000000000000000000000000000000000000001", label: "value", status: "consumed" },
    // Élément PRODUIT par l'instruction (fond vert)
    { value: "0x8000000000000000000000000000000000000000000000000000000000000000", label: "result", status: "produced", modifiedAt: { pc: 1117, opcode: "SHL" } },
    // Éléments NEUTRES (pas affectés)
    { value: "0x000000000000000000000000000000000000000000000000000000000000e0", status: "neutral", modifiedAt: { pc: 1073, opcode: "SWAP1" } },
    { value: "0x80000000001a869338d1db7fae0554a476a092703abdb3ef35c80e0d76d32939f", status: "neutral", modifiedAt: { pc: 1073, opcode: "SWAP1" } },
    { value: "0x0000000000000000000000000000000000000000000000000000000000000300", status: "neutral", modifiedAt: { pc: 759, opcode: "PUSH2" } },
    { value: "0x80000000001a869338d1db7fae0554a476a092703abdb3ef35c80e0d76d32939f", status: "neutral", modifiedAt: { pc: 758, opcode: "CALLDATALOAD" } },
  ];

  // Mock data for TX_INSTRS (données réalistes du vrai Apollo que j'ai exécute)
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
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80 transition-colors duration-300">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">Apollo</span>
              <span className="ml-2 text-gray-500">EVM Debugger</span>
            </div>
          </div>

          {/* Search + Actions */}
          <div className="flex flex-1 items-center gap-3 max-w-3xl">
            <Input placeholder="Transaction hash..." className="flex-1" />
            <Button variant="outline">Charger</Button>
            <Button variant="outline">Charger depuis une URL</Button>
            <Button variant="outline">Importer des fichiers</Button>
            <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-400"></span>
              Prêt
            </div>
          </div>

          {/* Theme Toggle & Settings */}
          <div className="flex items-center gap-2">
            <SettingsButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ===== LEFT COLUMN (3/12) ===== */}
          <div className="col-span-12 xl:col-span-3 space-y-4">
            {/* Execution */}
            <Card title="Exécution">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" variant="success">Run</Button>
                <Button size="sm" variant="outline">Prev</Button>
                <Button size="sm" variant="outline">Next</Button>
                <Button size="sm" variant="outline">Auto-Prev</Button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Auto-Next</p>
                  <Button size="sm" variant="outline" className="w-full justify-center">Auto-Next</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Auto-play speed</p>
                  <RangeInput value={speed} onChange={setSpeed} />
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{speed}%</span>
                  <div className="flex items-center gap-2">
                    <span>Step size</span>
                    <input type="number" defaultValue="1" className="w-12 rounded border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-2 py-1 text-center text-xs text-gray-700 dark:text-gray-300" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card title="Filtres & Types d'instructions">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 justify-center">Select by PC</Button>
                <Button size="sm" variant="outline" className="flex-1 justify-center">Ajouter</Button>
              </div>
              <Button size="sm" variant="outline" className="mt-2 w-full justify-center">Effacer</Button>
            </Card>

            {/* Breakpoints */}
            <Card title="Breakpoints">
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                  <p className="text-xs text-gray-500 mb-2">Sur Storage slot change</p>
                  <Button size="sm" variant="outline" className="mb-2">Activer</Button>
                  <Input placeholder="Storage key (32 bytes hex)" className="h-8 text-xs" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                  <p className="text-xs text-gray-500 mb-2">Sur Transient storage slot change</p>
                  <Button size="sm" variant="outline" className="mb-2">Activer</Button>
                  <Input placeholder="Transient key (32 bytes hex)" className="h-8 text-xs" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 p-3">
                  <p className="text-xs text-gray-500 mb-2">Sur Memory range change</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Activer</Button>
                    <Input placeholder="min" className="h-8 text-xs flex-1" />
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800" /> Metacall
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800" /> Allias
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" className="rounded border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800" /> Skip called contract
                </label>
              </div>
            </Card>

            {/* Coverage */}
            <Card title="Couverture">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 px-3 py-2">
                <span className="text-xs text-gray-500">PC couverts</span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">0 / 0</span>
              </div>
            </Card>
          </div>

          {/* ===== CENTER COLUMN (5/12) ===== */}
          <div className="col-span-12 xl:col-span-5 space-y-4">
            {/* Opcodes - EN HAUT */}
            <Card title="Contrat & OpCodes" className="h-[400px] flex flex-col">
              <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-4 font-mono text-sm leading-relaxed">
                <div className="text-gray-600">/* Les opcodes apparaitront ici. */</div>
                <div className="text-gray-600">// Exemple</div>
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

            {/* Console */}
            <Card title="Console">
              <div className="h-32 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-3 font-mono text-xs text-gray-500">
                <div className="text-gray-400">&gt; Waiting for transaction...</div>
              </div>
            </Card>
          </div>

          {/* ===== RIGHT COLUMN (4/12) ===== */}
          <div className="col-span-12 xl:col-span-4 space-y-4">
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
          Raccourcis: Space Run/Pause • ←/→ Step • A/D Auto
        </div>
      </main>
    </div>
  );
}
