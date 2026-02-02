import React from "react";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";

export default function ApolloDebugger() {
    return (
        <>
            <PageMeta
                title="Apollo v2 | EVM Debugger"
                description="Advanced EVM Debugger Interface"
            />

            {/* Top Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-4">
                    {/* We simulate the Logo/Title from the screenshot on the left if needed, 
               but AppHeader usually handles the logo. 
               We focus on the Input + Buttons bar. */}
                    <div className="grow">
                        <Input
                            type="text"
                            placeholder="Transaction hash..."
                            className="w-full bg-gray-900 border-gray-700 text-gray-200"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                            Charger
                        </Button>
                        <Button size="sm" variant="outline" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                            Charger depuis une URL
                        </Button>
                        <Button size="sm" variant="outline" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                            Importer des fichiers
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-orange-400 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                            Prêt
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">

                {/* ================= LEFT COLUMN (3/12) ================= */}
                <div className="col-span-12 xl:col-span-3 space-y-6">

                    {/* Execution Panel */}
                    <ComponentCard title="Exécution">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Button size="sm" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Run</Button>
                            <Button size="sm" variant="outline">Prev</Button>
                            <Button size="sm" variant="outline">Next</Button>
                            <Button size="sm" variant="outline">Auto-Prev</Button>
                        </div>

                        <div className="mb-4">
                            <Button size="sm" variant="outline" className="w-full justify-center">Auto-Next</Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Auto-play speed</span>
                                </div>
                                <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">40%</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Step size</span>
                                    <input type="number" value="1" className="w-10 bg-gray-900 border border-gray-700 rounded text-center text-xs p-1" readOnly />
                                </div>
                            </div>
                        </div>
                    </ComponentCard>

                    {/* Filters Panel */}
                    <ComponentCard title="Filtres & Types d'instructions">
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="grow justify-center">Select by PC</Button>
                            <Button size="sm" variant="outline" className="grow justify-center">Ajouter</Button>
                        </div>
                        <div className="mt-2">
                            <Button size="sm" variant="outline" className="w-full justify-center">Effacer</Button>
                        </div>
                    </ComponentCard>

                    {/* Breakpoints Panel */}
                    <ComponentCard title="Breakpoints">
                        <div className="space-y-4">
                            {/* Storage Slot */}
                            <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/50">
                                <p className="text-xs text-gray-400 mb-2">Sur Storage slot change</p>
                                <Button size="sm" variant="outline" className="mb-2">Activer</Button>
                                <Input placeholder="Storage key (32 bytes hex)" className="h-8 text-xs" />
                            </div>

                            {/* Transient Slot */}
                            <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/50">
                                <p className="text-xs text-gray-400 mb-2">Sur Transient storage change</p>
                                <Button size="sm" variant="outline" className="mb-2">Activer</Button>
                                <Input placeholder="Transient key" className="h-8 text-xs" />
                            </div>

                            {/* Checkboxes */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs text-gray-400">
                                    <input type="checkbox" className="rounded border-gray-700 bg-gray-800" /> Metacall
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-400">
                                    <input type="checkbox" className="rounded border-gray-700 bg-gray-800" /> Allias
                                </label>
                            </div>
                        </div>
                    </ComponentCard>

                    {/* Coverage Panel */}
                    <ComponentCard title="Couverture">
                        <div className="flex justify-between items-center p-2 rounded bg-gray-900 border border-gray-800">
                            <span className="text-xs text-gray-400">PC couverts</span>
                            <span className="text-xs font-mono text-gray-300">0 / 0</span>
                        </div>
                    </ComponentCard>

                </div>

                {/* ================= CENTER COLUMN (5/12) ================= */}
                <div className="col-span-12 xl:col-span-5 space-y-6">

                    {/* Opcodes - The Big One */}
                    <ComponentCard title="Contrat & OpCodes" className="h-[600px] flex flex-col">
                        <div className="grow overflow-auto bg-gray-950 p-4 rounded-lg font-mono text-sm text-gray-300 border border-gray-800 leading-relaxed">
                            <div className="opacity-50">/* Les opcodes apparaitront ici. */</div>
                            <div className="opacity-50">// Exemple</div>
                            <div className="text-blue-400">0000 PUSH1 0x60</div>
                            <div className="text-blue-400">0002 PUSH1 0x40</div>
                            <div className="text-yellow-400">0004 MSTORE</div>
                            <div className="text-blue-400">0005 CALLVALUE</div>
                            <div className="text-purple-400">0006 DUP1</div>
                            <div className="text-green-400">0007 ISZERO</div>
                            <div>...</div>
                        </div>
                    </ComponentCard>

                    <div className="grid grid-cols-2 gap-6">
                        {/* TX Instrs */}
                        <ComponentCard title="TX_INSTRS">
                            <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Our gas</span>
                                    <span className="text-gray-300">0</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Their gas</span>
                                    <span className="text-gray-300">0</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Last run instr</span>
                                    <span className="text-gray-300">None</span>
                                </div>
                            </div>
                        </ComponentCard>

                        {/* Console */}
                        <ComponentCard title="Console">
                            <div className="h-32 bg-gray-950 rounded border border-gray-800"></div>
                        </ComponentCard>
                    </div>

                </div>

                {/* ================= RIGHT COLUMN (4/12) ================= */}
                <div className="col-span-12 xl:col-span-4 space-y-6">

                    {/* Stack */}
                    <ComponentCard title="Stack">
                        <div className="h-40 bg-gray-950 p-3 rounded border border-gray-800 font-mono text-xs text-green-400">
                            <div>00: 0x00</div>
                            <div>01: 0x60</div>
                            <div>02: 0x40</div>
                            <div>03: 0x89</div>
                        </div>
                    </ComponentCard>

                    {/* Memory */}
                    <ComponentCard title="Memory">
                        <div className="h-40 bg-gray-950 p-3 rounded border border-gray-800 font-mono text-xs text-gray-300">
                            <div className="mb-1"><span className="text-gray-600">0x0000:</span> 60 40 52 34 15 00 00</div>
                            <div><span className="text-gray-600">0x0010:</span> ab cd ef 01 23 45 67 89</div>
                        </div>
                    </ComponentCard>

                    {/* Transient Storage */}
                    <ComponentCard title="Transient Storage">
                        <div className="h-24 bg-gray-950 p-3 rounded border border-gray-800 font-mono text-xs text-cyan-400">
                            <div>0xab: 0x42</div>
                        </div>
                    </ComponentCard>

                    {/* Storage */}
                    <ComponentCard title="Storage">
                        <div className="h-32 bg-gray-950 p-3 rounded border border-gray-800 font-mono text-xs text-purple-400">
                            <div>0x00: 0x0</div>
                            <div>0x01: 0xdead</div>
                        </div>
                    </ComponentCard>

                </div>

            </div>

            {/* Footer Info */}
            <div className="mt-6 text-center text-xs text-gray-500">
                Raccourcis: Space Run/Pause • ←/→ Step • A/D Auto
            </div>
        </>
    );
}
