// src/components/BlocklyEditor/generators/esp32_cpp.js
import * as Blockly from "blockly";
import { CppGenerator } from "./cpp";

export function registerEsp32Generators() {

    CppGenerator["esp32_setup"] = function (block) {
        const body = CppGenerator.statementToCode(block, "BODY");
        return `void setup() {\n${body}}\n`;
    };

    CppGenerator["esp32_loop"] = function (block) {
        const body = CppGenerator.statementToCode(block, "BODY");
        return `void loop() {\n${body}}\n`;
    };

    CppGenerator["esp32_pinmode"] = function (block) {
        const pin = block.getFieldValue("PIN");
        const mode = block.getFieldValue("MODE");
        return `  pinMode(${pin}, ${mode});\n`;
    };

    CppGenerator["esp32_digitalwrite"] = function (block) {
        const pin = block.getFieldValue("PIN");
        const value = block.getFieldValue("VALUE");
        return `  digitalWrite(${pin}, ${value});\n`;
    };

    CppGenerator["esp32_digitalread"] = function (block) {
        const pin = block.getFieldValue("PIN");
        return [`digitalRead(${pin})`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator["esp32_analogread"] = function (block) {
        const pin = block.getFieldValue("PIN");
        return [`analogRead(${pin})`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator["esp32_delay"] = function (block) {
        const ms = CppGenerator.valueToCode(block, "MS", CppGenerator.ORDER_ATOMIC) || "1000";
        return `  delay(${ms});\n`;
    };

    CppGenerator["esp32_serialprint"] = function (block) {
        const text = CppGenerator.valueToCode(block, "TEXT", CppGenerator.ORDER_ATOMIC) || '""';
        const newline = block.getFieldValue("NEWLINE") === "TRUE";
        return newline
            ? `  Serial.println(${text});\n`
            : `  Serial.print(${text});\n`;
    };

    CppGenerator["esp32_serialbegin"] = function (block) {
        const baud = block.getFieldValue("BAUD");
        return `  Serial.begin(${baud});\n`;
    };

    CppGenerator["esp32_var_set"] = function (block) {
        const name = block.getFieldValue("NAME");
        const value = CppGenerator.valueToCode(block, "VALUE", CppGenerator.ORDER_ATOMIC) || "0";
        return `  ${name} = ${value};\n`;
    };

    // Standard Blockly blocks mapped to C++
    CppGenerator["math_number"] = function (block) {
        const num = block.getFieldValue("NUM");
        return [num, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator["text"] = function (block) {
        const text = block.getFieldValue("TEXT");
        return [`"${text}"`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator["logic_boolean"] = function (block) {
        const value = block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
        return [value, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator["logic_compare"] = function (block) {
        const ops = {
            EQ: "==", NEQ: "!=",
            LT: "<", LTE: "<=",
            GT: ">", GTE: ">="
        };
        const op = ops[block.getFieldValue("OP")];
        const a = CppGenerator.valueToCode(block, "A", CppGenerator.ORDER_RELATIONAL) || "0";
        const b = CppGenerator.valueToCode(block, "B", CppGenerator.ORDER_RELATIONAL) || "0";
        return [`${a} ${op} ${b}`, CppGenerator.ORDER_RELATIONAL];
    };

    CppGenerator["logic_operation"] = function (block) {
        const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
        const a = CppGenerator.valueToCode(block, "A", CppGenerator.ORDER_LOGICAL_AND) || "false";
        const b = CppGenerator.valueToCode(block, "B", CppGenerator.ORDER_LOGICAL_AND) || "false";
        return [`${a} ${op} ${b}`, CppGenerator.ORDER_LOGICAL_AND];
    };

    CppGenerator["controls_if"] = function (block) {
        let code = "";
        for (let i = 0; i <= block.elseifCount_; i++) {
            const condition = CppGenerator.valueToCode(block, `IF${i}`, CppGenerator.ORDER_NONE) || "false";
            const body = CppGenerator.statementToCode(block, `DO${i}`);
            code += i === 0
                ? `  if (${condition}) {\n${body}  }`
                : ` else if (${condition}) {\n${body}  }`;
        }
        if (block.elseCount_) {
            const elseBody = CppGenerator.statementToCode(block, "ELSE");
            code += ` else {\n${elseBody}  }`;
        }
        return code + "\n";
    };

    CppGenerator["controls_whileUntil"] = function (block) {
        const mode = block.getFieldValue("MODE");
        let condition = CppGenerator.valueToCode(block, "BOOL", CppGenerator.ORDER_NONE) || "false";
        if (mode === "UNTIL") condition = `!(${condition})`;
        const body = CppGenerator.statementToCode(block, "DO");
        return `  while (${condition}) {\n${body}  }\n`;
    };

    CppGenerator["controls_for"] = function (block) {
        const variable = block.getFieldValue("VAR");
        const from = CppGenerator.valueToCode(block, "FROM", CppGenerator.ORDER_NONE) || "0";
        const to = CppGenerator.valueToCode(block, "TO", CppGenerator.ORDER_NONE) || "10";
        const by = CppGenerator.valueToCode(block, "BY", CppGenerator.ORDER_NONE) || "1";
        const body = CppGenerator.statementToCode(block, "DO");
        return `  for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${by}) {\n${body}  }\n`;
    };

    CppGenerator["math_arithmetic"] = function (block) {
        const ops = {
            ADD: ["+", CppGenerator.ORDER_ADDITIVE],
            MINUS: ["-", CppGenerator.ORDER_ADDITIVE],
            MULTIPLY: ["*", CppGenerator.ORDER_MULTIPLICATIVE],
            DIVIDE: ["/", CppGenerator.ORDER_MULTIPLICATIVE]
        };
        const [op, order] = ops[block.getFieldValue("OP")];
        const a = CppGenerator.valueToCode(block, "A", order) || "0";
        const b = CppGenerator.valueToCode(block, "B", order) || "0";
        return [`${a} ${op} ${b}`, order];
    };
}

// Helper to wrap generated code in a full ESP32 Arduino sketch
export function wrapInSketch(code) {
    return `#include <Arduino.h>\n\n${code}`;
}