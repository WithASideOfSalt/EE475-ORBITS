// src/components/BlocklyEditor/theme/index.js
import * as Blockly from "blockly";

// Define custom block styles (colour + hat/rounded shapes)
const blockStyles = {
    esp32_blocks: {
        colourPrimary: "#0D47A1",
        colourSecondary: "#1565C0",
        colourTertiary: "#0A3069"
    },
    logic_blocks: {
        colourPrimary: "#1B5E20",
        colourSecondary: "#2E7D32",
        colourTertiary: "#145214"
    },
    loop_blocks: {
        colourPrimary: "#4A148C",
        colourSecondary: "#6A1B9A",
        colourTertiary: "#38006b"
    },
    math_blocks: {
        colourPrimary: "#E65100",
        colourSecondary: "#EF6C00",
        colourTertiary: "#BF360C"
    },
    text_blocks: {
        colourPrimary: "#006064",
        colourSecondary: "#00838F",
        colourTertiary: "#004D40"
    }
};

// Define category styles (toolbox sidebar colours)
const categoryStyles = {
    esp32_category: { colour: "#0D47A1" },
    logic_category: { colour: "#1B5E20" },
    loop_category: { colour: "#4A148C" },
    math_category: { colour: "#E65100" },
    text_category: { colour: "#006064" }
};

// Component styles (workspace background etc.)
const componentStyles = {
    workspaceBackgroundColour: "#1e1e1e",
    toolboxBackgroundColour: "#252526",
    toolboxForegroundColour: "#cccccc",
    flyoutBackgroundColour: "#2d2d2d",
    flyoutForegroundColour: "#cccccc",
    flyoutOpacity: 1,
    scrollbarColour: "#555",
    insertionMarkerColour: "#ffffff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.7,
    cursorColour: "#ffffff"
};

export const OrbitsTheme = Blockly.Theme.defineTheme("orbits", {
    base: Blockly.Themes.Zelos,   // start from Zelos (rounded, PXT-like)
    blockStyles,
    categoryStyles,
    componentStyles,
    fontStyle: {
        family: "Inter, system-ui, sans-serif",
        size: 13
    }
});