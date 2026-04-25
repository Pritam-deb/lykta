"use client";

import type { LyktaError } from "@lykta/core";

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function formatCode(code: number | string): string {
  if (typeof code === "number") {
    return `${code} (0x${code.toString(16).toUpperCase()})`;
  }
  return code;
}

function CopyButton({ text }: { text: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // non-secure context — ignore silently
    }
  }
  return (
    <button
      onClick={copy}
      title={text}
      style={{
        marginLeft: 8, borderRadius: 4, padding: "1px 6px",
        fontSize: 10, fontFamily: "var(--font-dm-sans), sans-serif",
        color: "var(--red)", background: "color-mix(in oklch, var(--red) 8%, transparent)",
        border: "none", cursor: "pointer",
      }}
    >
      copy
    </button>
  );
}

interface Props {
  error: LyktaError | undefined;
}

export default function ErrorCard({ error }: Props) {
  if (error === undefined) return null;

  const title = error.name ?? "Unknown error";

  return (
    <div style={{
      background: "color-mix(in oklch, var(--red) 6%, transparent)",
      border: "1px solid color-mix(in oklch, var(--red) 30%, transparent)",
      borderLeft: "3px solid var(--red)",
      borderRadius: 8, padding: 16, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{
          fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11,
          color: "var(--red)", background: "color-mix(in oklch, var(--red) 12%, transparent)",
          padding: "2px 8px", borderRadius: 4,
        }}>
          {title}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13.5, color: "var(--text-1)", lineHeight: 1.6, marginBottom: 12 }}>
        {error.message}
      </p>
      {error.suggestion && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 12 }}>
          <strong style={{ color: "var(--text-1)" }}>Fix:</strong> {error.suggestion}
        </p>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.05em" }}>CODE</span>
          <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "var(--red)", marginTop: 2 }}>{formatCode(error.code)}</div>
        </div>
        <div>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.05em" }}>PROGRAM</span>
          <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
            {truncate(error.programId)}
            <CopyButton text={error.programId} />
          </div>
        </div>
      </div>
    </div>
  );
}
