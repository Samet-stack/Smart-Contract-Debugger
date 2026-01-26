export interface Apollo {
  load_transaction(arg: load_transaction_arg): Promise<transaction_info>;
}

declare global {
  var Apollo: Apollo;
}

export interface load_transaction_arg {
  node_url: string;
  tx_hash: string;
}

export interface transaction_info {
  transaction: transaction;
  code: Array<instr>;
  trace: Array<log_tree>;
  trace_iterator: trace_iterator;
  log_map: Map<log_id, log_infos>;
}

export interface transaction {
  info: info;
  receipt: receipt;
}

export interface info {
  hash: string;
  dst: string;
  gas: bigint;
}

export interface receipt {
  gas_used: bigint;
  transaction_index: number;
  block_hash: string;
}

export type pc = number

export interface instr {
  pc: pc;
  op: string;
  arg?: string;
}

export type log_id = number;

export type log_tree =
  | { Instr: log_infos }
  | {
    Call: {
      call_log: log_infos;
      call_instrs: Array<log_tree>
    }
  }

export interface log_infos {
  next_instr: log_instr;
  depth: number;
  address: string;
  remaining_gas: bigint;
  gas_used: gas_used;
  exec_state: exec_state;
  call_data?: memory;
  callee_return_data?: memory;
  caller_return_data?: memory;
  selector?: ArrayBuffer;
  last_conditional_jump?: pc;
}

export interface log_instr {
  pc: pc
  op: string;
  gas_cost: bigint;
  stack_args: stack_input;
  stack_output: stack_output;
  memory_update: Array<memory_changes>;
  storage_update?: storage_changes;
  transient_storage_update?: transient_storage_changes;
  return_data: string;
}

export interface gas_used {
  main_contract: bigint;
  other_contracts: bigint;
}

export interface exec_state {
  stack: stack;
  memory: memory;
  storage: storage;
  transient_storage: transient_storage;
}

export type stack = Array<{ value: string; log_id: log_id }>

