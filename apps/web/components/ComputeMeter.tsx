import type { CuUsage } from "@lykta/core";

const TX_LIMIT = 1_400_000;

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

interface Props {
  cuUsage: CuUsage[];
  totalCu: number;
}

export default function ComputeMeter({ cuUsage, totalCu }: Props) {
  if (cuUsage.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 48 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--text-3)" }}>No compute data</p>
      </div>
    );
  }

  const txPct = Math.min((totalCu / TX_LIMIT) * 100, 100);
  const utilColor = txPct > 80 ? "var(--red)" : txPct > 50 ? "var(--amber)" : "var(--green)";

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", marginBottom: 4 }}>Compute Telemetry</h3>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 28 }}>Per-program compute unit breakdown</p>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {[
          { label: "CONSUMED",    value: totalCu.toLocaleString(),  unit: "CU",         color: "var(--cyan)"    },
          { label: "BUDGET",      value: TX_LIMIT.toLocaleString(), unit: "CU",         color: "var(--text-2)"  },
          { label: "UTILIZATION", value: `${Math.round(txPct)}%`,  unit: "of budget",  color: utilColor        },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 140 }}>
            <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11.5, color: "var(--text-3)", letterSpacing: "0.06em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 26, color: card.color, letterSpacing: "-0.03em" }}>{card.value}</div>
            <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{card.unit}</div>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-2)" }}>Budget utilization</span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "var(--text-1)" }}>{Math.round(txPct)}%</span>
        </div>
        <div style={{ height: 8, background: "var(--bg-base)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${txPct}%`, background: "linear-gradient(90deg, var(--cyan), var(--green))", transition: "width 1s ease" }} />
        </div>
      </div>

      {/* Per-program breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cuUsage.map((cu, i) => (
          <div key={cu.instructionIndex}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13.5, color: "var(--text-1)" }}>
                  {truncate(cu.programId)}
                </span>
                {cu.isOverBudget && (
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10.5, color: "var(--red)", background: "color-mix(in oklch, var(--red) 12%, transparent)", padding: "1px 6px", borderRadius: 4 }}>
                    over budget
                  </span>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "var(--text-1)" }}>
                {cu.consumed.toLocaleString()} CU
              </span>
            </div>
            <div style={{ height: 5, background: "var(--bg-base)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.min(cu.percentUsed, 100)}%`,
                background: cu.isOverBudget ? "var(--red)" : i === 0 ? "var(--cyan)" : i === 1 ? "var(--green)" : "var(--border-2)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
