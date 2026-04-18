"use client";

import { useState } from "react";
import type { CpiNode, AccountDiff, CuUsage, DecodedInstruction } from "@lykta/core";
import CpiGraph from "@/components/CpiGraph";
import AccountDiffTable from "@/components/AccountDiff";
import TokenDiffTable, { type SerializedTokenDiff } from "@/components/TokenDiff";
import ComputeMeter from "@/components/ComputeMeter";
import InstructionList from "@/components/InstructionList";

type Tab = "cpi" | "instructions" | "accounts" | "tokens" | "compute" | "raw";

const TABS: { id: Tab; label: string }[] = [
  { id: "cpi",          label: "CPI Tree" },
  { id: "instructions", label: "Instructions" },
  { id: "accounts",     label: "Account Diffs" },
  { id: "tokens",       label: "Token Diffs" },
  { id: "compute",      label: "Compute" },
  { id: "raw",          label: "Raw JSON" },
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
  cpiTree,
  decodedInstructions,
  accountDiffs,
  tokenDiffs,
  cuUsage,
  totalCu,
  rawJson,
}: Props) {
  const [active, setActive] = useState<Tab>("cpi");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === "cpi" && <CpiGraph cpiTree={cpiTree} />}

      {active === "instructions" && (
        <InstructionList decodedInstructions={decodedInstructions} />
      )}

      {active === "accounts" && (
        <AccountDiffTable accountDiffs={accountDiffs} />
      )}

      {active === "tokens" && (
        <TokenDiffTable tokenDiffs={tokenDiffs} />
      )}

      {active === "compute" && (
        <ComputeMeter cuUsage={cuUsage} totalCu={totalCu} />
      )}

      {active === "raw" && (
        <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-950 p-4 text-xs leading-relaxed text-gray-100 dark:border-gray-700">
          {rawJson}
        </pre>
      )}
    </div>
  );
}
