// src/components/BlocklyEditor/blocks/esp32.js
import * as Blockly from "blockly";
import { FieldMultilineInput } from "@blockly/field-multilineinput";

Blockly.fieldRegistry.register("field_multilineinput", FieldMultilineInput);

export function defineEsp32Blocks() {

    Blockly.Blocks["esp32_includes"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Includes");
            this.appendStatementInput("BODY")
                .setCheck("INCLUDE");
            this.setColour(230);
            this.setTooltip("Top-level include directives");
        }
    };

    Blockly.Blocks["esp32_globals"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Global Variables");
            this.appendStatementInput("BODY")
                .setCheck("GLOBAL");
            this.setColour(330);
            this.setTooltip("Top-level global variable declarations");
        }
    };

    // Setup block (maps to setup())
    Blockly.Blocks["esp32_setup"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Setup");
            this.appendStatementInput("BODY")
                .setCheck(null);
            this.setColour(120);
            this.setTooltip("Runs once at startup");
            this.setDeletable(false);    // ← cannot be deleted
            this.setHelpUrl("");
            // Hat block — no previous/next connections
        }
    };

    // Loop block (maps to loop())
    Blockly.Blocks["esp32_loop"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Loop");
            this.appendStatementInput("BODY")
                .setCheck(null);
            this.setColour(120);
            this.setDeletable(false);
            this.setTooltip("Runs repeatedly");
        }
    };

    // Pin mode
    Blockly.Blocks["esp32_pinmode"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Set pin")
                .appendField(new Blockly.FieldNumber(13, 0, 39), "PIN")
                .appendField("as")
                .appendField(new Blockly.FieldDropdown([
                    ["OUTPUT", "OUTPUT"],
                    ["INPUT", "INPUT"],
                    ["INPUT_PULLUP", "INPUT_PULLUP"]
                ]), "MODE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip("Set pin mode");
        }
    };

    // Digital write
    Blockly.Blocks["esp32_digitalwrite"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Digital write pin")
                .appendField(new Blockly.FieldNumber(13, 0, 39), "PIN")
                .appendField("→")
                .appendField(new Blockly.FieldDropdown([
                    ["HIGH", "HIGH"],
                    ["LOW", "LOW"]
                ]), "VALUE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip("Write HIGH or LOW to a digital pin");
        }
    };

    // Digital read
    Blockly.Blocks["esp32_digitalread"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Digital read pin")
                .appendField(new Blockly.FieldNumber(13, 0, 39), "PIN");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("Read HIGH or LOW from a digital pin");
        }
    };

    // Analog read
    Blockly.Blocks["esp32_analogread"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Analog read pin")
                .appendField(new Blockly.FieldNumber(34, 0, 39), "PIN");
            this.setOutput(true, "Number");
            this.setColour(230);
            this.setTooltip("Read analog value (0-4095) from a pin");
        }
    };

    // Include
    Blockly.Blocks["esp32_include"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Include")
                .appendField(new Blockly.FieldTextInput("<Arduino.h>"), "HEADER");
            this.setPreviousStatement(true, "INCLUDE");
            this.setNextStatement(true, "INCLUDE");
            this.setColour(230);
            this.setTooltip("Include a header file");
        }
    };

    Blockly.Blocks["esp32_global_var_declare"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Global")
                .appendField(new Blockly.FieldDropdown([
                    ["int", "int"],
                    ["float", "float"],
                    ["bool", "bool"],
                    ["String", "String"],
                    ["const char*", "const char*"],
                ]), "TYPE")
                .appendField(new Blockly.FieldTextInput("myGlobal"), "NAME")
                .appendField("=");
            this.appendValueInput("VALUE")
                .setCheck(null);
            this.setPreviousStatement(true, "GLOBAL");
            this.setNextStatement(true, "GLOBAL");
            this.setColour(330);
            this.setTooltip("Declare a global variable");
        }
    };

    // Comment
    Blockly.Blocks["esp32_comment"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Comment")
                .appendField(new Blockly.FieldTextInput("Enter comment..."), "TEXT");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip("Add a comment");
        }
    };


    // Delay
    Blockly.Blocks["esp32_delay"] = {
        init: function () {
            this.appendValueInput("MS")
                .setCheck("Number")
                .appendField("Delay (ms)");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(65);
            this.setTooltip("Pause execution for given milliseconds");
        }
    };

    // Serial print
    Blockly.Blocks["esp32_serialprint"] = {
        init: function () {
            this.appendValueInput("TEXT")
                .setCheck(null)
                .appendField("Serial print");
            this.appendDummyInput()
                .appendField(new Blockly.FieldCheckbox("TRUE"), "NEWLINE")
                .appendField("newline");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(160);
            this.setTooltip("Print to serial monitor");
        }
    };

    // Serial begin
    Blockly.Blocks["esp32_serialbegin"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Serial begin")
                .appendField(new Blockly.FieldDropdown([
                    ["9600", "9600"],
                    ["115200", "115200"],
                    ["57600", "57600"]
                ]), "BAUD");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(160);
            this.setTooltip("Initialize serial communication");
        }
    };

    // If block is built into Blockly, but register ESP32 specific ones below
    // Variable declare
    Blockly.Blocks["esp32_var_declare"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Declare")
                .appendField(new Blockly.FieldDropdown([
                    ["int", "int"],
                    ["float", "float"],
                    ["bool", "bool"],
                    ["String", "String"]
                ]), "TYPE")
                .appendField(new Blockly.FieldTextInput("myVar"), "NAME")
                .appendField("=");
            this.appendValueInput("VALUE")
                .setCheck(null);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
        }
    };

    // Variable set
    Blockly.Blocks["esp32_var_set"] = {
        init: function () {
            this.appendValueInput("VALUE")
                .setCheck(null)
                .appendField("Set variable")
                .appendField(new Blockly.FieldTextInput("myVar"), "NAME")
                .appendField("=");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
        }
    };

    // Variable change by
    Blockly.Blocks["esp32_var_change"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Change")
                .appendField(new Blockly.FieldTextInput("myVar"), "NAME")
                .appendField("by");
            this.appendValueInput("DELTA")
                .setCheck("Number");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(330);
        }
    };

    // Variable get
    Blockly.Blocks["esp32_var_get"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Get variable")
                .appendField(new Blockly.FieldTextInput("myVar"), "NAME");
            this.setOutput(true, null);
            this.setColour(330);
        }
    };

    Blockly.Blocks["esp32_script"] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Script")
                .appendField("Code");
            this.appendStatementInput("BODY")
                .setCheck(null);
            this.setColour(230);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip("Custom script block");
        }
    };

    Blockly.Blocks["esp32_script_code"] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Custom Code");
            this.appendDummyInput()
                .appendField(new FieldMultilineInput(""), "CODE");
            this.setColour(200);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip("Custom code block");
        }
    };
}