type Props = {
  id: string;
  label?: string;
  content?: string;
  status?: "processing" | "streaming" | "done" | "error";
  errorMessage?: string;
  tokensApprox?: number;
  costApproxUSD?: number;
};

export default function ModelResultCard({
  id,
  label,
  content,
  status = "processing",
  errorMessage,
  tokensApprox,
  costApproxUSD,
}: Props) {
  const statusBadge = (() => {
    const base = "model-result-card__status-badge px-2 py-0.5 rounded text-xs";
    if (status === "error")
      return (
        <span
          className={`${base} model-result-card__status-badge--error bg-red-500/20 text-red-300`}
        >
          error
        </span>
      );
    if (status === "done")
      return (
        <span
          className={`${base} model-result-card__status-badge--done bg-emerald-500/20 text-emerald-300`}
        >
          done
        </span>
      );
    if (status === "streaming")
      return (
        <span
          className={`${base} model-result-card__status-badge--streaming bg-blue-500/20 text-blue-300`}
        >
          streaming
        </span>
      );
    return (
      <span
        className={`${base} model-result-card__status-badge--processing bg-gray-500/20 text-gray-300`}
      >
        processing
      </span>
    );
  })();
  return (
    <div className="model-result-card rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50">
      <div className="model-result-card__header p-4 flex items-center justify-between">
        <div className="model-result-card__title text-white font-semibold flex items-center gap-2">
          <span className="model-result-card__label">{label || id}</span>
          {statusBadge}
        </div>
        <div className="model-result-card__id text-xs text-gray-400">{id}</div>
      </div>
      <div className="model-result-card__body px-4 pb-4 overflow-y-auto max-h-[10vh]">
        {status === "error" ? (
          <div className="model-result-card__error text-sm text-red-300">
            {errorMessage || "This model failed while processing."}
          </div>
        ) : content ? (
          <div className="model-result-card__content text-sm text-gray-200 whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <>
            <div className="model-result-card__placeholder-text text-sm text-gray-300">
              Waiting for stream…
            </div>
            <div className="model-result-card__skeleton mt-3 space-y-2">
              <div className="model-result-card__skeleton-line h-3 rounded bg-gray-700/60" />
              <div className="model-result-card__skeleton-line h-3 rounded bg-gray-700/50" />
              <div className="model-result-card__skeleton-line h-3 rounded bg-gray-700/40 w-2/3" />
            </div>
          </>
        )}
        <div className="model-result-card__footer mt-3 text-xs text-gray-400 flex gap-4">
          {typeof tokensApprox === "number" ? (
            <span className="model-result-card__tokens">
              ~{Math.max(0, Math.floor(tokensApprox))} tokens
            </span>
          ) : null}
          {typeof costApproxUSD === "number" ? (
            <span className="model-result-card__cost">
              ~${costApproxUSD.toFixed(4)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
