// src/components/BlocklyEditor/toolbox.js
export const toolbox = {
    kind: "categoryToolbox",
    contents: [
        {
            kind: "category",
            name: "ESP32",
            styleName: "esp32_category",
            contents: [
                //{ kind: "block", type: "esp32_setup" },
                //{ kind: "block", type: "esp32_loop" },
                { kind: "block", type: "esp32_pinmode" },
                { kind: "block", type: "esp32_digitalwrite" },
                { kind: "block", type: "esp32_digitalread" },
                { kind: "block", type: "esp32_analogread" },
                { kind: "block", type: "esp32_delay" },
            ]
        },
        {
            kind: "category",
            name: "Serial",
            styleName: "esp32_category",
            contents: [
                { kind: "block", type: "esp32_serialbegin" },
                { kind: "block", type: "esp32_serialprint" },
            ]
        },
        {
            kind: "category",
            name: "Logic",
            styleName: "logic_category",
            contents: [
                { kind: "block", type: "controls_if" },
                { kind: "block", type: "logic_compare" },
                { kind: "block", type: "logic_operation" },
                { kind: "block", type: "logic_boolean" },
            ]
        },
        {
            kind: "category",
            name: "Loops",
            styleName: "loop_category",
            contents: [
                { kind: "block", type: "controls_whileUntil" },
                { kind: "block", type: "controls_for" },
            ]
        },
        {
            kind: "category",
            name: "Math",
            styleName: "math_category",
            contents: [
                { kind: "block", type: "math_number" },
                { kind: "block", type: "math_arithmetic" },
            ]
        },
        {
            kind: "category",
            name: "Text",
            styleName: "text_category",
            contents: [
                { kind: "block", type: "text" },
                { kind: "block", type: "esp32_serialprint" },
            ]
        },
        {
            kind: "category",
            name: "Variables",
            styleName: "math_category",
            contents: [
                { kind: "block", type: "esp32_var_declare" },
                { kind: "block", type: "esp32_var_set" },
                { kind: "block", type: "esp32_var_change" },
                { kind: "block", type: "esp32_var_get" },
            ]
        },
        //Implement in future, for now user can write in custom code block
        /* {
            kind: "category",
            name: "Functions",
            styleName: "function_category",
            contents: [
                { kind: "block", type: "esp32_function_define" },
                { kind: "block", type: "esp32_function_call" },
            ]
        }, */
        {
            kind: "category",
            name: "Custom Code",
            styleName: "function_category",
            contents: [
                { kind: "block", type: "esp32_script" },
                { kind: "block", type: "esp32_script_code" },
            ]
        },

        {
            kind: "category",
            name: "Functions",
            styleName: "logic_category",
            contents: [
                { kind: "block", type: "function_definition" },
                { kind: "block", type: "function_call" },
                { kind: "block", type: "function_return" }
            ]
        }
    ]
};