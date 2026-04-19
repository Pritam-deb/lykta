"use client";

import { useState } from "react";
import type { DecodedInstruction } from "@lykta/core";
import InstructionDetail from "@/components/InstructionDetail";

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

interface Props {
  decodedInstructions: DecodedInstruction[];
}

export default function InstructionList({ decodedInstructions }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (decodedInstructions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 48 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--text-3)" }}>No instructions decoded</p>
      </div>
    );
  }

  function toggle(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", marginBottom: 4 }}>Instructions</h3>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>{decodedInstructions.length} top-level instruction{decodedInstructions.length !== 1 ? "s" : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {decodedInstructions.map((ix, i) => {
          const isOpen = expanded.has(i);
          const programLabel = ix.node.programName ?? truncate(ix.node.programId);

          return (
            <div key={i} style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", textAlign: "left",
                  background: "transparent", border: "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11,
                  color: "var(--text-3)", background: "var(--bg-base)",
                  borderRadius: 4, padding: "2px 8px", minWidth: 28, textAlign: "center", flexShrink: 0,
                }}>#{i}</span>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: 13.5, color: "var(--text-1)" }}>{programLabel}</span>
                {ix.name && (
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "var(--cyan)", background: "var(--bg-base)", borderRadius: 4, padding: "2px 8px" }}>
                    {ix.name}
                  </span>
                )}
                {ix.matched ? (
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10.5, color: "var(--green)", background: "color-mix(in oklch, var(--green) 12%, transparent)", padding: "1px 7px", borderRadius: 100 }}>decoded</span>
                ) : (
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10.5, color: "var(--text-3)", background: "var(--bg-3)", padding: "1px 7px", borderRadius: 100 }}>no IDL</span>
                )}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>
                  {ix.accounts.length} accounts
                </span>
                <span style={{ color: "var(--text-3)", fontSize: 11, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
              </button>

              {isOpen && (
                <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}>
                  <InstructionDetail ix={ix} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
