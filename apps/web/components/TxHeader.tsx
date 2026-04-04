"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Cluster = "mainnet-beta" | "devnet" | "testnet";

const CLUSTERS: { value: Cluster; label: string }[] = [
  { value: "mainnet-beta", label: "Mainnet" },
  { value: "devnet", label: "Devnet" },
  { value: "testnet", label: "Testnet" },
];

function explorerUrl(sig: string, cluster: Cluster): string {
  const base = "https://explorer.solana.com/tx/" + sig;
  return cluster === "mainnet-beta" ? base : `${base}?cluster=${cluster}`;
}

interface Props {
  sig: string;
  cluster: Cluster;
}

export default function TxHeader({ sig, cluster }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // non-secure context — ignore
    }
  }

  function onClusterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Cluster;
    const url =
      next === "mainnet-beta"
        ? `/tx/${sig}`
        : `/tx/${sig}?cluster=${next}`;
    router.push(url);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Transaction</h1>

        <div className="flex items-center gap-2">
          {/* Cluster selector */}
          <select
            value={cluster}
            onChange={onClusterChange}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:border-gray-300 focus:outline-none"
          >
            {CLUSTERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Explorer link */}
          <a
            href={explorerUrl(sig, cluster)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            Explorer ↗
          </a>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <p className="break-all font-mono text-xs text-gray-500">{sig}</p>
    </div>
  );
}
