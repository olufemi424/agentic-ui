# BEM Classes Guide - Agentic UI

This document lists all BEM (Block Element Modifier) classes added to components for identification and grouping purposes. All Tailwind CSS classes are preserved.

## Completed Components

###  1. ModelResultCard

**Block**: `model-result-card`

**Elements**:
- `model-result-card__header` - Card header container
- `model-result-card__title` - Title container with label and badge
- `model-result-card__label` - Model label text
- `model-result-card__id` - Model ID display
- `model-result-card__body` - Card body container
- `model-result-card__error` - Error message display
- `model-result-card__content` - Streamed content display
- `model-result-card__placeholder-text` - Placeholder waiting text
- `model-result-card__skeleton` - Skeleton loader container
- `model-result-card__skeleton-line` - Individual skeleton line
- `model-result-card__footer` - Footer with stats
- `model-result-card__tokens` - Token count display
- `model-result-card__cost` - Cost display
- `model-result-card__status-badge` - Status badge base
- `model-result-card__status-badge--error` - Error status badge
- `model-result-card__status-badge--done` - Done status badge
- `model-result-card__status-badge--streaming` - Streaming status badge
- `model-result-card__status-badge--processing` - Processing status badge

### 2. MultiModelPanel

**Block**: `multi-model-panel`

**Elements**:
- `multi-model-panel__container` - Main container
- `multi-model-panel__header` - Header with title and compact toggle
- `multi-model-panel__title` - Panel title
- `multi-model-panel__compact-toggle` - Compact/Expand toggle button
- `multi-model-panel__controls` - Controls grid container
- `multi-model-panel__models-section` - Models selection section
- `multi-model-panel__section-label` - Section label text
- `multi-model-panel__models-list` - List of model options
- `multi-model-panel__model-option` - Individual model checkbox label
- `multi-model-panel__model-checkbox` - Model checkbox input
- `multi-model-panel__model-label` - Model label text
- `multi-model-panel__temperature-section` - Temperature control section
- `multi-model-panel__temperature-slider` - Temperature range input
- `multi-model-panel__footer` - Footer with selected info and run button
- `multi-model-panel__selected-info` - Selected models info text
- `multi-model-panel__run-button` - Run button
- `multi-model-panel__dev-actions` - Dev-only action buttons container
- `multi-model-panel__dev-action` - Dev action button base
- `multi-model-panel__dev-action--error` - Simulate error button
- `multi-model-panel__dev-action--done` - Mark all done button
- `multi-model-panel__results-wrapper` - Results wrapper (with compact mode)
- `multi-model-panel__results` - Results grid container

## Remaining Components To Update

### 3. InvestmentAccountCard

**Suggested Block**: `investment-account-card`

**Suggested Elements**:
- `investment-account-card__header`
- `investment-account-card__name`
- `investment-account-card__id`
- `investment-account-card__institution`
- `investment-account-card__type`
- `investment-account-card__balance`
- `investment-account-card__holdings`
- `investment-account-card__holding-item`

### 4. InvestmentActionCard

**Suggested Block**: `investment-action-card`

**Suggested Elements**:
- `investment-action-card__header`
- `investment-action-card__title`
- `investment-action-card__form`
- `investment-action-card__input`
- `investment-action-card__holdings-editor`
- `investment-action-card__holding-row`
- `investment-action-card__add-button`
- `investment-action-card__error`
- `investment-action-card__actions`
- `investment-action-card__confirm-button`
- `investment-action-card__cancel-button`

### 5. InvestmentInsightsCard

**Suggested Block**: `investment-insights-card`

**Suggested Elements**:
- `investment-insights-card__header`
- `investment-insights-card__totals`
- `investment-insights-card__by-institution`
- `investment-insights-card__by-sector`
- `investment-insights-card__top-holding`

### 6. example-GuitarRecommendation

**Suggested Block**: `guitar-recommendation`

**Suggested Elements**:
- `guitar-recommendation__image`
- `guitar-recommendation__body`
- `guitar-recommendation__name`
- `guitar-recommendation__description`
- `guitar-recommendation__footer`
- `guitar-recommendation__price`
- `guitar-recommendation__button`

### 7. example-ItemCard

