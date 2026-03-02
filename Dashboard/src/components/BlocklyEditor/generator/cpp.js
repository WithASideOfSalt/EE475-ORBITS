// src/components/BlocklyEditor/generators/cpp.js
import * as Blockly from "blockly";

export const CppGenerator = new Blockly.CodeGenerator("cpp");

CppGenerator.ORDER_ATOMIC = 0;
CppGenerator.ORDER_UNARY_POSTFIX = 1;
CppGenerator.ORDER_UNARY_PREFIX = 2;
CppGenerator.ORDER_MULTIPLICATIVE = 3;
CppGenerator.ORDER_ADDITIVE = 4;
CppGenerator.ORDER_RELATIONAL = 6;
CppGenerator.ORDER_EQUALITY = 7;
CppGenerator.ORDER_LOGICAL_AND = 11;
CppGenerator.ORDER_LOGICAL_OR = 12;
CppGenerator.ORDER_NONE = 99;

// How to handle scrub (blocks chained together)
CppGenerator.scrub_ = function (block, code, thisOnly) {
    const nextBlock = block.nextConnection?.targetBlock();
    if (nextBlock && !thisOnly) {
        return code + "\n" + CppGenerator.blockToCode(nextBlock);
    }
    return code;
};

// generators/cpp.js - override workspaceToCode
export function generateSketch(workspace) {
    // Explicitly find each singleton block by type
    const setupBlocks = workspace.getBlocksByType("esp32_setup", false);
    const loopBlocks = workspace.getBlocksByType("esp32_loop", false);

    const setupCode = setupBlocks.length > 0
        ? CppGenerator.blockToCode(setupBlocks[0])
        : "void setup() {\n}\n";

    const loopCode = loopBlocks.length > 0
        ? CppGenerator.blockToCode(loopBlocks[0])
        : "void loop() {\n}\n";

    // Always setup first, loop second, regardless of canvas position
    // Note: This can be expanded for other definitions and such
    return `${setupCode}\n${loopCode}`;
}