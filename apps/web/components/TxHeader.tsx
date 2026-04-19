"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LyktaLogo from "@/components/LyktaLogo";

export type Cluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

const CLUSTERS: { value: Cluster; label: string }[] = [
  { value: "mainnet-beta", label: "mainnet-beta" },
  { value: "devnet",       label: "devnet"       },
  { value: "testnet",      label: "testnet"      },
  { value: "localnet",     label: "localnet"     },
];

function explorerUrl(sig: string, cluster: Cluster): string {
  const base = "https://explorer.solana.com/tx/" + sig;
  if (cluster === "mainnet-beta") return base;
  if (cluster === "localnet") return `${base}?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899`;
  return `${base}?cluster=${cluster}`;
}

interface Props {
  sig: string;
  cluster: Cluster;
}

const btnStyle: React.CSSProperties = {
  background: "var(--bg-2)", border: "1px solid var(--border)",
  borderRadius: 6, padding: "5px 12px",
  fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12.5, color: "var(--text-2)",
  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  textDecoration: "none", transition: "color 0.15s, border-color 0.15s",
};

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
    const url = next === "mainnet-beta" ? `/tx/${sig}` : `/tx/${sig}?cluster=${next}`;
    router.push(url);
  }

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 clamp(1rem, 3vw, 2.5rem)",
      height: 56,
      borderBottom: "1px solid var(--border)",
      background: "var(--nav-bg)",
      backdropFilter: "blur(20px)",
    }}>
      <button
        onClick={() => router.push("/")}
        style={{ ...btnStyle, gap: 6 }}
      >
        <span>←</span>
        <span>Back</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LyktaLogo small />
        <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)" }}>Lykta</span>
      </div>

      <select
        value={cluster}
        onChange={onClusterChange}
        style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 6, padding: "4px 8px",
          fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12.5, color: "var(--text-2)",
          cursor: "pointer", outline: "none",
        }}
      >
        {CLUSTERS.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button
          onClick={copyLink}
          style={{ ...btnStyle, color: copied ? "var(--green)" : "var(--text-2)" }}
        >
          {copied ? "✓ Copied" : "⎘ Copy Link"}
        </button>
        <a
          href={explorerUrl(sig, cluster)}
          target="_blank"
          rel="noopener noreferrer"
          style={btnStyle}
        >
          ↗ Explorer
        </a>
      </div>
    </nav>
  );
}
