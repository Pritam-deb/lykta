"use client";

/**
 * BigInt fields (preAmount, postAmount, delta) are serialized to strings
 * before being passed across the Next.js server→client boundary.
 */
export interface SerializedTokenDiff {
  accountIndex: number;
  address:  string;
  mint:     string;
  owner:    string;
  decimals: number;
  preAmount:  string;
  postAmount: string;
  delta:      string;
  uiDelta:    string;
}

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

interface Props {
  tokenDiffs: SerializedTokenDiff[];
}

export default function TokenDiffTable({ tokenDiffs }: Props) {
  if (tokenDiffs.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 48 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--text-3)" }}>No token transfers</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", marginBottom: 4 }}>Token Diffs</h3>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>{tokenDiffs.length} token balance change{tokenDiffs.length !== 1 ? "s" : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tokenDiffs.map((d, i) => {
          const pos = d.uiDelta.startsWith("+") || (!d.uiDelta.startsWith("-") && d.uiDelta !== "0");
          const neg = d.uiDelta.startsWith("-");
          const accentColor = neg ? "var(--red)" : pos ? "var(--green)" : "var(--border)";
          const mintLabel = d.mint.length > 8 ? d.mint.slice(0, 4) : d.mint;

          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: 8, padding: "14px 18px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--bg-3)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: 11,
                  color: "var(--text-2)", flexShrink: 0,
                }}>
                  {mintLabel.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-1)" }}>
                    {truncate(d.mint)}
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "var(--text-3)" }}>
                    {truncate(d.owner)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 16, fontWeight: 700, color: accentColor }}>
                  {neg ? d.uiDelta : `+${d.uiDelta}`}
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "var(--text-3)" }}>
                  {truncate(d.address)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
