export const MOCK_CONTRACT_OPCODES = [
    { pc: "0000", mnemonic: "PUSH1", args: "0x80", color: "text-blue-400" },
    { pc: "0002", mnemonic: "PUSH1", args: "0x40", color: "text-blue-400" },
    { pc: "0004", mnemonic: "MSTORE", args: "", color: "text-yellow-400" },
    { pc: "", mnemonic: "PUSH32", args: "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", color: "text-red-400" },
    { pc: "0005", mnemonic: "CALLVALUE", args: "", color: "text-blue-400" },
    { pc: "0006", mnemonic: "DUP1", args: "", color: "text-purple-400" },
    { pc: "0007", mnemonic: "ISZERO", args: "", color: "text-green-400" },
    { pc: "0008", mnemonic: "PUSH2", args: "0x0010", color: "text-blue-400" },
    { pc: "000B", mnemonic: "JUMPI", args: "", color: "text-red-400" },
    { pc: "000C", mnemonic: "PUSH1", args: "0x00", color: "text-blue-400" },
    { pc: "000E", mnemonic: "DUP1", args: "", color: "text-purple-400" },
    { pc: "000F", mnemonic: "REVERT", args: "", color: "text-red-400" },
    { pc: "0010", mnemonic: "JUMPDEST", args: "", color: "text-blue-400" },
    { pc: "0011", mnemonic: "POP", args: "", color: "text-purple-400" },
    { pc: "0012", mnemonic: "PUSH1", args: "0x04", color: "text-blue-400" },
    { pc: "0014", mnemonic: "CALLDATASIZE", args: "", color: "text-purple-400" },
    { pc: "0015", mnemonic: "LT", args: "", color: "text-gray-400" },
    { pc: "0016", mnemonic: "PUSH2", args: "0x0036", color: "text-blue-400" },
    { pc: "0019", mnemonic: "JUMPI", args: "", color: "text-red-400" },
    { pc: "001A", mnemonic: "PUSH1", args: "0x00", color: "text-blue-400" },
    { pc: "001C", mnemonic: "CALLDATALOAD", args: "", color: "text-purple-400" },
    { pc: "001D", mnemonic: "PUSH1", args: "0xe0", color: "text-blue-400" },
    { pc: "001F", mnemonic: "SHR", args: "", color: "text-gray-400" },
    { pc: "0020", mnemonic: "DUP1", args: "", color: "text-purple-400" },
    { pc: "0021", mnemonic: "PUSH4", args: "0x10c86684", color: "text-blue-400" },
    { pc: "0026", mnemonic: "EQ", args: "", color: "text-gray-400" },
    { pc: "0027", mnemonic: "PUSH2", args: "0x003b", color: "text-blue-400" },
    { pc: "002A", mnemonic: "JUMPI", args: "", color: "text-red-400" },
    { pc: "002B", mnemonic: "JUMPDEST", args: "", color: "text-blue-400" },
    { pc: "002C", mnemonic: "PUSH1", args: "0x00", color: "text-blue-400" },
    { pc: "002E", mnemonic: "DUP1", args: "", color: "text-purple-400" },
    { pc: "002F", mnemonic: "REVERT", args: "", color: "text-red-400" },
    { pc: "0030", mnemonic: "JUMPDEST", args: "", color: "text-blue-400" },
    { pc: "0031", mnemonic: "PUSH2", args: "0x005a", color: "text-blue-400" },
    { pc: "0034", mnemonic: "PUSH2", args: "0x0047", color: "text-blue-400" },
    { pc: "0037", mnemonic: "JUMP", args: "", color: "text-red-400" },
];

export const MOCK_TRANSIENT_STORAGE = [
    { key: "0xab", value: "0x42" } // Example
];

export const MOCK_STORAGE = [
    { key: "0x00", value: "0x0" },
    { key: "0x01", value: "0xdead" }
];
