// src/components/BlocklyEditor/generators/esp32_cpp.js
import * as Blockly from "blockly";
import { CppGenerator } from "./cpp";

export function registerEsp32Generators() {

    CppGenerator.forBlock["esp32_setup"] = function (block, generator) {
        const body = generator.statementToCode(block, "BODY");
        return `void setup() {\n${body}}\n`;
    };

    CppGenerator.forBlock["esp32_loop"] = function (block, generator) {
        const body = generator.statementToCode(block, "BODY");
        return `void loop() {\n${body}}\n`;
    };

    CppGenerator.forBlock["esp32_pinmode"] = function (block, generator) {
        const pin = block.getFieldValue("PIN");
        const mode = block.getFieldValue("MODE");
        return `  pinMode(${pin}, ${mode});\n`;
    };

    CppGenerator.forBlock["esp32_digitalwrite"] = function (block, generator) {
        const pin = block.getFieldValue("PIN");
        const value = block.getFieldValue("VALUE");
        return `  digitalWrite(${pin}, ${value});\n`;
    };

    CppGenerator.forBlock["esp32_digitalread"] = function (block, generator) {
        const pin = block.getFieldValue("PIN");
        return [`digitalRead(${pin})`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator.forBlock["esp32_analogread"] = function (block, generator) {
        const pin = block.getFieldValue("PIN");
        return [`analogRead(${pin})`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator.forBlock["esp32_delay"] = function (block, generator) {
        const ms = generator.valueToCode(block, "MS", CppGenerator.ORDER_ATOMIC) || "1000";
        return `  delay(${ms});\n`;
    };

    CppGenerator.forBlock["esp32_serialprint"] = function (block, generator) {
        const text = generator.valueToCode(block, "TEXT", CppGenerator.ORDER_ATOMIC) || '""';
        const newline = block.getFieldValue("NEWLINE") === "TRUE";
        return newline
            ? `  Serial.println(${text});\n`
            : `  Serial.print(${text});\n`;
    };

    CppGenerator.forBlock["esp32_serialbegin"] = function (block, generator) {
        const baud = block.getFieldValue("BAUD");
        return `  Serial.begin(${baud});\n`;
    };

    CppGenerator.forBlock["esp32_var_set"] = function (block, generator) {
        const name = block.getFieldValue("NAME");
        const value = generator.valueToCode(block, "VALUE", CppGenerator.ORDER_ATOMIC) || "0";
        return `  ${name} = ${value};\n`;
    };

    // Standard Blockly blocks mapped to C++
    CppGenerator.forBlock["math_number"] = function (block, generator) {
        const num = block.getFieldValue("NUM");
        return [num, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator.forBlock["text"] = function (block, generator) {
        const text = block.getFieldValue("TEXT");
        return [`"${text}"`, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator.forBlock["logic_boolean"] = function (block, generator) {
        const value = block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
        return [value, CppGenerator.ORDER_ATOMIC];
    };

    CppGenerator.forBlock["logic_compare"] = function (block, generator) {
        const ops = {
            EQ: "==", NEQ: "!=",
            LT: "<", LTE: "<=",
            GT: ">", GTE: ">="
        };
        const op = ops[block.getFieldValue("OP")];
        const a = generator.valueToCode(block, "A", CppGenerator.ORDER_RELATIONAL) || "0";
        const b = generator.valueToCode(block, "B", CppGenerator.ORDER_RELATIONAL) || "0";
        return [`${a} ${op} ${b}`, CppGenerator.ORDER_RELATIONAL];
    };

    CppGenerator.forBlock["logic_operation"] = function (block, generator) {
        const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
        const a = generator.valueToCode(block, "A", CppGenerator.ORDER_LOGICAL_AND) || "false";
        const b = generator.valueToCode(block, "B", CppGenerator.ORDER_LOGICAL_AND) || "false";
        return [`${a} ${op} ${b}`, CppGenerator.ORDER_LOGICAL_AND];
    };

    CppGenerator.forBlock["controls_if"] = function (block, generator) {
        let code = "";
        for (let i = 0; i <= block.elseifCount_; i++) {
            const condition = generator.valueToCode(block, `IF${i}`, CppGenerator.ORDER_NONE) || "false";
            const body = generator.statementToCode(block, `DO${i}`);
            code += i === 0
                ? `  if (${condition}) {\n${body}  }`
                : ` else if (${condition}) {\n${body}  }`;
        }
        if (block.elseCount_) {
            const elseBody = generator.statementToCode(block, "ELSE");
            code += ` else {\n${elseBody}  }`;
        }
        return code + "\n";
    };

    CppGenerator.forBlock["controls_whileUntil"] = function (block, generator) {
        const mode = block.getFieldValue("MODE");
        let condition = generator.valueToCode(block, "BOOL", CppGenerator.ORDER_NONE) || "false";
        if (mode === "UNTIL") condition = `!(${condition})`;
        const body = generator.statementToCode(block, "DO");
        return `  while (${condition}) {\n${body}  }\n`;
    };

    CppGenerator.forBlock["controls_for"] = function (block, generator) {
        const variable = block.getFieldValue("VAR");
        const from = generator.valueToCode(block, "FROM", CppGenerator.ORDER_NONE) || "0";
        const to = generator.valueToCode(block, "TO", CppGenerator.ORDER_NONE) || "10";
        const by = generator.valueToCode(block, "BY", CppGenerator.ORDER_NONE) || "1";
        const body = generator.statementToCode(block, "DO");
        return `  for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${by}) {\n${body}  }\n`;
    };

    CppGenerator.forBlock["math_arithmetic"] = function (block, generator) {
        const ops = {
            ADD: ["+", CppGenerator.ORDER_ADDITIVE],
            MINUS: ["-", CppGenerator.ORDER_ADDITIVE],
            MULTIPLY: ["*", CppGenerator.ORDER_MULTIPLICATIVE],
            DIVIDE: ["/", CppGenerator.ORDER_MULTIPLICATIVE]
        };
        const [op, order] = ops[block.getFieldValue("OP")];
        const a = generator.valueToCode(block, "A", order) || "0";
        const b = generator.valueToCode(block, "B", order) || "0";
        return [`${a} ${op} ${b}`, order];
    };
}

// Helper to wrap generated code in a full ESP32 Arduino sketch
export function wrapInSketch(code) {
    return `#include <Arduino.h>\n\n${code}`;
}