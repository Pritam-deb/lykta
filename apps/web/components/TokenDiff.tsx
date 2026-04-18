"use client";

/**
 * BigInt fields (preAmount, postAmount, delta) are serialized to strings
 * before being passed across the Next.js server→client boundary.
 */
export interface SerializedTokenDiff {
  accountIndex: number;
  address: string;
  mint: string;
  owner: string;
  decimals: number;
  preAmount: string;
  postAmount: string;
  delta: string;
  uiDelta: string;
}

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function formatAmount(raw: string, decimals: number): string {
  const n = BigInt(raw);
  if (decimals === 0) return n.toString();
  const s = n.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, s.length - decimals) || "0";
  const fracPart = s.slice(s.length - decimals).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function UiDeltaCell({ uiDelta }: { uiDelta: string }) {
  if (uiDelta.startsWith("-")) {
    return <span className="text-red-500 dark:text-red-400">{uiDelta}</span>;
  }
  if (/^0(\.0+)?$/.test(uiDelta)) {
    return <span className="text-gray-400 dark:text-gray-500">{uiDelta}</span>;
  }
  return <span className="text-green-600 dark:text-green-400">+{uiDelta}</span>;
}

function CopyButton({ text }: { text: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable in non-secure context — silently ignore
    }
  }

  return (
    <button
      onClick={copy}
      title={text}
      className="ml-1 rounded px-1 py-0.5 text-[10px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
    >
      copy
    </button>
  );
}

interface Props {
  tokenDiffs: SerializedTokenDiff[];
}

export default function TokenDiffTable({ tokenDiffs }: Props) {
  if (tokenDiffs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No token transfers
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <th className="px-4 py-2 font-medium">Mint</th>
            <th className="px-4 py-2 font-medium">Owner</th>
            <th className="px-4 py-2 font-medium">Pre</th>
            <th className="px-4 py-2 font-medium">Post</th>
            <th className="px-4 py-2 font-medium">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {tokenDiffs.map((diff) => (
            <tr key={`${diff.mint}-${diff.accountIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">
                {truncate(diff.mint)}
                <CopyButton text={diff.mint} />
              </td>
              <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">
                {truncate(diff.owner)}
              </td>
              <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">
                {formatAmount(diff.preAmount, diff.decimals)}
              </td>
              <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">
                {formatAmount(diff.postAmount, diff.decimals)}
              </td>
              <td className="px-4 py-2 font-mono font-medium">
                <UiDeltaCell uiDelta={diff.uiDelta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
