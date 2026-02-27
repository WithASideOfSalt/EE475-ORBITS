// src/components/MonacoEditor/index.jsx
import Editor from "@monaco-editor/react";

export default function MonacoPanel({ code }: { code: string }) {
    return (
        <Editor
            height="100%"
            language="cpp"
            theme="vs-dark"
            value={code}
            options={{
                readOnly: true,       // blocks are the source of truth
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: "on",
                folding: true,
                wordWrap: "on"
            }}
        />
    );
}