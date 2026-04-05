interface Props {
  success: boolean;
  fee: number;
  slot: number;
  blockTime: number | null;
  totalCu: number;
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000)
    .toFixed(9)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

export default function TxStatusBanner({
  success,
  fee,
  slot,
  blockTime,
  totalCu,
}: Props) {
  const time =
    blockTime !== null
      ? new Date(blockTime * 1000).toUTCString()
      : "Unknown";

  return (
    <div
      data-testid="tx-status-banner"
      className={[
        "flex flex-wrap items-center gap-x-6 gap-y-1 rounded border-l-4 px-4 py-3 text-sm",
        success
          ? "border-green-500 bg-green-50 text-green-900"
          : "border-red-500 bg-red-50 text-red-900",
      ].join(" ")}
    >
      {/* Status badge */}
      <span
        className={[
          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
          success
            ? "bg-green-200 text-green-800"
            : "bg-red-200 text-red-800",
        ].join(" ")}
      >
        {success ? "Success" : "Failed"}
      </span>

      <span className="text-xs">
        <span className="font-medium">Fee</span>{" "}
        <span className="font-mono">{lamportsToSol(fee)} SOL</span>
      </span>

      <span className="text-xs">
        <span className="font-medium">Slot</span>{" "}
        <span className="font-mono">{slot.toLocaleString()}</span>
      </span>

      <span className="text-xs">
        <span className="font-medium">Time</span>{" "}
        <span className="font-mono">{time}</span>
      </span>

      <span className="text-xs">
        <span className="font-medium">Compute</span>{" "}
        <span className="font-mono">{totalCu.toLocaleString()} CU</span>
      </span>
    </div>
  );
}
