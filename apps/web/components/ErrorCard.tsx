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
      className="ml-1 rounded px-1 py-0.5 text-[10px] text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-300"
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
    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/30">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-800 dark:text-red-200">
          Error
        </span>
        <span className="font-semibold text-red-900 dark:text-red-200">{title}</span>
      </div>

      {/* Message */}
      <p className="mt-2 text-red-800 dark:text-red-300">{error.message}</p>

      {/* Details grid */}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="font-medium text-red-700 dark:text-red-400">Code</dt>
        <dd className="font-mono text-red-900 dark:text-red-200">{formatCode(error.code)}</dd>

        <dt className="font-medium text-red-700 dark:text-red-400">Program</dt>
        <dd className="font-mono text-red-900 dark:text-red-200">
          {truncate(error.programId)}
          <CopyButton text={error.programId} />
        </dd>
      </dl>
    </div>
  );
}
