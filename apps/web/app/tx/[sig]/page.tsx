import { Connection } from "@solana/web3.js";
import { decodeTransaction } from "@lykta/core";
import TxTabs from "@/components/TxTabs";
import TxStatusBanner from "@/components/TxStatusBanner";
import ErrorCard from "@/components/ErrorCard";

function bigintReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString() + "n";
  return value;
}

interface Props {
  params: { sig: string };
}

export default async function TxPage({ params }: Props) {
  const rpcUrl = process.env.HELIUS_RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      "HELIUS_RPC_URL is not set. Add it to .env.local or your Vercel environment variables."
    );
  }

  const connection = new Connection(rpcUrl, "confirmed");

  let content: React.ReactNode;

  try {
    const tx = await decodeTransaction(params.sig, connection);

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
          success={tx.success}
          fee={tx.fee}
          slot={tx.slot}
          blockTime={tx.blockTime}
          totalCu={tx.totalCu}
        />
        <ErrorCard error={tx.error} />
        <TxTabs
          cpiTree={tx.cpiTree}
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
    content = (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Failed to decode transaction</p>
        <p className="mt-1 font-mono text-xs">{message}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Transaction</h1>
        <p className="break-all font-mono text-xs text-gray-500">{params.sig}</p>
      </div>
      {content}
    </main>
  );
}
