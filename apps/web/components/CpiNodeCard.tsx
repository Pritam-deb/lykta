"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import type { CpiNodeData } from "@/lib/treeToReactFlow";

function truncateId(programId: string): string {
  if (programId.length <= 16) return programId;
  return `${programId.slice(0, 8)}…${programId.slice(-4)}`;
}

export default function CpiNodeCard({ data }: NodeProps<CpiNodeData>) {
  const { cpiNode } = data;
  const failed = cpiNode.failed;
  const label = cpiNode.programName ?? truncateId(cpiNode.programId);

  return (
    <>
      <Handle type="target" position={Position.Top} />

      <div
        title={failed && cpiNode.failReason ? cpiNode.failReason : undefined}
        className={[
          "min-w-[160px] rounded bg-white px-3 py-2 shadow-md",
          "border-l-4 text-xs",
          failed ? "border-red-500" : "border-green-500",
        ].join(" ")}
      >
        {/* Program label */}
        <p className="font-mono font-semibold leading-tight text-gray-800">
          {label}
        </p>

        {/* Success / fail badge */}
        <div className="mt-1.5 flex items-center gap-2">
          {failed ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
              failed
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              ok
            </span>
          )}

          {/* CU consumption — only when present */}
          {cpiNode.computeUnits !== undefined && (
            <span className="text-[10px] text-gray-400">
              {cpiNode.computeUnits.consumed.toLocaleString()} /{" "}
              {cpiNode.computeUnits.limit.toLocaleString()} CU
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
