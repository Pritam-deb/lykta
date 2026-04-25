import type { AccountDiff } from "@lykta/core";

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000)
    .toFixed(9)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

interface Props {
  accountDiffs: AccountDiff[];
}

export default function AccountDiffTable({ accountDiffs }: Props) {
  if (accountDiffs.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 48 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--text-3)" }}>No SOL balance changes</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", marginBottom: 4 }}>Account Diffs</h3>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>{accountDiffs.length} account{accountDiffs.length !== 1 ? "s" : ""} modified · lamport changes</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Account", "Before (SOL)", "After (SOL)", "Δ SOL"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accountDiffs.map((diff) => {
              const delta = diff.lamports.delta;
              const pos = delta > 0;
              return (
                <tr
                  key={diff.address}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{truncate(diff.address)}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{lamportsToSol(diff.lamports.pre)}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-2)" }}>{lamportsToSol(diff.lamports.post)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: delta === 0 ? "var(--text-3)" : pos ? "var(--green)" : "var(--red)" }}>
                    {delta === 0 ? "—" : (pos ? "+" : "") + lamportsToSol(delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
