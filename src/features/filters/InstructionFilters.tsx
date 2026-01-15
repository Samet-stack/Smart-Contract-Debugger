import { useState } from "react";
import Card from "../../ui-lib/components/Card"; // Adjusted path
import Button from "../../ui-lib/components/Button";
import MultiSelect from "./components/MultiSelect";

const OPCODES = [
  // J'ai mis ici tous les codes possibles (ADD, SUB, etc.)
  // Si tu veux en ajouter un, tu le rajoutes juste dans cette liste
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

export default function InstructionFilters() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  return (
    <Card title="Filtres & Types d'instructions">
      {/* Menu MultiSelect comme sur l'ancienne version, mais avec le thème actuel */}
      <div className="w-full">
        {/* J'utilise mon composant MultiSelect ici */}
        {/* allowCustom={true} permet de taper un code hex (PC) à la main */}
        <MultiSelect
          label="Select instructions types or PC :"
          placeholder="Type opcode or PC..."
          options={OPCODES}
          selected={selectedFilters}
          onChange={setSelectedFilters}
          allowCustom={true}
          className="w-full"
        />
      </div>
      {/* Bouton Effacer optionnel, mais MultiSelect permet de supprimer les tags un par un. Je le garde si besoin de tout clear d'un coup. */}
      {selectedFilters.length > 0 && (
        <Button size="sm" variant="outline" className="mt-2 w-full justify-center" onClick={() => setSelectedFilters([])}>Effacer</Button>
      )}
    </Card>
  );
}
