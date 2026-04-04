import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Lykta</h1>
        <p className="text-sm text-gray-500">
          Paste a Solana transaction signature to decode it.
        </p>
      </div>
      <SearchForm />
    </main>
  );
}
