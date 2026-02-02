import Card from "../../ui-lib/components/Card"; // Adjusted path
import Button from "../../ui-lib/components/Button";
import MultiSelect from "./components/MultiSelect";

const OPCODES = [
  // I listed all possible opcodes here (ADD, SUB, etc.)
  // If you want to add one, just add it to this list
  "STOP", "ADD", "MUL", "SUB", "DIV", "SDIV", "MOD", "SMOD", "ADDMOD", "MULMOD", "EXP", "SIGNEXTEND",
  "LT", "GT", "SLT", "SGT", "EQ", "ISZERO", "AND", "OR", "XOR", "NOT", "BYTE", "SHL", "SHR", "SAR",
  "SHA3", "ADDRESS", "BALANCE", "ORIGIN", "CALLER", "CALLVALUE", "CALLDATALOAD", "CALLDATASIZE", "CALLDATACOPY",
  "CODESIZE", "CODECOPY", "GASPRICE", "EXTCODESIZE", "EXTCODECOPY", "RETURNDATASIZE", "RETURNDATACOPY", "EXTCODEHASH",
  "BLOCKHASH", "COINBASE", "TIMESTAMP", "NUMBER", "DIFFICULTY", "GASLIMIT", "CHAINID", "SELFBALANCE", "BASEFEE",
  "POP", "MLOAD", "MSTORE", "MSTORE8", "SLOAD", "SSTORE", "JUMP", "JUMPI", "PC", "MSIZE", "GAS", "JUMPDEST",
  "PUSH1", "PUSH2", "PUSH3", "PUSH4", "PUSH32", "DUP1", "DUP2", "DUP3", "DUP4", "DUP16", "SWAP1", "SWAP2", "SWAP16",
  "LOG0", "LOG1", "LOG2", "LOG3", "LOG4",
  "CREATE", "CALL", "CALLCODE", "RETURN", "DELEGATECALL", "CREATE2", "STATICCALL", "REVERT", "INVALID", "SELFDESTRUCT"
];

export interface InstructionFiltersProps {
  filters: string[];
  onChange: (filters: string[]) => void;
}

/**
 * Instruction Filters Component.
 * Allows filtering the execution trace by specific opcodes.
 * Users can select multiple opcodes from the dropdown or type custom values.
 */
export default function InstructionFilters({ filters, onChange }: InstructionFiltersProps) {
  // Function to verify if valid hex value (0x...)
  const isValidHex = (val: string) => /^0x[0-9a-fA-F]+$/.test(val);

  return (
    <Card title="Filters & Instruction Types">
      {/* MultiSelect menu like in old version, but with current theme */}
      <div className="w-full">
        {/* I use my MultiSelect component here */}
        {/* allowCustom={true} allows typing hex code (PC) manually */}
        <MultiSelect
          label="Select instructions types or PC :"
          placeholder="Type opcode or PC..."
          options={OPCODES}
          selected={filters}
          onChange={onChange}
          allowCustom={true}
          validateCustomValue={isValidHex} // Enforcing Hex format (0x123)
          className="w-full"
        />
      </div>
      {/* Clear button optional, but MultiSelect allows removing tags one by one. Keeping it if need to clear all at once. */}
      {filters.length > 0 && (
        <Button size="sm" variant="outline" className="mt-2 w-full justify-center" onClick={() => onChange([])}>Clear</Button>
      )}
    </Card>
  );
}
