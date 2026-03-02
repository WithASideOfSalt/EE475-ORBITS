// src/components/BlocklyEditor/index.tsx
import { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { defineEsp32Blocks } from "./blocks/esp32.js";
import { registerEsp32Generators } from "./generator/esp32_cpp.js";
import { CppGenerator, generateSketch } from "./generator/cpp.js";
import { wrapInSketch } from "./generator/esp32_cpp.js";
import { OrbitsTheme } from "./theme/index.js";
import { toolbox } from "./toolbox.js";

// Register everything once
defineEsp32Blocks();
registerEsp32Generators();

const WORKSPACE_STORAGE_KEY = "orbits_blockly_workspace";

interface BlocklyEditorProps {
    onCodeChange?: (code: string) => void;
}

export default function BlocklyEditor({ onCodeChange }: BlocklyEditorProps) {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const isLoadingRef = useRef(false);

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

        // Try to load saved workspace from localStorage
        const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        let workspaceLoaded = false;

        if (savedWorkspace) {
            try {
                isLoadingRef.current = true;
                const state = JSON.parse(savedWorkspace);
                Blockly.serialization.workspaces.load(state, workspaceRef.current);
                workspaceLoaded = true;
                //console.log("Loaded workspace from localStorage");
            } catch (error) {
                console.error("Failed to load workspace:", error);
            } finally {
                isLoadingRef.current = false;
            }
        }

        // If no saved workspace, create default setup and loop blocks
        if (!workspaceLoaded) {
            const setupBlock = workspaceRef.current.newBlock("esp32_setup");
            setupBlock.initSvg();
            setupBlock.render();
            setupBlock.moveBy(20, 20);

            const loopBlock = workspaceRef.current.newBlock("esp32_loop");
            loopBlock.initSvg();
            loopBlock.render();
            loopBlock.moveBy(20, 200);
        }


        const SINGLETON_BLOCKS = ["esp32_setup", "esp32_loop"];

        workspaceRef.current.addChangeListener((event) => {
            // Only care about blocks being added
            if (event.type !== Blockly.Events.BLOCK_CREATE) return;

            SINGLETON_BLOCKS.forEach((blockType) => {
                const allOfType = workspaceRef.current
                    .getBlocksByType(blockType, false);

                // If there's more than one, delete all but the first
                if (allOfType.length > 1) {
                    // Keep the first, delete the rest
                    allOfType.slice(1).forEach((block) => {
                        block.dispose(false);
                    });

                    // Optionally warn the user
                    console.warn(`Only one ${blockType} block is allowed.`);
                }
            });
        });

        // Fire C++ generation on every change
        workspaceRef.current.addChangeListener((event: Blockly.Events.Abstract) => {
            // Only generate code for meaningful changes (block creation, movement, deletion, field changes)
            if (event.isUiEvent || 
                event.type === Blockly.Events.FINISHED_LOADING ||
                event.type === Blockly.Events.VIEWPORT_CHANGE) {
                return;
            }
            
            // Don't save while loading from localStorage
            if (isLoadingRef.current) {
                return;
            }

            //console.log("Blockly event:", event.type, event);
            
            // Save workspace state to localStorage
            try {
                const state = Blockly.serialization.workspaces.save(workspaceRef.current!);
                localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
            } catch (error) {
                console.error("Failed to save workspace:", error);
            }

            // Generate C++ code
            const raw =     generateSketch(workspaceRef.current!);
            const full = wrapInSketch(raw);
            //console.log("Generated code:", full);
            onCodeChange?.(full);
        });

        // Generate initial code after workspace is loaded/created
        const initialRaw = generateSketch(workspaceRef.current);
        const initialCode = wrapInSketch(initialRaw);
        onCodeChange?.(initialCode);

        // Handle resize
        const observer = new ResizeObserver(() => {
            if (workspaceRef.current) {
                Blockly.svgResize(workspaceRef.current);
            }
        });
        observer.observe(blocklyDiv.current);

        return () => {
            // Save workspace one final time before cleanup
            if (workspaceRef.current) {
                try {
                    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
                    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
                } catch (error) {
                    console.error("Failed to save workspace on cleanup:", error);
                }
            }
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