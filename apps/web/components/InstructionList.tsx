"use client";

import { useState } from "react";
import type { DecodedInstruction } from "@lykta/core";
import InstructionDetail from "@/components/InstructionDetail";

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function IdlBadge({ matched }: { matched: boolean }) {
  if (matched) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
        decoded
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
      no IDL
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface Props {
  decodedInstructions: DecodedInstruction[];
}

export default function InstructionList({ decodedInstructions }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (decodedInstructions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No instructions decoded
      </p>
    );
  }

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
      {decodedInstructions.map((ix, i) => {
        const isOpen = expanded.has(i);
        const programLabel =
          ix.node.programName ?? truncate(ix.node.programId);

        return (
          <div key={i} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
            {/* Collapsed row */}
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <ChevronIcon open={isOpen} />

              <span className="w-6 shrink-0 text-center font-mono text-xs text-gray-400 dark:text-gray-500">
                {i}
              </span>

              <span className="min-w-[140px] font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                {programLabel}
              </span>

              <span className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                {ix.name ?? (
                  <span className="italic text-gray-400 dark:text-gray-500">unknown</span>
                )}
              </span>

              <IdlBadge matched={ix.matched} />
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <InstructionDetail ix={ix} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
