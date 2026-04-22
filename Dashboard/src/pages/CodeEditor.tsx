// src/pages/EditorPage.jsx
import { useCallback, useRef, useState } from "react";
import { message } from "antd";
import BlocklyEditor, { type BlocklyEditorHandle } from "../components/BlocklyEditor";
import MonacoPanel from "../components/MonacoEditor";

const DEFAULT_CODE = `#include <Arduino.h>\n\n// Add blocks to generate code`;
const CODE_STORAGE_KEY = "orbits_generated_code";

export default function EditorPage() {
    const blocklyEditorRef = useRef<BlocklyEditorHandle>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state from localStorage or default
    const [cppCode, setCppCode] = useState(() => {
        const saved = localStorage.getItem(CODE_STORAGE_KEY);
        return saved || DEFAULT_CODE;
    });

    const handleCodeChange = useCallback((code: string) => {
        setCppCode(code);
        // Persist generated code to localStorage
        localStorage.setItem(CODE_STORAGE_KEY, code);
    }, []);

    const handleExportWorkspace = useCallback(() => {
        const workspaceXml = blocklyEditorRef.current?.exportWorkspace();

        if (!workspaceXml) {
            message.warning("Blockly workspace is not ready yet.");
            return;
        }

        const blob = new Blob([workspaceXml], { type: "application/xml" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `orbits-blockly-workspace-${new Date().toISOString().replace(/[:.]/g, "-")}.xml`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
    }, []);

    const handleLoadWorkspaceClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleWorkspaceFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const workspaceXml = await file.text();
            blocklyEditorRef.current?.importWorkspace(workspaceXml);
            message.success(`Loaded ${file.name}`);
        } catch (error) {
            console.error("Failed to load Blockly workspace:", error);
            message.error("That file could not be loaded as a Blockly workspace.");
        } finally {
            event.target.value = "";
        }
    }, []);

    const handleSendToBackend = async () => {
        try {
            await fetch("/api/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: cppCode })
            });
        } catch (error) {
            console.error('Failed to send code to backend:', error);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }}>
            {/* Toolbar */}
            <div style={{
                padding: "8px 16px",
                background: "#252526",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderBottom: "1px solid #333"
            }}>
                <h1 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Orbits Editor</h1>
                <button
                    onClick={handleLoadWorkspaceClick}
                    style={{
                        padding: "6px 16px",
                        background: "#374151",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}>
                    Load Blockly XML
                </button>
                <button
                    onClick={handleExportWorkspace}
                    style={{
                        padding: "6px 16px",
                        background: "#374151",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}>
                    Export Blockly XML
                </button>
                <button
                    onClick={handleSendToBackend}
                    style={{
                        marginLeft: "auto",
                        padding: "6px 16px",
                        background: "#0D47A1",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}>
                    Send to Backend
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml,application/xml,text/xml"
                    style={{ display: "none" }}
                    onChange={handleWorkspaceFileSelected}
                />
            </div>

            {/* Split editor layout */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Blockly - left half */}
                <div style={{ flex: 1, position: "relative", borderRight: "1px solid #333" }}>
                    <BlocklyEditor ref={blocklyEditorRef} onCodeChange={handleCodeChange} />
                </div>

                {/* Monaco - right half */}
                <div style={{flex: 0.5, overflow: "hidden" }}>
                    <MonacoPanel code={cppCode} />
                </div>
            </div>
        </div>
    );
}