export type stack_input =
  | { ADD: { a: string; b: string } }
  | { MUL: { a: string; b: string } }
  | { SUB: { a: string; b: string } }
  | { DIV: { a: string; b: string } }
  | { SDIV: { a: string; b: string } }
  | { MOD: { a: string; b: string } }
  | { SMOD: { a: string; b: string } }
  | { ADDMOD: { a: string; b: string; n: string } }
  | { MULMOD: { a: string; b: string; n: string } }
  | { EXP: { a: string; exponent: string } }
  | { SIGNEXTEND: { b: string; x: string } }
  | { LT: { a: string; b: string } }
  | { GT: { a: string; b: string } }
  | { SLT: { a: string; b: string } }
  | { SGT: { a: string; b: string } }
  | { EQ: { a: string; b: string } }
  | { ISZERO: { a: string } }
  | { AND: { a: string; b: string } }
  | { OR: { a: string; b: string } }
  | { XOR: { a: string; b: string } }
  | { NOT: { a: string } }
  | { BYTE: { i: string; x: string } }
  | { SHL: { shift: string; value: string } }
  | { SHR: { shift: string; value: string } }
  | { SAR: { shift: string; value: string } }
  | { KECCAK256: { offset: string; size: string } }
  | { BALANCE: { address: string } }
  | { CALLDATALOAD: { i: string } }
  | { CALLDATACOPY: { destOffset: string; offset: string; size: string } }
  | { CODECOPY: { destOffset: string; offset: string; size: string } }
  | { EXTCODESIZE: { address: string } }
  | { EXTCODECOPY: { address: string; destOffset: string; offset: string; size: string } }
  | { RETURNDATACOPY: { destOffset: string; offset: string; size: string } }
  | { EXTCODEHASH: { address: string } }
  | { BLOCKHASH: { blockNumber: string } }
  | { BLOBHASH: { index: string } }
  | { POP: { y: string } }
  | { MLOAD: { offset: string } }
  | { MSTORE: { offset: string; value: string } }
  | { MSTORE8: { offset: string; value: string } }
  | { SLOAD: { key: string } }
  | { SSTORE: { key: string; value: string } }
  | { JUMP: { counter: string } }
  | { JUMPI: { counter: string; b: string } }
  | { TLOAD: { key: string } }
  | { TSTORE: { key: string; value: string } }
  | { MCOPY: { destOffset: string; offset: string; size: string } }
  | { DUP1: { value: string } }
  | { DUP2: { value: string } }
  | { DUP3: { value: string } }
  | { DUP4: { value: string } }
  | { DUP5: { value: string } }
  | { DUP6: { value: string } }
  | { DUP7: { value: string } }
  | { DUP8: { value: string } }
  | { DUP9: { value: string } }
  | { DUP10: { value: string } }
  | { DUP11: { value: string } }
  | { DUP12: { value: string } }
  | { DUP13: { value: string } }
  | { DUP14: { value: string } }
  | { DUP15: { value: string } }
  | { DUP16: { value: string } }
  | { SWAP1: { a: string; b: string } }
  | { SWAP2: { a: string; b: string } }
  | { SWAP3: { a: string; b: string } }
  | { SWAP4: { a: string; b: string } }
  | { SWAP5: { a: string; b: string } }
  | { SWAP6: { a: string; b: string } }
  | { SWAP7: { a: string; b: string } }
  | { SWAP8: { a: string; b: string } }
  | { SWAP9: { a: string; b: string } }
  | { SWAP10: { a: string; b: string } }
  | { SWAP11: { a: string; b: string } }
  | { SWAP12: { a: string; b: string } }
  | { SWAP13: { a: string; b: string } }
  | { SWAP14: { a: string; b: string } }
  | { SWAP15: { a: string; b: string } }
  | { SWAP16: { a: string; b: string } }
  | { LOG0: { offset: string; size: string } }
  | { LOG1: { offset: string; size: string; topic: string } }
  | { LOG2: { offset: string; size: string; topic1: string; topic2: string } }
  | { LOG3: { offset: string; size: string; topic1: string; topic2: string; topic3: string } }
  | { LOG4: { offset: string; size: string; topic1: string; topic2: string; topic3: string; topic4: string } }
  | { CREATE: { value: string; offset: string; size: string } }
  | { CALL: { gas: string; address: string; value: string; argsOffset: string; argsSize: string; retOffset: string; retSize: string } }
  | { CALLCODE: { gas: string; address: string; value: string; argsOffset: string; argsSize: string; retOffset: string; retSize: string } }
  | { RETURN: { offset: string; size: string } }
  | { DELEGATECALL: { gas: string; address: string; argsOffset: string; argsSize: string; retOffset: string; retSize: string } }
  | { CREATE2: { value: string; offset: string; size: string; salt: string } }
  | { STATICCALL: { gas: string; address: string; argsOffset: string; argsSize: string; retOffset: string; retSize: string } }
  | { REVERT: { offset: string; size: string } }
  | { SELFDESTRUCT: { address: string } }
  | { NOARGS: 0 }

