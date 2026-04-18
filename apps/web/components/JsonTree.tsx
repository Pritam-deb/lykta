"use client";

import { useState } from "react";

function Primitive({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="italic text-gray-400 dark:text-gray-500">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-gray-600 dark:text-gray-300">&quot;{value}&quot;</span>;
  }
  return <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>;
}

function CollapsibleNode({
  label,
  children,
  defaultOpen,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-left font-mono text-xs hover:text-black dark:hover:text-white"
      >
        <svg
          className={`h-2.5 w-2.5 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        {!open && (
          <span className="text-gray-400 dark:text-gray-500">{label.endsWith("]") ? "…]" : "…}"}</span>
        )}
      </button>
      {open && <div className="ml-4 border-l border-gray-100 pl-2 dark:border-gray-700">{children}</div>}
    </div>
  );
}

interface Props {
  data: unknown;
  depth?: number;
}

export default function JsonTree({ data, depth = 0 }: Props) {
  if (data === null || typeof data !== "object") {
    return (
      <span className="font-mono text-xs">
        <Primitive value={data} />
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="font-mono text-xs text-gray-400 dark:text-gray-500">[]</span>;
    }
    return (
      <CollapsibleNode label={`[${data.length}]`} defaultOpen={depth === 0}>
        {data.map((item, i) => (
          <div key={i} className="flex gap-1 font-mono text-xs">
            <span className="shrink-0 text-gray-400 dark:text-gray-500">{i}:</span>
            <JsonTree data={item} depth={depth + 1} />
          </div>
        ))}
      </CollapsibleNode>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) {
    return <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{"{}"}</span>;
  }

  return (
    <CollapsibleNode label="{}" defaultOpen={depth === 0}>
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-1 font-mono text-xs">
          <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300">{key}:</span>
          <JsonTree data={val} depth={depth + 1} />
        </div>
      ))}
    </CollapsibleNode>
  );
}
