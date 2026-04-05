"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SearchForm() {
  const router = useRouter();
  const [sig, setSig] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = sig.trim();
    if (!trimmed) {
      setError("Paste a transaction signature first.");
      return;
    }
    setError(null);
    router.push(`/tx/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Transaction signature…"
          spellCheck={false}
          className="flex-1 rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Decode
        </button>
      </div>
      {error !== null && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </form>
  );
}
