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

function buildFunctionPrototype(block) {
    const returnType = block.getFieldValue("RETURN_TYPE") || "void";
    const funcName = block.getFieldValue("FUNC_NAME") || "myFunction";
    const params = block.params_ || [];
    const paramStr = params.map((p) => `${p.type} ${p.name}`).join(", ");
    return `${returnType} ${funcName}(${paramStr});`;
}

// generators/cpp.js - override workspaceToCode
export function generateSketch(workspace) {
    const functionBlocks = workspace.getBlocksByType("function_definition", false);

    const seenPrototypes = new Set();
    const functionPrototypes = functionBlocks
        .map((block) => buildFunctionPrototype(block))
        .filter((prototype) => {
            if (seenPrototypes.has(prototype)) {
                return false;
            }
            seenPrototypes.add(prototype);
            return true;
        })
        .join("\n");

    const functionCode = functionBlocks
        .map((block) => CppGenerator.blockToCode(block))
        .join("\n");

    // Explicitly find each singleton block by type
    const setupBlocks = workspace.getBlocksByType("esp32_setup", false);
    const loopBlocks = workspace.getBlocksByType("esp32_loop", false);

    const setupCode = setupBlocks.length > 0
        ? CppGenerator.blockToCode(setupBlocks[0])
        : "void setup() {\n}\n";

    const loopCode = loopBlocks.length > 0
        ? CppGenerator.blockToCode(loopBlocks[0])
        : "void loop() {\n}\n";

    const prototypeSection = functionPrototypes.length > 0
        ? `${functionPrototypes}\n\n`
        : "";

    // Generate prototypes first so function calls are always declared before use.
    return `${prototypeSection}${setupCode}\n${loopCode}\n${functionCode}`;
}