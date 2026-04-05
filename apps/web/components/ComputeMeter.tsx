import type { CuUsage } from "@lykta/core";

const TX_LIMIT = 1_400_000;

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function barColor(percentUsed: number, isOverBudget: boolean): string {
  if (isOverBudget) return "bg-red-900";
  if (percentUsed > 80) return "bg-red-500";
  if (percentUsed >= 50) return "bg-amber-400";
  return "bg-green-500";
}

function Bar({
  percent,
  isOverBudget,
}: {
  percent: number;
  isOverBudget: boolean;
}) {
  const width = Math.min(percent, 100);
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className={`h-2 rounded-full transition-all ${barColor(percent, isOverBudget)}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

interface Props {
  cuUsage: CuUsage[];
  totalCu: number;
}

export default function ComputeMeter({ cuUsage, totalCu }: Props) {
  if (cuUsage.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">No compute data</p>
    );
  }

  const txPercent = (totalCu / TX_LIMIT) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Total tx utilization */}
      <div className="rounded border border-gray-200 p-4">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="font-medium text-gray-700">Transaction total</span>
          <span className="font-mono text-gray-500">
            {totalCu.toLocaleString()} / {TX_LIMIT.toLocaleString()} CU
          </span>
        </div>
        <Bar percent={txPercent} isOverBudget={false} />
      </div>

      {/* Per-instruction rows */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-2 font-medium">Program</th>
              <th className="px-4 py-2 font-medium">Consumed</th>
              <th className="px-4 py-2 font-medium">Limit</th>
              <th className="w-40 px-4 py-2 font-medium">Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cuUsage.map((cu) => (
              <tr
                key={cu.instructionIndex}
                className={cu.isOverBudget ? "bg-red-50" : "hover:bg-gray-50"}
              >
                <td className="px-4 py-2 font-mono text-gray-700">
                  {truncate(cu.programId)}
                  {cu.isOverBudget && (
                    <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      over budget
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-gray-600">
                  {cu.consumed.toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-gray-600">
                  {cu.limit.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Bar
                      percent={cu.percentUsed}
                      isOverBudget={cu.isOverBudget ?? false}
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-gray-500">
                      {Math.round(cu.percentUsed)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
