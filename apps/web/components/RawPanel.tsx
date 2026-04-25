"use client";

import { useState } from "react";

interface Props {
  json: string;
}

function colorize(str: string): string {
  return str
    .replace(/("([^"]+)":)/g, '<span style="color:var(--cyan);">$1</span>')
    .replace(/: ("([^"\\]|\\.)*")/g, ': <span style="color:var(--amber);">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:var(--red);">$1</span>')
    .replace(/: (-?\d+(\.\d+)?([eE][+-]?\d+)?)(,?\n)/g, ': <span style="color:var(--green);">$1</span>$4');
}

export default function RawPanel({ json }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(json).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)",
      }}>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>Raw Transaction JSON</span>
        <button
          onClick={copy}
          style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: 5, padding: "4px 12px",
            fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12.5,
            color: copied ? "var(--green)" : "var(--text-2)",
            cursor: "pointer", transition: "color 0.2s",
          }}
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>
      <div style={{ padding: "16px 20px", overflowY: "auto", maxHeight: 520 }}>
        <pre
          style={{ margin: 0, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12.5, lineHeight: 1.7, color: "var(--text-2)" }}
          dangerouslySetInnerHTML={{ __html: colorize(json) }}
        />
      </div>
    </div>
  );
}
