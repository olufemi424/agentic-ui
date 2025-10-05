### Multi-Model UI Incremental Rollout Plan (agentic-ui)

Purpose: Deliver the multi-model UI in small, reviewable PRs with clear acceptance criteria and safe rollbacks.

## Step 0 — Branch and scaffolding (PR-0)
- Create branch `feature/multi-model-ui`.
- Ensure docs from `MULTI_MODEL_UI_PLAN.md` are in place.

Acceptance
- Branch exists and CI passes with no code changes beyond docs.

Rollback
- Delete branch.

---

## Step 1 — UI shell: `MultiModelPanel` (PR-1)
- Add `src/components/MultiModelPanel.tsx` with model selector (static list), temperature slider, and "Run" button (`type="button"`).
- Mount `MultiModelPanel` in `src/routes/index.tsx` below existing chat.
- No network calls yet.

Acceptance
- Panel renders; interacting with controls does not reload or navigate.
- ESLint/TS compile clean.

Tests
- Manual: Enter/Click in controls; verify no `document` requests.

Rollback
- Remove component import and file.

---

## Step 2 — Client message shape & state wiring (PR-2)
- On "Run", submit a chat turn through existing `useChat` with a metadata payload `{ models: [ids], temperature }` embedded in the user message or as a specialized part.
- No server changes yet; server ignores extra metadata.

Acceptance
- Network shows a single `POST /api/demo-chat` on Run.
- No errors thrown; UI remains stable.

Tests
- Manual: Run with 1–3 models selected; confirm transport fires once.

Rollback
- Remove the message-enrichment code.

---

## Step 3 — Data-part keys and render placeholders (PR-3)
- Add `ModelResultCard.tsx` with placeholder states keyed by `mm-{session}-{modelId}`.
- Render one `ModelResultCard` per selected model after submit.
- Still no server streams consumed (use local placeholder state).

Acceptance
- After clicking Run, N cards render matching selected models.
- Cards persist while the user types; no reloads.

Tests
- Manual: Toggle model selections and rerun; cards reflect selection set.

Rollback
- Remove placeholder rendering; keep `MultiModelPanel`.

---

## Step 4 — Server orchestration: parallel model streams (PR-4)
- Update `src/routes/api.demo-chat.ts` to detect `{ models[] }` and fork per-model streaming using existing `streamText/streamObject` primitives.
- Emit parts:
  - `data-multi-model-status` (overall)
  - `data-model-plan` per model (processing→streaming→done)
  - `data-model-output` per model (outline/content streaming)
- Preserve existing single-model behavior when `{ models }` absent.

Acceptance
- With models selected, the response streams multiple interleaved parts.
- Without models, current app behavior unchanged.

Tests
- Manual: DevTools → Network → verify chunked streaming and interleaved parts.

Rollback
- Guard new logic behind feature flag; flip off.

---

## Step 5 — Client render from streams (PR-5)
- In `MultiModelPanel`, subscribe to `useChat().messages` and filter parts by `id`/`modelId`.
- Replace placeholders with real streaming content in `ModelResultCard`.
- Maintain per-card ephemeral UI state keyed by `id`.

Acceptance
- Each card renders progressive updates; outline/content grow live.
- No full-page reloads; console free of navigation warnings.

Tests
- Manual: Run 2–3 models; verify independent progress.

Rollback
- Feature flag to revert to placeholders.

---

## Step 6 — Error isolation and partial failure (PR-6)
- Ensure a failure in one model marks only that model `error`; others continue.
- Visual error state in `ModelResultCard`.

Acceptance
- Simulated provider failure affects only its card; others finish.

Tests
- Inject an error for one model id; verify behavior.

Rollback
- Fallback to generic error message without stopping other streams.

---

## Step 7 — Token/cost counters (optional) (PR-7)
- If usage data is available, stream incremental token/cost into `data-model-output` and render at the card footer.

Acceptance
- Counters increase monotonically; never NaN/negative.

Tests
- Manual: Long generations show multiple counter increments.

Rollback
- Hide counters with feature flag.

---

## Step 8 — Side-channel actions (PR-8)
- Add `/api/multi-model-action` for actions: Stop, Rerun, Promote to Final.
- Buttons in `ModelResultCard` call the side-channel; do not invoke `sendMessage`.

Acceptance
- Actions do not trigger a new chat turn or reload.

Tests
- Manual: Click actions and verify only the target card updates.

Rollback
- Disable action buttons via feature flag.

---

## Step 9 — Provider capability matrix (PR-9)
- Detect available providers via env; disable or hide unavailable models in selector.

Acceptance
- Only models with credentials are selectable.

Tests
- Manual: Toggle env; verify selector updates.

Rollback
- Return to static selector list.

---

## Step 10 — Docs & polish (PR-10)
- Update `README.md` quickstart.
- Add a short troubleshooting section.

Acceptance
- Docs match the feature; screenshots included.

Tests
- Manual doc review.

Rollback
- Revert doc changes.

---

## Review Checklist (for each PR)
- Code compiles (TypeScript) and lints cleanly
- No accidental form submits or anchor navigations
- Network panel: no `document` requests during interactions
- HMR shows hot updates, not full reloads, during local interactions
- Stream reconciliation: stable keys; no remount thrash
- Feature-flag/guard present where applicable
- Docs updated if user-facing behavior changed

## Test Matrix
- Browsers: Chrome (latest), Safari (latest)
- Models selected: 1, 2, 3
- Failure mode: one model errors; others succeed
- Long run: streams > 30s (observe counters and UI responsiveness)
- Navigation: open/close mini assistant while streaming; ensure no reloads
- Accessibility: keyboard-only navigation of `MultiModelPanel` and per-card actions
