// generators/functions_cpp.js
import { CppGenerator } from "./cpp";

export function registerFunctionGenerators() {

    CppGenerator.forBlock["function_definition"] = function (block, generator) {
        const returnType = block.getFieldValue("RETURN_TYPE");
        const funcName = block.getFieldValue("FUNC_NAME");
        const params = block.params_ || [];
        const body = generator.statementToCode(block, "BODY");

        const paramStr = params
            .map(p => `${p.type} ${p.name}`)
            .join(", ");

        return `${returnType} ${funcName}(${paramStr}) {\n${body}}\n`;
    };

    CppGenerator.forBlock["function_call"] = function (block, generator) {
        const funcName = block.getFieldValue("FUNC_NAME");
        const params = block.params_ || [];

        const args = params.map((_, i) => {
            return generator.valueToCode(
                block,
                `PARAM_${i}`,
                CppGenerator.ORDER_NONE
            ) || "0";
        });

        return `  ${funcName}(${args.join(", ")});\n`;
    };

    CppGenerator.forBlock["function_return"] = function (block, generator) {
        const value = generator.valueToCode(
            block,
            "VALUE",
            CppGenerator.ORDER_NONE
        ) || "0";
        return `  return ${value};\n`;
    };
}