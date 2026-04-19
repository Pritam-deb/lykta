"use client";

import { useState } from "react";
import type { CpiNode, AccountDiff, CuUsage, DecodedInstruction } from "@lykta/core";
import CpiTree from "@/components/CpiTree";
import AccountDiffTable from "@/components/AccountDiff";
import TokenDiffTable, { type SerializedTokenDiff } from "@/components/TokenDiff";
import ComputeMeter from "@/components/ComputeMeter";
import InstructionList from "@/components/InstructionList";
import RawPanel from "@/components/RawPanel";

type Tab = "cpi" | "instructions" | "accounts" | "tokens" | "compute" | "raw";

const TABS: { id: Tab; label: string }[] = [
  { id: "cpi",          label: "CPI Tree"      },
  { id: "instructions", label: "Instructions"  },
  { id: "accounts",     label: "Account Diffs" },
  { id: "tokens",       label: "Token Diffs"   },
  { id: "compute",      label: "Compute"       },
  { id: "raw",          label: "Raw JSON"      },
];

interface Props {
  cpiTree:             CpiNode[];
  decodedInstructions: DecodedInstruction[];
  accountDiffs:        AccountDiff[];
  tokenDiffs:          SerializedTokenDiff[];
  cuUsage:             CuUsage[];
  totalCu:             number;
  rawJson:             string;
}

export default function TxTabs({
  cpiTree, decodedInstructions, accountDiffs, tokenDiffs, cuUsage, totalCu, rawJson,
}: Props) {
  const [active, setActive] = useState<Tab>("cpi");

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 2,
        borderBottom: "1px solid var(--border)",
        overflowX: "auto",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              background: "transparent", border: "none",
              borderBottom: active === tab.id ? "2px solid var(--green)" : "2px solid transparent",
              padding: "10px 16px",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: active === tab.id ? 600 : 400,
              fontSize: 13.5,
              color: active === tab.id ? "var(--text-1)" : "var(--text-2)",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "color 0.15s, border-color 0.15s",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div style={{
        background: "var(--bg-1)", border: "1px solid var(--border)",
        borderTop: "none", borderRadius: "0 0 12px 12px",
        minHeight: 440,
      }}>
        {active === "cpi"          && <CpiTree cpiTree={cpiTree} />}
        {active === "instructions" && <InstructionList decodedInstructions={decodedInstructions} />}
        {active === "accounts"     && <AccountDiffTable accountDiffs={accountDiffs} />}
        {active === "tokens"       && <TokenDiffTable tokenDiffs={tokenDiffs} />}
        {active === "compute"      && <ComputeMeter cuUsage={cuUsage} totalCu={totalCu} />}
        {active === "raw"          && <RawPanel json={rawJson} />}
      </div>
    </div>
  );
}
