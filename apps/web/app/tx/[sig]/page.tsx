import { cache } from "react";
import { Connection } from "@solana/web3.js";
import { decodeTransaction } from "@lykta/core";
import type { Metadata } from "next";
import TxTabs from "@/components/TxTabs";
import TxStatusBanner from "@/components/TxStatusBanner";
import ErrorCard from "@/components/ErrorCard";
import TxHeader, { type Cluster } from "@/components/TxHeader";

function bigintReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString() + "n";
  return value;
}

// Recursively converts BigInt values to "<n>n" strings so the result
// is safe to pass as a prop from a server component to a client component.
function serializeValue(v: unknown): unknown {
  if (typeof v === "bigint") return v.toString() + "n";
  if (Array.isArray(v)) return v.map(serializeValue);
  if (v !== null && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k,
        serializeValue(val),
      ]),
    );
  }
  return v;
}

function rpcUrlForCluster(cluster: Cluster): string {
  if (cluster === "localnet") {
    return process.env.LOCALNET_RPC_URL ?? "http://127.0.0.1:8899";
  }
  if (cluster === "devnet") {
    return process.env.HELIUS_RPC_URL_DEVNET ?? "https://api.devnet.solana.com";
  }
  if (cluster === "testnet") {
    return "https://api.testnet.solana.com";
  }
  const url = process.env.HELIUS_RPC_URL;
  if (!url) throw new Error("HELIUS_RPC_URL is not set. Add it to .env.local or your Vercel environment variables.");
  return url;
}

// Deduplicate the RPC call between generateMetadata and the page component
const getTransaction = cache(async (sig: string, cluster: Cluster) => {
  const connection = new Connection(rpcUrlForCluster(cluster), "confirmed");
  return decodeTransaction(sig, connection);
});

interface Props {
  params: { sig: string };
  searchParams: { cluster?: string };
}

function parseCluster(raw: string | undefined): Cluster {
  if (raw === "devnet" || raw === "testnet" || raw === "localnet") return raw;
  return "mainnet-beta";
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const cluster = parseCluster(searchParams.cluster);
  const shortSig = `${params.sig.slice(0, 8)}…`;

  try {
    const tx = await getTransaction(params.sig, cluster);
    const status = tx.success ? "Success" : "Failed";
    const feeSol = (tx.fee / 1_000_000_000).toFixed(6);
    const ixCount = tx.decodedInstructions.length;
    const title = `Tx ${shortSig} — ${status} · Lykta`;
    const description = `Slot ${tx.slot} · Fee ${feeSol} SOL · ${ixCount} instruction${ixCount !== 1 ? "s" : ""}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return { title: `Tx ${shortSig} — Lykta` };
  }
}

export default async function TxPage({ params, searchParams }: Props) {
  const cluster = parseCluster(searchParams.cluster);

  let content: React.ReactNode;

  try {
    const tx = await getTransaction(params.sig, cluster);

    const serializedTokenDiffs = tx.tokenDiffs.map((d) => ({
      accountIndex: d.accountIndex,
      address:      d.address,
      mint:         d.mint,
      owner:        d.owner,
      decimals:     d.decimals,
      preAmount:    d.preAmount.toString(),
      postAmount:   d.postAmount.toString(),
      delta:        d.delta.toString(),
      uiDelta:      d.uiDelta,
    }));

    content = (
      <>
        <TxStatusBanner
          sig={params.sig}
          cluster={cluster}
          success={tx.success}
          fee={tx.fee}
          slot={tx.slot}
          blockTime={tx.blockTime}
          totalCu={tx.totalCu}
          ixCount={tx.decodedInstructions.length}
          tokenCount={tx.tokenDiffs.length}
        />
        <ErrorCard error={tx.error} />
        <TxTabs
          cpiTree={tx.cpiTree}
          decodedInstructions={tx.decodedInstructions.map((ix) => ({
            ...ix,
            args:
              ix.args !== null
                ? (serializeValue(ix.args) as Record<string, unknown>)
                : null,
          }))}
          accountDiffs={tx.accountDiffs}
          tokenDiffs={serializedTokenDiffs}
          cuUsage={tx.cuUsage}
          totalCu={tx.totalCu}
          rawJson={JSON.stringify(tx, bigintReplacer, 2)}
        />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const headline = message.includes("Transaction not found")
      ? "Transaction not found"
      : message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("base58")
        ? "Invalid signature"
        : "RPC error";
    content = (
      <div style={{
        background: "color-mix(in oklch, var(--red) 6%, transparent)",
        border: "1px solid color-mix(in oklch, var(--red) 30%, transparent)",
        borderLeft: "3px solid var(--red)",
        borderRadius: 8, padding: 16,
      }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: 14, color: "var(--red)", marginBottom: 6 }}>{headline}</p>
        <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "var(--text-2)" }}>{message}</p>
      </div>
    );
  }

  return (
    <>
      <TxHeader sig={params.sig} cluster={cluster} />
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2.5rem)" }}>
        {content}
      </main>
    </>
  );
}
