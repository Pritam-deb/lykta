import type { Cluster } from "@/components/TxHeader";

interface Props {
  sig: string;
  cluster: Cluster;
  success: boolean;
  fee: number;
  slot: number;
  blockTime: number | null;
  totalCu: number;
  ixCount: number;
  tokenCount: number;
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000)
    .toFixed(9)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function StatusBadge({ success }: { success: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: success
        ? "color-mix(in oklch, var(--green) 12%, transparent)"
        : "color-mix(in oklch, var(--red) 12%, transparent)",
      border: `1px solid ${success
        ? "color-mix(in oklch, var(--green) 35%, transparent)"
        : "color-mix(in oklch, var(--red) 35%, transparent)"}`,
      color: success ? "var(--green)" : "var(--red)",
      borderRadius: 6, padding: "4px 10px",
      fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: 12.5,
    }}>
      <span style={{ fontSize: 10 }}>{success ? "✓" : "✗"}</span>
      {success ? "Success" : "Failed"}
    </div>
  );
}

export default function TxStatusBanner({
  sig, cluster, success, fee, slot, blockTime, totalCu, ixCount, tokenCount,
}: Props) {
  const time = blockTime !== null
    ? new Date(blockTime * 1000).toUTCString().replace("GMT", "UTC")
    : "Unknown";

  const shortSig = sig.slice(0, 8) + "…" + sig.slice(-8);

  const chips = [
    { label: `${totalCu.toLocaleString()} CU consumed`, color: "var(--cyan)" },
    { label: `${ixCount} instruction${ixCount !== 1 ? "s" : ""}`, color: "var(--text-3)" },
    { label: `${tokenCount} token transfer${tokenCount !== 1 ? "s" : ""}`, color: tokenCount > 0 ? "var(--amber)" : "var(--text-3)" },
  ];

  return (
    <>
      {/* TX header card */}
      <div
        data-testid="tx-status-banner"
        style={{
          background: "var(--bg-1)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <StatusBadge success={success} />
              <span style={{
                fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "var(--text-3)",
                background: "var(--bg-2)", borderRadius: 5, padding: "2px 8px",
                border: "1px solid var(--border)",
              }}>{cluster}</span>
            </div>
            <div style={{
              fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13,
              color: "var(--text-2)", letterSpacing: "0.01em",
              wordBreak: "break-all", lineHeight: 1.5,
            }}>
              {sig}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexShrink: 0, flexWrap: "wrap" }}>
            {[
              ["BLOCK",     `#${slot.toLocaleString()}`],
              ["TIMESTAMP", time              ],
              ["FEE",       `${lamportsToSol(fee)} SOL`],
              ["SIGNER",    shortSig          ],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, color: "var(--text-3)", marginBottom: 4, letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "var(--text-1)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {chips.map((chip, i) => (
          <div key={i} style={{
            fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12.5, color: chip.color,
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: 100, padding: "4px 12px",
          }}>{chip.label}</div>
        ))}
      </div>
    </>
  );
}
