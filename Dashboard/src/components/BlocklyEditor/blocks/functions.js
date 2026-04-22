// blocks/functions.js
import * as Blockly from "blockly";

// Register the mutator mixin separately
const FUNCTION_MUTATOR_MIXIN = {
    paramCount_: 0,
    params_: [],

    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement("mutation");
        this.params_.forEach((param, i) => {
            const paramEl = Blockly.utils.xml.createElement("param");
            paramEl.setAttribute("type", param.type);
            paramEl.setAttribute("name", param.name);
            paramEl.setAttribute("index", String(i));
            container.appendChild(paramEl);
        });
        return container;
    },

    domToMutation: function (xmlElement) {
        this.params_ = [];
        const paramEls = xmlElement.getElementsByTagName("param");
        for (const el of paramEls) {
            this.params_.push({
                type: el.getAttribute("type"),
                name: el.getAttribute("name")
            });
        }
        this.updateShape_();
    },

    decompose: function (workspace) {
        const containerBlock = workspace.newBlock("function_params_container");
        containerBlock.initSvg();

        let connection = containerBlock.getInput("PARAMS").connection;
        this.params_.forEach((param) => {
            const paramBlock = workspace.newBlock("function_param");
            paramBlock.initSvg();
            paramBlock.setFieldValue(param.type, "TYPE");
            paramBlock.setFieldValue(param.name, "NAME");
            connection.connect(paramBlock.previousConnection);
            connection = paramBlock.nextConnection;
        });

        return containerBlock;
    },

    compose: function (containerBlock) {
        this.params_ = [];
        let paramBlock = containerBlock.getInputTargetBlock("PARAMS");

        while (paramBlock) {
            this.params_.push({
                type: paramBlock.getFieldValue("TYPE"),
                name: paramBlock.getFieldValue("NAME")
            });
            paramBlock = paramBlock.getNextBlock();
        }

        this.updateShape_();
        this.updateCallBlocks_();
    },

    updateShape_: function () {
        const label = this.params_
            .map(p => `${p.type} ${p.name}`)
            .join(", ");
        this.setFieldValue(label, "PARAMS_LABEL");
    },

    updateCallBlocks_: function () {
        const funcName = this.getFieldValue("FUNC_NAME");
        const workspace = this.workspace;
        if (!workspace) return;

        workspace.getBlocksByType("function_call", false)
            .filter(b => b.getFieldValue("FUNC_NAME") === funcName)
            .forEach(b => b.updateParams_(this.params_));
    }
};

export function defineFunctionBlocks() {

    // Mutator container and param blocks (unchanged)
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
        }
    };

    Blockly.Blocks["function_params_container"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("Parameters");
            this.appendStatementInput("PARAMS")
                .setCheck("function_param");
            this.setColour(290);
            this.contextMenu = false;
        }
    };

    // Function definition block - now uses extensions instead of setMutator
    Blockly.Blocks["function_definition"] = {
        init: function () {
            this.mixin(FUNCTION_MUTATOR_MIXIN);
            this.params_ = [];

            this.appendDummyInput("HEADER")
                .appendField(new Blockly.FieldDropdown([
                    ["void", "void"],
                    ["int", "int"],
                    ["bool", "bool"],
                    ["String", "String"]
                ]), "RETURN_TYPE")
                .appendField(new Blockly.FieldTextInput("myFunction"), "FUNC_NAME")
                .appendField("(")
                .appendField(new Blockly.FieldLabel(""), "PARAMS_LABEL")
                .appendField(")");

            this.appendStatementInput("BODY")
                .setCheck(null)
                .appendField("do");

            this.setColour(290);
            this.setTooltip("Define a function");
            this.setDeletable(true);
            this.setMovable(true);

            this.setMutator(new Blockly.icons.MutatorIcon(
                ["function_param"],
                this
            ));
        }
    };

    Blockly.Blocks["function_mqtt_handler_definition"] = {
        init: function () {
            this.appendDummyInput("HEADER")
                .appendField("MQTT Handler")
                .appendField(new Blockly.FieldTextInput("onDashboardCommand"), "FUNC_NAME")
                .appendField("topic")
                .appendField(new Blockly.FieldTextInput("orbits/command/user"), "MQTT_TOPIC");

            this.appendStatementInput("BODY")
                .setCheck(null)
                .appendField("do");

            this.setColour(290);
            this.setTooltip("Define a user function callable from dashboard MQTT topic");
            this.setDeletable(true);
            this.setMovable(true);
        }
    };

    // Function call block (unchanged from before)
    Blockly.Blocks["function_call"] = {
        init: function () {
            this.params_ = [];

            this.appendDummyInput("HEADER")
                .appendField("call")
                .appendField(new Blockly.FieldTextInput("myFunction"), "FUNC_NAME");

            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(290);
            this.setTooltip("Call a function");
        },

        mutationToDom: function () {
            const container = Blockly.utils.xml.createElement("mutation");
            this.params_.forEach((param, i) => {
                const el = Blockly.utils.xml.createElement("param");
                el.setAttribute("type", param.type);
                el.setAttribute("name", param.name);
                el.setAttribute("index", String(i));
                container.appendChild(el);
            });
            return container;
        },

        domToMutation: function (xmlElement) {
            this.params_ = [];
            const paramEls = xmlElement.getElementsByTagName("param");
            for (const el of paramEls) {
                this.params_.push({
                    type: el.getAttribute("type"),
                    name: el.getAttribute("name")
                });
            }
            this.updateParams_(this.params_);
        },

        updateParams_: function (params) {
            this.params_.forEach((_, i) => {
                if (this.getInput(`PARAM_${i}`)) {
                    this.removeInput(`PARAM_${i}`);
                }
            });

            this.params_ = params;

            params.forEach((param, i) => {
                this.appendValueInput(`PARAM_${i}`)
                    .setCheck(this.blocklyTypeFromCpp_(param.type))
                    .appendField(`${param.name}:`);
            });
        },

        blocklyTypeFromCpp_: function (cppType) {
            const map = {
                "int": "Number",
                "bool": "Boolean",
                "String": "String"
            };
            return map[cppType] || null;
        }
    };

    Blockly.Blocks["function_return"] = {
        init: function () {
            this.appendValueInput("VALUE")
                .setCheck(null)
                .appendField("return");
            this.setPreviousStatement(true, null);
            this.setColour(290);
            this.setTooltip("Return a value from the function");
        }
    };
}