export type stack_output =
  | { ADD: { result: string } }
  | { MUL: { result: string } }
  | { SUB: { result: string } }
  | { DIV: { result: string } }
  | { SDIV: { result: string } }
  | { MOD: { result: string } }
  | { SMOD: { result: string } }
  | { ADDMOD: { result: string } }
  | { MULMOD: { result: string } }
  | { EXP: { result: string } }
  | { SIGNEXTEND: { y: string } }
  | { LT: { result: string } }
  | { GT: { result: string } }
  | { SLT: { result: string } }
  | { SGT: { result: string } }
  | { EQ: { result: string } }
  | { ISZERO: { result: string } }
  | { AND: { result: string } }
  | { OR: { result: string } }
  | { XOR: { result: string } }
  | { NOT: { result: string } }
  | { BYTE: { y: string } }
  | { SHL: { result: string } }
  | { SHR: { result: string } }
  | { SAR: { result: string } }
  | { KECCAK256: { hash: string } }
  | { ADDRESS: { address: string } }
  | { BALANCE: { balance: string } }
  | { ORIGIN: { address: string } }
  | { CALLER: { address: string } }
  | { CALLVALUE: { value: string } }
  | { CALLDATALOAD: { data: string } }
  | { CALLDATASIZE: { size: string } }
  | { CODESIZE: { size: string } }
  | { GASPRICE: { price: string } }
  | { EXTCODESIZE: { size: string } }
  | { RETURNDATASIZE: { size: string } }
  | { EXTCODEHASH: { hash: string } }
  | { BLOCKHASH: { hash: string } }
  | { COINBASE: { address: string } }
  | { TIMESTAMP: { timestamp: string } }
  | { NUMBER: { blockNumber: string } }
  | { DIFFICULTY: { difficulty: string } }
  | { GASLIMIT: { gasLimit: string } }
  | { CHAINID: { chainId: string } }
  | { SELFBALANCE: { balance: string } }
  | { BASEFEE: { baseFee: string } }
  | { BLOBHASH: { blobVersionedHashesAtIndex: string } }
  | { BLOBBASEFEE: { blobBaseFee: string } }
  | { MLOAD: { value: string } }
  | { SLOAD: { value: string } }
  | { PC: { counter: string } }
  | { MSIZE: { size: string } }
  | { GAS: { gas: string } }
  | { TLOAD: { value: string } }
  | { PUSH0: 0 }
  | { PUSH1: { value: string } }
  | { PUSH2: { value: string } }
  | { PUSH3: { value: string } }
  | { PUSH4: { value: string } }
  | { PUSH5: { value: string } }
  | { PUSH6: { value: string } }
  | { PUSH7: { value: string } }
  | { PUSH8: { value: string } }
  | { PUSH9: { value: string } }
  | { PUSH10: { value: string } }
  | { PUSH11: { value: string } }
  | { PUSH12: { value: string } }
  | { PUSH13: { value: string } }
  | { PUSH14: { value: string } }
  | { PUSH15: { value: string } }
  | { PUSH16: { value: string } }
  | { PUSH17: { value: string } }
  | { PUSH18: { value: string } }
  | { PUSH19: { value: string } }
  | { PUSH20: { value: string } }
  | { PUSH21: { value: string } }
  | { PUSH22: { value: string } }
  | { PUSH23: { value: string } }
  | { PUSH24: { value: string } }
  | { PUSH25: { value: string } }
  | { PUSH26: { value: string } }
  | { PUSH27: { value: string } }
  | { PUSH28: { value: string } }
  | { PUSH29: { value: string } }
  | { PUSH30: { value: string } }
  | { PUSH31: { value: string } }
  | { PUSH32: { value: string } }
  | { DUP1: { value: string } }
  | { DUP2: { value: string } }
  | { DUP3: { value: string } }
  | { DUP4: { value: string } }
  | { DUP5: { value: string } }
  | { DUP6: { value: string } }
  | { DUP7: { value: string } }
  | { DUP8: { value: string } }
  | { DUP9: { value: string } }
  | { DUP10: { value: string } }
  | { DUP11: { value: string } }
  | { DUP12: { value: string } }
  | { DUP13: { value: string } }
  | { DUP14: { value: string } }
  | { DUP15: { value: string } }
  | { DUP16: { value: string } }
  | { SWAP1: { b: string; a: string } }
  | { SWAP2: { b: string; a: string } }
  | { SWAP3: { b: string; a: string } }
  | { SWAP4: { b: string; a: string } }
  | { SWAP5: { b: string; a: string } }
  | { SWAP6: { b: string; a: string } }
  | { SWAP7: { b: string; a: string } }
  | { SWAP8: { b: string; a: string } }
  | { SWAP9: { b: string; a: string } }
  | { SWAP10: { b: string; a: string } }
  | { SWAP11: { b: string; a: string } }
  | { SWAP12: { b: string; a: string } }
  | { SWAP13: { b: string; a: string } }
  | { SWAP14: { b: string; a: string } }
  | { SWAP15: { b: string; a: string } }
  | { SWAP16: { b: string; a: string } }
  | { CREATE: { address: string } }
  | { CALL: { success: string } }
  | { CALLCODE: { success: string } }
  | { DELEGATECALL: { success: string } }
  | { CREATE2: { address: string } }
  | { STATICCALL: { success: string } }
  | { NOOUTPUT: 0 }

export type memory = { value: ArrayBuffer; log_ids: Map<string, log_id> }
export type memory_changes = { offset: bigint; size: bigint; expanded: boolean }
export type storage = Map<string, { value: string; log_id?: log_id }>
export type storage_changes = { key: string; value: string; creating_slot: boolean }
export type transient_storage = Map<string, { value: string; log_id: log_id }>
export type transient_storage_changes = { key: string; value: string; creating_slot: boolean }

export interface trace_iterator {
  current_log(): log_infos | undefined
  next(): boolean
  prev(): boolean
}
