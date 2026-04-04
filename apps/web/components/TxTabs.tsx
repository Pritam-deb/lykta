"use client";

import { useState } from "react";
import type { CpiNode, AccountDiff } from "@lykta/core";
import CpiGraph from "@/components/CpiGraph";
import AccountDiffTable from "@/components/AccountDiff";
import TokenDiffTable, { type SerializedTokenDiff } from "@/components/TokenDiff";

type Tab = "cpi" | "accounts" | "tokens" | "raw";

const TABS: { id: Tab; label: string }[] = [
  { id: "cpi",      label: "CPI Tree" },
  { id: "accounts", label: "Account Diffs" },
  { id: "tokens",   label: "Token Diffs" },
  { id: "raw",      label: "Raw JSON" },
];

interface Props {
  cpiTree:      CpiNode[];
  accountDiffs: AccountDiff[];
  tokenDiffs:   SerializedTokenDiff[];
  rawJson:      string;
}

export default function TxTabs({ cpiTree, accountDiffs, tokenDiffs, rawJson }: Props) {
  const [active, setActive] = useState<Tab>("cpi");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-b-2 border-black text-black"
                : "text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === "cpi" && <CpiGraph cpiTree={cpiTree} />}

      {active === "accounts" && (
        <AccountDiffTable accountDiffs={accountDiffs} />
      )}

      {active === "tokens" && (
        <TokenDiffTable tokenDiffs={tokenDiffs} />
      )}

      {active === "raw" && (
        <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-950 p-4 text-xs leading-relaxed text-gray-100">
          {rawJson}
        </pre>
      )}
    </div>
  );
}
