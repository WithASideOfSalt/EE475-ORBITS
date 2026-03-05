import * as Blockly from "blockly";

// The small blocks that appear inside the mutator popup
Blockly.Blocks["function_param"] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["int", "int"],
                ["bool", "bool"],
                ["String", "String"]
            ]), "TYPE")
            .appendField(new Blockly.FieldTextInput("param"), "NAME");
        this.setPreviousStatement(true, "function_param");
        this.setNextStatement(true, "function_param");
        this.setColour(290);
        this.setTooltip("Add a parameter");
    }
};

// The container block inside the mutator popup
Blockly.Blocks["function_params_container"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Parameters");
        this.appendStatementInput("PARAMS")
            .setCheck("function_param");
        this.setColour(290);
        this.setTooltip("Add parameters to this function");
        this.contextMenu = false;
    }
};