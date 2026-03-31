// src/pages/EditorPage.jsx
import { useState, useCallback} from "react";
import BlocklyEditor from "../components/BlocklyEditor";
import MonacoPanel from "../components/MonacoEditor";

const DEFAULT_CODE = `#include <Arduino.h>\n\n// Add blocks to generate code`;
const CODE_STORAGE_KEY = "orbits_generated_code";

export default function EditorPage() {
    // Initialize state from localStorage or default
    const [cppCode, setCppCode] = useState(() => {
        const saved = localStorage.getItem(CODE_STORAGE_KEY);
        return saved || DEFAULT_CODE;
    });

    const handleCodeChange = useCallback((code: any) => {
        setCppCode(code);
        // Persist generated code to localStorage
        localStorage.setItem(CODE_STORAGE_KEY, code);
    }, []);

    const handleSendToBackend = async () => {
        await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: cppCode })
        });
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
            </div>

            {/* Split editor layout */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Blockly - left half */}
                <div style={{ flex: 1, position: "relative", borderRight: "1px solid #333" }}>
                    <BlocklyEditor onCodeChange={handleCodeChange} />
                </div>

                {/* Monaco - right half */}
                <div style={{flex: 0.5, overflow: "hidden" }}>
                    <MonacoPanel code={cppCode} />
                </div>
            </div>
        </div>
    );
}