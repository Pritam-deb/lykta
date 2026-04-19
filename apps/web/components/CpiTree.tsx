"use client";

import { useState } from "react";
import type { CpiNode } from "@lykta/core";

function truncate(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface NodeProps {
  node: CpiNode;
  isLast: boolean;
  prefixes: boolean[];
}

function TreeNode({ node, isLast, prefixes }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const label = node.programName ?? truncate(node.programId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Tree guide lines */}
        {prefixes.map((hasContinuation, i) => (
          <span
            key={i}
            style={{
              display: "inline-block", width: 24, flexShrink: 0,
              color: "var(--border-2)",
              fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 14,
            }}
          >
            {hasContinuation ? "│" : " "}
          </span>
        ))}
        {node.depth > 0 && (
          <span style={{
            display: "inline-block", width: 24, flexShrink: 0,
            color: "var(--border-2)",
            fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 14,
          }}>
            {isLast ? "└" : "├"}─
          </span>
        )}

        {/* Node card */}
        <div
          onClick={() => hasChildren && setExpanded(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: 7, padding: "7px 12px",
            margin: "3px 0",
            cursor: hasChildren ? "pointer" : "default",
            transition: "border-color 0.15s, background 0.15s",
            flex: 1, maxWidth: 600,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-2)";
          }}
        >
          {hasChildren && (
            <span style={{
              fontSize: 9, color: "var(--text-3)",
              display: "inline-block", transition: "transform 0.2s",
              transform: expanded ? "rotate(90deg)" : "none",
              userSelect: "none", flexShrink: 0,
            }}>▶</span>
          )}
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: node.failed ? "var(--red)" : "var(--green)",
            display: "inline-block",
          }} />
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: 13.5, color: "var(--text-1)" }}>
            {label}
          </span>
          {node.instructionName && (
            <span style={{
              fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11.5,
              color: "var(--cyan)", background: "var(--bg-base)", borderRadius: 4, padding: "1px 7px",
            }}>
              {node.instructionName}
            </span>
          )}
          {node.computeUnits && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
              {node.computeUnits.consumed.toLocaleString()} CU
            </span>
          )}
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10.5, color: "var(--text-3)", flexShrink: 0 }}>
            {truncate(node.programId)}
          </span>
        </div>
      </div>

      {expanded && node.children.map((child, i) => (
        <TreeNode
          key={i}
          node={child}
          isLast={i === node.children.length - 1}
          prefixes={[...prefixes, !isLast && node.depth > 0]}
        />
      ))}
    </div>
  );
}

interface Props {
  cpiTree: CpiNode[];
}

export default function CpiTree({ cpiTree }: Props) {
  const totalNodes = countNodes(cpiTree);
  const maxDepth = getMaxDepth(cpiTree, 0);

  if (cpiTree.length === 0) {
    return (
      <div style={{ padding: 24, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--text-3)", textAlign: "center", paddingTop: 48 }}>
        No CPI data available
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", marginBottom: 4 }}>CPI Call Graph</h3>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-3)" }}>
            Cross-program invocation tree · {totalNodes} program{totalNodes !== 1 ? "s" : ""} invoked
          </p>
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "var(--text-3)", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px" }}>
          depth: {maxDepth}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        {cpiTree.map((root, i) => (
          <TreeNode key={i} node={root} isLast={i === cpiTree.length - 1} prefixes={[]} />
        ))}
      </div>
    </div>
  );
}

function countNodes(nodes: CpiNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

function getMaxDepth(nodes: CpiNode[], current: number): number {
  if (nodes.length === 0) return current;
  return Math.max(...nodes.map(n => getMaxDepth(n.children, current + 1)));
}
