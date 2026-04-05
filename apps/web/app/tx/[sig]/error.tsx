"use client";

import { useEffect } from "react";
import SearchForm from "@/components/SearchForm";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TxError({ error }: Props) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry etc. in prod
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Transaction</h1>
      </div>

      <div className="rounded border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-900">
          {headline(error.message)}
        </p>
        <p className="mt-1 font-mono text-xs text-red-700">{error.message}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500">Try another signature:</p>
        <SearchForm />
      </div>
    </main>
  );
}

function headline(message: string): string {
  if (message.includes("Transaction not found")) {
    return "Transaction not found";
  }
  if (
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("base58") ||
    message.toLowerCase().includes("signature")
  ) {
    return "Invalid signature";
  }
  return "RPC error";
}
