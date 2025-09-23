import { useState } from "react";
import {
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from "@/utils/investments.client";

function HoldingRow({
  row,
  onChange,
  onRemove,
}: {
  row: any;
  onChange: (r: any) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 items-center">
      <input
        className="bg-gray-900/60 border border-gray-700 rounded p-2"
        placeholder="Symbol"
        value={row.symbol || ""}
        onChange={(e) =>
          onChange({ ...row, symbol: e.target.value.toUpperCase() })
        }
      />
      <input
        className="bg-gray-900/60 border border-gray-700 rounded p-2"
        placeholder="Quantity"
        type="number"
        value={row.quantity ?? ""}
        onChange={(e) => onChange({ ...row, quantity: Number(e.target.value) })}
      />
      <input
        className="bg-gray-900/60 border border-gray-700 rounded p-2"
        placeholder="Avg Price"
        type="number"
        value={row.avgPrice ?? ""}
        onChange={(e) => onChange({ ...row, avgPrice: Number(e.target.value) })}
      />
      <div className="flex gap-2">
        <input
          className="bg-gray-900/60 border border-gray-700 rounded p-2 w-full"
          placeholder="Sector"
          value={row.sector || ""}
          onChange={(e) => onChange({ ...row, sector: e.target.value })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="bg-red-600 hover:bg-red-500 text-white px-2 rounded"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function InvestmentActionCard({
  action,
  payload,
  onResult,
  onCancel,
}: {
  action:
    | "createInvestmentAccount"
    | "updateInvestmentAccount"
    | "deleteInvestmentAccount";
  payload: any;
  onResult: (res: any) => void;
  onCancel: () => void;
}) {
  // Prepopulate priority: addHoldings > patch.addHoldings > patch.holdings > holdings
  const initialAddHoldings = Array.isArray(payload?.addHoldings)
    ? payload.addHoldings
    : Array.isArray((payload as any)?.patch?.addHoldings)
      ? (payload as any).patch.addHoldings
      : Array.isArray((payload as any)?.patch?.holdings)
        ? (payload as any).patch.holdings
        : Array.isArray(payload?.holdings)
          ? payload.holdings
          : [];
  const [form, setForm] = useState<any>({
    ...payload,
    holdings: Array.isArray(payload?.holdings) ? payload.holdings : [],
    addHoldings: initialAddHoldings,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // For update flow, choose whether to append new rows or replace all holdings
  const [patchMode, setPatchMode] = useState<"append" | "replace">("append");

  const handleConfirm = async () => {
    try {
      setBusy(true);
      setError(null);
      if (action === "createInvestmentAccount") {
        const res = await createInvestment({
          institution: form.institution,
          accountType: form.accountType,
          name: form.name,
          balance: Number(form.balance || 0),
          holdings: (form.holdings || [])
            .filter(
              (h: any) =>
                h &&
                h.symbol &&
                !isNaN(Number(h.quantity)) &&
                !isNaN(Number(h.avgPrice))
            )
            .map((h: any) => ({
              ...h,
              quantity: Number(h.quantity),
              avgPrice: Number(h.avgPrice),
            })),
        });
        onResult(res);
      } else if (action === "updateInvestmentAccount") {
        // Build patch from JSON + addHoldings rows
        const editorRows = (form.addHoldings || [])
          .filter(
            (h: any) =>
              h &&
              h.symbol &&
              !isNaN(Number(h.quantity)) &&
              !isNaN(Number(h.avgPrice))
          )
          .map((h: any) => ({
            ...h,
            quantity: Number(h.quantity),
            avgPrice: Number(h.avgPrice),
          }));
        const basePatch = form.patch || {};
        let patch = basePatch;
        if (editorRows.length) {
          patch =
            patchMode === "append"
              ? { ...basePatch, addHoldings: editorRows }
              : { ...basePatch, holdings: editorRows };
        }
        const res = await updateInvestment(form.id, patch);
        onResult(res);
      } else if (action === "deleteInvestmentAccount") {
        const res = await deleteInvestment(form.id);
        onResult(res);
      }
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50 p-4 text-gray-200">
      <div className="text-sm text-gray-300 mb-2">
        Action requires confirmation
      </div>
      <div className="text-lg font-semibold mb-3 capitalize">
        {action.replace(/InvestmentAccount/g, " Investment")}
      </div>

      {action === "createInvestmentAccount" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="bg-gray-900/60 border border-gray-700 rounded p-2"
              placeholder="Institution"
              value={form.institution || ""}
              onChange={(e) =>
                setForm({ ...form, institution: e.target.value })
              }
            />
            <input
              className="bg-gray-900/60 border border-gray-700 rounded p-2"
              placeholder="Account Type"
              value={form.accountType || ""}
              onChange={(e) =>
                setForm({ ...form, accountType: e.target.value })
              }
            />
            <input
              className="bg-gray-900/60 border border-gray-700 rounded p-2"
              placeholder="Name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="bg-gray-900/60 border border-gray-700 rounded p-2"
              placeholder="Balance"
              type="number"
              value={form.balance || 0}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Holdings</div>
            <div className="space-y-2">
              {(form.holdings || []).map((h: any, idx: number) => (
                <HoldingRow
                  key={idx}
                  row={h}
                  onChange={(r) => {
                    const next = [...(form.holdings || [])];
                    next[idx] = r;
                    setForm({ ...form, holdings: next });
                  }}
                  onRemove={() => {
                    const next = [...(form.holdings || [])];
                    next.splice(idx, 1);
                    setForm({ ...form, holdings: next });
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  holdings: [
                    ...(form.holdings || []),
                    { symbol: "", quantity: 0, avgPrice: 0, sector: "" },
                  ],
                })
              }
              className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
            >
              + Add holding
            </button>
          </div>
        </div>
      )}

      {action === "updateInvestmentAccount" && (
        <div className="space-y-3">
          <input
            className="bg-gray-900/60 border border-gray-700 rounded p-2 w-full"
            placeholder="Account ID"
            value={form.id || ""}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <textarea
            className="bg-gray-900/60 border border-gray-700 rounded p-2 w-full"
            placeholder='Patch JSON e.g. {"balance":26000}'
            value={JSON.stringify(form.patch || {}, null, 2)}
            onChange={(e) => {
              try {
                setForm({ ...form, patch: JSON.parse(e.target.value || "{}") });
              } catch {
                /* ignore */
              }
            }}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                {patchMode === "append" ? "Add Holdings" : "Replace Holdings"}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPatchMode("append")}
                  className={`px-2 py-1 rounded ${patchMode === "append" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-200"}`}
                >
                  Append
                </button>
                <button
                  type="button"
                  onClick={() => setPatchMode("replace")}
                  className={`px-2 py-1 rounded ${patchMode === "replace" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-200"}`}
                >
                  Replace
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(form.addHoldings || []).map((h: any, idx: number) => (
                <HoldingRow
                  key={idx}
                  row={h}
                  onChange={(r) => {
                    const next = [...(form.addHoldings || [])];
                    next[idx] = r;
                    setForm({ ...form, addHoldings: next });
                  }}
                  onRemove={() => {
                    const next = [...(form.addHoldings || [])];
                    next.splice(idx, 1);
                    setForm({ ...form, addHoldings: next });
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  addHoldings: [
                    ...(form.addHoldings || []),
                    { symbol: "", quantity: 0, avgPrice: 0, sector: "" },
                  ],
                })
              }
              className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
            >
              + Add holding
            </button>
            {patchMode === "append" ? (
              Array.isArray(form.holdings) && form.holdings.length ? (
                <div className="mt-3 text-xs text-gray-400">
                  Existing holdings will be preserved. New rows are appended.
                </div>
              ) : null
            ) : (
              <div className="mt-3 text-xs text-amber-400">
                Warning: Replace mode will overwrite existing holdings with the
                rows above.
              </div>
            )}
          </div>
        </div>
      )}

      {action === "deleteInvestmentAccount" && (
        <div className="space-y-2">
          <input
            className="bg-gray-900/60 border border-gray-700 rounded p-2 w-full"
            placeholder="Account ID"
            value={form.id || ""}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
        </div>
      )}

      {error ? <div className="text-red-400 text-sm mt-2">{error}</div> : null}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded disabled:opacity-60"
        >
          {busy ? "Working..." : "Confirm"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
