"use client";

import type { DecodedInstruction } from "@lykta/core";
import JsonTree from "@/components/JsonTree";

function CopyButton({ text }: { text: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // non-secure context — ignore silently
    }
  }
  return (
    <button
      onClick={copy}
      title={text}
      className="ml-1 rounded px-1 py-0.5 text-[10px] text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    >
      copy
    </button>
  );
}

function truncate(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

interface Props {
  ix: DecodedInstruction;
}

export default function InstructionDetail({ ix }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── Args ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Args
        </h3>

        {ix.args !== null ? (
          <div className="rounded border border-gray-200 bg-white p-3">
            <JsonTree data={ix.args} depth={0} />
          </div>
        ) : (
          <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">
              No IDL available — raw data only
            </p>
            <p className="mt-2 break-all font-mono text-[11px] text-gray-700">
              {ix.rawHex}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              discriminator: {ix.discriminatorHex}
            </p>
          </div>
        )}
      </div>

      {/* ── Accounts ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Accounts
        </h3>

        {ix.accounts.length === 0 ? (
          <p className="text-xs text-gray-400">No accounts</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ix.accounts.map((acc, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono text-gray-400">{i}</td>
                    <td className="px-3 py-1.5 text-gray-700">
                      {acc.name || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-gray-600">
                      {truncate(acc.address)}
                      <CopyButton text={acc.address} />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex gap-1">
                        {acc.writable && (
                          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                            writable
                          </span>
                        )}
                        {acc.signer && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            signer
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
