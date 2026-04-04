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

function DeltaCell({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-gray-400">0</span>;
  }
  if (delta > 0) {
    return (
      <span className="text-green-600">+{lamportsToSol(delta)}</span>
    );
  }
  return <span className="text-red-500">{lamportsToSol(delta)}</span>;
}

interface Props {
  accountDiffs: AccountDiff[];
}

export default function AccountDiffTable({ accountDiffs }: Props) {
  if (accountDiffs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No SOL balance changes
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-2 font-medium">Account</th>
            <th className="px-4 py-2 font-medium">Pre (SOL)</th>
            <th className="px-4 py-2 font-medium">Post (SOL)</th>
            <th className="px-4 py-2 font-medium">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {accountDiffs.map((diff) => (
            <tr key={diff.address} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-gray-700">
                {truncate(diff.address)}
              </td>
              <td className="px-4 py-2 font-mono text-gray-600">
                {lamportsToSol(diff.lamports.pre)}
              </td>
              <td className="px-4 py-2 font-mono text-gray-600">
                {lamportsToSol(diff.lamports.post)}
              </td>
              <td className="px-4 py-2 font-mono font-medium">
                <DeltaCell delta={diff.lamports.delta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
