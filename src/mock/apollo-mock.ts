import type { ApolloDebuggerAPI, DebuggerState, Breakpoint, InstructionInfo } from "../types/ApolloAPI";
/**
 * MOCK ENGINE
 * Simule le comportement du moteur OCaml pour le dév React.
 */
class ApolloMock implements ApolloDebuggerAPI {
    private state: DebuggerState;
    private subscribers: ((state: DebuggerState) => void)[] = [];
    private timer: number | null = null;
    constructor() {
        this.state = this.getInitialState();
    }
    private getInitialState(): DebuggerState {
        return {
            currentStep: 0,
            totalSteps: 100,
            currentInstruction: {
                pc: 0,
                opcode: "PUSH1",
                gas: 21000,
                gasCost: 3,
                stepNumber: 0,
                totalSteps: 100,
                description: "Initial Push"
            },
            stack: [],
            memory: [],
            isLoading: false,
            error: null,
            traceId: "mock-trace-123"
        };
    }

    public loadTrace(traceData: any): void {
        console.log("📦 Mock: Trace chargée", traceData);
        this.state = this.getInitialState();
        this.notify();
    }
    public getCurrentState(): DebuggerState {
        return { ...this.state };
    }
    public next(): DebuggerState {
        console.log("▶️ Mock: Next");
        this.updateState(1);
        return this.getCurrentState();
    }
    public prev(): DebuggerState {
        console.log("◀️ Mock: Prev");
        this.updateState(-1);
        return this.getCurrentState();
    }
    public run(): void {
        console.log("⏩ Mock: Run");
        if (this.timer) return;
        this.timer = window.setInterval(() => {
            if (this.state.currentStep >= this.state.totalSteps) {
                this.pause();
            } else {
                this.next();
            }
        }, 500); // Vitesse simulée
    }
    public pause(): void {
        console.log("⏸️ Mock: Pause");
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
    public setSpeed(speed: number): void {
        console.log(`Mock: Vitesse réglée sur ${speed}`);
    }
    public setStepSize(stepSize: number): void {
        console.log(`Mock: StepSize = ${stepSize}`);
    }
    public setBreakpoint(bp: Breakpoint): void {
        console.log(`Mock: Breakpoint ajouté`, bp);
    }
    public subscribe(callback: (state: DebuggerState) => void): () => void {
        this.subscribers.push(callback);
        // Appeler immédiatement avec l'état actuel
        callback(this.getCurrentState());

        // Fonction de désabonnement
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    private getInstruction(step: number): InstructionInfo {
        return {
            pc: step * 2,
            stepNumber: step,
            totalSteps: this.state.totalSteps,
            opcode: step % 2 === 0 ? "PUSH1" : "MSTORE",
            gas: 21000 - (step * 10),
            gasCost: 3,
            description: `Instruction at step ${step}`,
            memoryMappings: [
                { range: "[0;32]", pc: 123, opcode: "MSTORE" },
                { range: "[32;64]", pc: 456, opcode: "MSTORE" }
            ],
            memoryChanges: step % 5 === 0 ? [{ offset: 0, size: 32 }] : []
        };
    }

    private updateState(direction: number) {
        const newStep = Math.max(0, Math.min(this.state.totalSteps, this.state.currentStep + direction));

        // Simuler des changements de données
        this.state.currentStep = newStep;

        // Generate Current Instruction
        this.state.currentInstruction = this.getInstruction(newStep);

        // Generate Next Instruction (peek ahead)
        if (newStep < this.state.totalSteps) {
            this.state.nextInstruction = this.getInstruction(newStep + 1);
        } else {
            this.state.nextInstruction = null;
        }

        // Simuler la stack qui bouge
        if (direction > 0) {
            this.state.stack.push({
                value: `0x${(newStep * 12345).toString(16).padStart(64, '0')}`,
                status: "produced"
            });
        } else {
            this.state.stack.pop();
        }

        // Mock Memory updates
        this.state.memory = [
            {
                offset: 0,
                value: `0x${(newStep * 999).toString(16).padStart(64, '0')}`,
                modifiedAt: { pc: newStep * 2, opcode: "MSTORE" },
                isModifiedInCurrentStep: true
            },
            {
                offset: 32,
                value: "0x0000000000000000000000000000000000000000000000000000000000000001",
                modifiedAt: { pc: 1146, opcode: "MSTORE" },
                isModifiedInCurrentStep: false
            }
        ];

        this.notify();
    }
    private notify() {

        const safeState = { ...this.state };
        this.subscribers.forEach(cb => cb(safeState));
    }
}
// Injection dans window 
// (À importer dans main.tsx UNIQUEMENT en mode dév)
if (import.meta.env.DEV) {
    window.ApolloDebugger = new ApolloMock();
    console.log("🔧 Apollo Mock Engine injected!");
}