**Suggested Block**: `item-card`

**Suggested Elements**:
- `item-card__image`
- `item-card__body`
- `item-card__title`
- `item-card__description`
- `item-card__footer`
- `item-card__id`
- `item-card__button`

### 8. Header

**Suggested Block**: `app-header`

**Suggested Elements**:
- `app-header__nav`
- `app-header__nav-link`
- `app-header__user`

### 9. example-AIAssistant (Mini Chat)

**Suggested Block**: `chat-mini` (already exists!)

**Existing Elements** (already in code, document only):
- `chat-mini__toggle`
- `chat-mini__panel`
- `chat-mini__panel-header`
- `chat-mini__close`
- `chat-mini__messages`
- `chat-mini__message`
- `chat-mini__message--assistant`
- `chat-mini__message--user`
- `chat-mini__message-body`
- `chat-mini__avatar`
- `chat-mini__avatar--assistant`
- `chat-mini__avatar--user`
- `chat-mini__content`
- `chat-mini__markdown`
- `chat-mini__tool-card`
- `chat-mini__tool-card--recommend-guitar`
- `chat-mini__footer`
- `chat-mini__controls`
- `chat-mini__input`
- `chat-mini__send`

### 10. index.tsx (Main Chat)

**Suggested Block**: `chat` (partially exists!)

**Existing Elements** (already in code, document only):
- `chat__initial`
- `chat__initial-inner`
- `chat__footer`
- `chat__messages`
- `chat__message`
- `chat__message--assistant`
- `chat__message--user`
- `chat__message-body`
- `chat__avatar`
- `chat__avatar--assistant`
- `chat__avatar--user`
- `chat__content`
- `chat__markdown`
- `chat__tts`
- `chat__tool-card`
- `chat__tool-card--recommend-guitar`
- `chat__tool-card--investments`
- `chat__tool-card--investment`
- `chat__tool-card--delete`
- `chat__tool-card--insights`
- `chat__tool-card--proposed`
- `chat__tool-card--items`
- `chat__tool-card--item`
- `chat__panel`
- `chat__form`
- `chat__controls`
- `chat__input`
- `chat__mic`
- `chat__send`

### 11. tts-button

**Suggested Block**: `tts-button`

**Suggested Elements**:
- `tts-button__icon`
- `tts-button__spinner`

### 12. transcribe-button

**Suggested Block**: `transcribe-button`

**Suggested Elements**:
- `transcribe-button__icon`
- `transcribe-button__recording-indicator`

## BEM Naming Convention

**Pattern**: `block__element--modifier`

- **Block**: Standalone component (e.g., `model-result-card`)
- **Element**: Part of a block (e.g., `model-result-card__header`)
- **Modifier**: Variation of block or element (e.g., `model-result-card__status-badge--error`)

## Usage Example

```tsx
// Before
<div className="rounded-lg overflow-hidden border">
  <div className="p-4">
    <span className="text-white">Title</span>
  </div>
</div>

// After (with BEM + Tailwind)
<div className="my-component rounded-lg overflow-hidden border">
  <div className="my-component__header p-4">
    <span className="my-component__title text-white">Title</span>
  </div>
</div>
```

## Benefits

1. **Identification**: Quickly identify component boundaries in DevTools
2. **Grouping**: Group related elements visually
3. **No Conflicts**: BEM prevents class name collisions
4. **Compatibility**: Works alongside Tailwind CSS utility classes
5. **Testing**: E2E tests can target semantic class names
6. **Debugging**: Easier to trace CSS issues to specific components

## Implementation Status

- ✅ ModelResultCard
- ✅ MultiModelPanel
- ⏳ InvestmentAccountCard (pending)
- ⏳ InvestmentActionCard (pending)
- ⏳ InvestmentInsightsCard (pending)
- ⏳ GuitarRecommendation (pending)
- ⏳ ItemCard (pending)
- ⏳ Header (pending)
- ⏳ TTSButton (pending)
- ⏳ TranscribeButton (pending)
- 📝 AIAssistant (already has BEM)
- 📝 Main Chat (already has BEM)

---

**Last Updated**: 2025-10-03
**Related**: See AGENTIC_UI_ARCHITECTURE.md for component hierarchy
