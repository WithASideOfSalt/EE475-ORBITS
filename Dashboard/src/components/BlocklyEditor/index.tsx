// src/components/BlocklyEditor/index.tsx
import { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { defineEsp32Blocks } from "./blocks/esp32.js";
import { registerEsp32Generators } from "./generator/esp32_cpp.js";
import { CppGenerator } from "./generator/cpp.js";
import { wrapInSketch } from "./generator/esp32_cpp.js";
import { OrbitsTheme } from "./theme/index.js";
import { toolbox } from "./toolbox.js";

// Register everything once
defineEsp32Blocks();
registerEsp32Generators();

interface BlocklyEditorProps {
    onCodeChange?: (code: string) => void;
}

export default function BlocklyEditor({ onCodeChange }: BlocklyEditorProps) {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    useEffect(() => {
        if (workspaceRef.current || !blocklyDiv.current) return; // already initialised

        workspaceRef.current = Blockly.inject(blocklyDiv.current, {
            toolbox,
            theme: OrbitsTheme,
            renderer: "zelos",          // rounded PXT-like shapes
            grid: {
                spacing: 20,
                length: 3,
                colour: "#2a2a2a",
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            trashcan: true,
            scrollbars: true,
            sounds: false
        });

        // Fire C++ generation on every change
        workspaceRef.current.addChangeListener((event: Blockly.Events.Abstract) => {
            if (event.isUiEvent) return; // ignore UI-only events
            const raw = CppGenerator.workspaceToCode(workspaceRef.current!);
            const full = wrapInSketch(raw);
            onCodeChange?.(full);
        });

        // Handle resize
        const observer = new ResizeObserver(() => {
            if (workspaceRef.current) {
                Blockly.svgResize(workspaceRef.current);
            }
        });
        observer.observe(blocklyDiv.current);

        return () => {
            observer.disconnect();
            workspaceRef.current?.dispose();
            workspaceRef.current = null;
        };
    }, [onCodeChange]);

    return (
        <div
            ref={blocklyDiv}
            style={{ width: "100%", height: "100%", position: "absolute" }}
        />
    );
}