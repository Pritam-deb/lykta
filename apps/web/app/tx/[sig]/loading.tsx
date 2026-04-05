export default function TxLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      {/* Header: title + action buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-3 w-96 max-w-full animate-pulse rounded bg-gray-100" />
      </div>

      {/* Banner skeleton */}
      <div className="h-12 w-full animate-pulse rounded border-l-4 border-gray-200 bg-gray-100" />

      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[80, 96, 112, 80, 96, 72].map((w, i) => (
          <div
            key={i}
            className="h-6 animate-pulse rounded-full bg-gray-100"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
      </div>
    </main>
  );
}
