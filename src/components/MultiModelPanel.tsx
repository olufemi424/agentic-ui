import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import ModelResultCard from "./ModelResultCard";

type ModelOption = {
  id: string;
  label: string;
};

export default function MultiModelPanel({
  onRun,
  messages,
}: {
  onRun?: (payload: { models: string[]; temperature: number }) => void;
  messages?: Array<UIMessage>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastRun, setLastRun] = useState<{
    models: string[];
    temperature: number;
  } | null>(null);
  const [statusByModel, setStatusByModel] = useState<
    Record<
      string,
      {
        status: "processing" | "streaming" | "done" | "error";
        errorMessage?: string;
      }
    >
  >({});

  const [compact, setCompact] = useState<boolean>(false);

  const [models, setModels] = useState<ModelOption[]>([
    { id: "openai:gpt-4o-mini", label: "OpenAI: gpt-4o-mini" },
    {
      id: "anthropic:claude-3-5-sonnet",
      label: "Anthropic: Claude 3.5 Sonnet",
    },
    { id: "mistral:large-latest", label: "Mistral: Large (latest)" },
  ]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) return;
        const data = await res.json();
        if (aborted) return;
        if (Array.isArray(data?.models) && data.models.length) {
          setModels(data.models);
          // Unselect any models that are no longer present
          setSelected((prev) => {
            const allowed = new Set(
              (data.models as ModelOption[]).map((m) => m.id)
            );
            const next: Record<string, boolean> = {};
            for (const k of Object.keys(prev))
              if (allowed.has(k)) next[k] = prev[k];
            return next;
          });
        }
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const submitBtn = target.closest('button[type="submit"]');
      const anchor = target.closest("a[href]");
      if (submitBtn || (anchor && !anchor.getAttribute("data-allow-nav"))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("submit", onSubmit, { capture: true });
    el.addEventListener("click", onClick, { capture: true });
    return () => {
      el.removeEventListener("submit", onSubmit, { capture: true } as any);
      el.removeEventListener("click", onClick, { capture: true } as any);
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectedIds = useMemo(
    () => models.filter((m) => selected[m.id]).map((m) => m.id),
    [models, selected]
  );

  const latestAssistantText = useMemo(() => {
    if (!messages?.length) return "";
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i] as any;
      if (m?.role === "assistant" && Array.isArray(m?.parts)) {
        const text = m.parts
          .filter((p: any) => p?.type === "text" && typeof p?.text === "string")
          .map((p: any) => p.text)
          .join("\n");
        if (text) return text;
      }
    }
    return "";
  }, [messages]);

  // Very rough token estimate: 4 chars/token heuristic
  const tokensApprox = useMemo(() => {
    if (!latestAssistantText) return undefined;
    return Math.max(0, Math.floor(latestAssistantText.length / 4));
  }, [latestAssistantText]);

  // Demo cost estimate (speculative): $0.000002 per token
  const costApproxUSD = useMemo(() => {
    if (typeof tokensApprox !== "number") return undefined;
    return tokensApprox * 0.000002;
  }, [tokensApprox]);

  return (
    <div
      ref={containerRef}
      className="multi-model-panel max-w-3xl mx-auto w-full px-4 py-6"
    >
      <div className="multi-model-panel__container rounded-lg border border-orange-500/20 bg-gray-800/50 p-4">
        <div className="multi-model-panel__header flex items-center justify-between">
          <h2 className="multi-model-panel__title text-white font-semibold">
            Multi-Model Runner
          </h2>
          <button
            type="button"
            className="multi-model-panel__compact-toggle text-xs rounded-md bg-gray-700/60 hover:bg-gray-700 text-gray-200 px-2 py-1"
            onClick={() => setCompact((v) => !v)}
            aria-pressed={compact}
            title={compact ? "Expand" : "Compact"}
          >
            {compact ? "Expand" : "Compact"}
          </button>
        </div>

        {!compact ? (
          <div className="multi-model-panel__controls mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="multi-model-panel__models-section">
              <div className="multi-model-panel__section-label text-sm text-gray-300 mb-2">
                Models
              </div>
              <div className="multi-model-panel__models-list space-y-2">
                {models.map((m) => (
                  <label
                    key={m.id}
                    className="multi-model-panel__model-option flex items-center gap-2 text-sm text-gray-200"
                  >
                    <input
                      type="checkbox"
                      className="multi-model-panel__model-checkbox"
                      checked={!!selected[m.id]}
                      onChange={() => toggle(m.id)}
                    />
                    <span className="multi-model-panel__model-label">
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="multi-model-panel__temperature-section">
              <div className="multi-model-panel__section-label text-sm text-gray-300 mb-2">
                Temperature ({temperature.toFixed(2)})
              </div>
              <input
                type="range"
                className="multi-model-panel__temperature-slider w-full"
                min={0}
                max={1}
                step={0.01}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Selected: {selectedIds.length ? selectedIds.join(", ") : "None"}
          </div>
          <button
            type="button"
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onRun) {
                onRun({ models: selectedIds, temperature });
              }
              setLastRun({ models: selectedIds, temperature });
              setStatusByModel(
                Object.fromEntries(
                  selectedIds.map((id) => [
                    id,
                    { status: "processing" as const },
                  ])
                )
              );
            }}
          >
            Run
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && lastRun?.models.length ? (
          <div className="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded"
              onClick={() => {
                const id = lastRun.models[0];
                setStatusByModel((s) => ({
                  ...s,
                  [id]: { status: "error", errorMessage: "Simulated failure" },
                }));
              }}
            >
              Simulate Error (first model)
            </button>
            <button
              type="button"
              className="bg-emerald-700/80 hover:bg-emerald-700 text-white px-2 py-1 rounded"
              onClick={() => {
                setStatusByModel((s) => {
                  const next = { ...s };
                  for (const k of Object.keys(next))
                    next[k] = { status: "done" } as any;
                  return next;
                });
              }}
            >
              Mark All Done
            </button>
          </div>
        ) : null}

        {lastRun && lastRun.models.length ? (
          <div
            className={`mt-6 ${compact ? "max-h-[60vh] overflow-y-auto pr-1" : ""}`}
          >
            <div className="grid grid-cols-1 gap-4">
              {lastRun.models.map((mid) => (
                <ModelResultCard
                  key={mid}
                  id={`mm-session-${mid}`}
                  label={mid}
                  content={latestAssistantText}
                  status={statusByModel[mid]?.status || "processing"}
                  errorMessage={statusByModel[mid]?.errorMessage}
                  tokensApprox={tokensApprox}
                  costApproxUSD={costApproxUSD}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
