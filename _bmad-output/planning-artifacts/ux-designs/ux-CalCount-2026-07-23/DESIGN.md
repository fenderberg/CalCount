---
name: CalCount
description: 'Rustige, snelle caloriecoach-PWA — van "ik heb iets gegeten" naar "het staat genoteerd."'
status: final
updated: '2026-07-24'
sources:
  - docs/prd.md
  - docs/architecture.md
  - imports/CalCount.dc.html
colors:
  surface-page: '#f7f1e6'
  surface-card: '#ffffff'
  surface-muted: '#f0e7d6'
  surface-track: '#ece0cd'
  ink: '#2a2621'
  text-muted: '#8a857c'
  text-subtle: '#6f6a63'
  text-faint: '#a39d93'
  budget-under: '#2f8f5e'
  budget-under-gradient-start: '#3aa86c'
  budget-under-gradient-end: '#268a56'
  budget-near: '#d98a2b'
  budget-over: '#d8543f'
  reward: '#8a86d6'
  reward-surface: '#efedf9'
  reward-text: '#5d59b3'
  reward-text-strong: '#4b479c'
  confidence-high: '#2f8f5e'
  confidence-high-surface: '#eef4ef'
  confidence-medium: '#b06d1a'
  confidence-medium-surface: '#f7efe0'
  confidence-low: '#c26a2c'
  confidence-low-surface: '#f7ece2'
  surface-page-dark: '#17140f'
  surface-card-dark: '#211d17'
  ink-dark: '#f3efe8'
  budget-under-dark: '#3fa877'
typography:
  display:
    fontFamily: 'Hanken Grotesk'
    fontWeight: 800
    fontSize: '52-60px'
    letterSpacing: '-0.03em'
  heading-lg:
    fontFamily: 'Hanken Grotesk'
    fontWeight: 800
    fontSize: '27-34px'
    letterSpacing: '-0.02em'
  heading-md:
    fontFamily: 'Hanken Grotesk'
    fontWeight: 700
    fontSize: '20-22px'
  body:
    fontFamily: 'Hanken Grotesk'
    fontWeight: 500
    fontSize: '15-16px'
  label:
    fontFamily: 'Hanken Grotesk'
    fontWeight: 600
    fontSize: '12-13px'
  mono-meta:
    fontFamily: 'ui-monospace, monospace'
    fontSize: '11-12px'
rounded:
  sm: '11px'
  md: '16px'
  lg: '18px'
  xl: '22px'
  '2xl': '30px'
  DEFAULT: '18px'
  full: '9999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '6': '24px'
  tap-target-min: '48px'
components:
  button-primary:
    background: '{colors.ink}'
    color: '{colors.surface-page}'
    radius: '{rounded.lg}'
    padding: '16px'
  button-secondary:
    background: '{colors.surface-muted}'
    color: '{colors.text-subtle}'
    radius: '{rounded.lg}'
  card:
    background: '{colors.surface-card}'
    border: '1px solid rgba(42,38,33,.07)'
    radius: '{rounded.md}'
  ring-progress:
    track: '{colors.surface-track}'
    fill: '{colors.budget-under}'
    strokeWidth: '18px'
    strokeLinecap: 'round'
  badge-confidence:
    radius: '{rounded.full}'
    high: { color: '{colors.confidence-high}', background: '{colors.confidence-high-surface}' }
    medium: { color: '{colors.confidence-medium}', background: '{colors.confidence-medium-surface}' }
    low: { color: '{colors.confidence-low}', background: '{colors.confidence-low-surface}' }
  badge-streak:
    background: '{colors.reward-surface}'
    color: '{colors.reward-text}'
    radius: '{rounded.full}'
  fab:
    size: '62px'
    background: '{colors.ink}'
    color: '{colors.surface-page}'
    radius: '{rounded.full}'
    offset: '-20px translateY (floats above tab bar)'
  tab-bar:
    background: 'rgba(250,248,244,.92)'
    backdropBlur: '14px'
    borderTop: '1px solid rgba(42,38,33,.07)'
  chat-bubble-user:
    background: '{colors.ink}'
    color: '{colors.surface-page}'
    radius: '20px 20px 6px 20px'
  chat-bubble-ai:
    background: '{colors.surface-card}'
    border: '1px solid rgba(42,38,33,.07)'
    radius: '20px 20px 20px 6px'
  slider:
    track: '{colors.surface-track}'
    fill: '{colors.budget-under}'
    thumb: 'white circle, colored ring {colors.budget-under}'
---

# Project Context for Design

> Bronartefact. De definitieve, gecombineerde en actuele designspecificatie staat in
> `docs/design.md` en is bij verschillen leidend.

_Distilled from the external design-tool export (`imports/CalCount.dc.html`), produced 2026-07-24. This file preserves the visual source; `EXPERIENCE.md` preserves the behavioral source._

## Brand & Style

CalCount reads as a warm, editorial "personal ledger," not a clinical health app or a gamified habit-tracker. The palette is a cream/ink pairing (think a nice notebook) with three functional accent families layered on top — never the reverse. Numbers are the hero everywhere: large, tabular, unapologetically dominant over chrome and iconography. Nothing about the surface should feel like it's trying to hook the user back in — gamification elements (streak, badges) sit in a distinct cool-lilac family that's visually subordinate to the warm ink/cream base, signaling "a nice extra," not "the point."

## Colors

Three semantic families, deliberately kept separate so they never collide:

- **Budget** (`budget-under` / `budget-near` / `budget-over` — green/amber/red): the only place red appears in the system. Reserved exclusively for "over budget." **Never reused for anything else** — see Do's and Don'ts.
- **Reward** (`reward` lilac + its light surface/text pair): streak counter and badges only. Deliberately a different hue family from budget-green, so "on track today" and "consistent over time" read as two distinct kinds of good news, not a duplicate signal.
- **Confidence** (`confidence-high/medium/low` — green/amber-brown/orange-brown): AI-estimate trust level on both the AI-text and Foto result screens. **Low confidence is an orange-brown, not red** — it must never be confused with "over budget."

Base surfaces: `surface-page` (warm cream, the app background) is distinct from `surface-card` (pure white, every list item/card) — cards lift off the page via that contrast plus a hairline border, not shadow alone. `ink` is the near-black used for primary text, primary buttons, and the FAB — it is the app's real "accent," doing more visual work than any of the three semantic families.

## Typography

Single family, Hanken Grotesk, carrying the whole weight range (400–800, italic available at 500). Numbers are always `font-variant-numeric: tabular-nums` so they don't jitter when they update. The scale is compressed and confident: a `display` size exists only for the one number that matters most on a given screen (remaining calories, current weight, the correction-screen value) — everything else, including large headings, tops out well below it. `mono-meta` (`ui-monospace`) is a deliberate second voice used only for terse system-y annotations (spec labels, badge counters) — never for anything a user reads as prose.

## Layout & Spacing

Compact base scale (4/8/12/16/24) for in-app density; screens are designed at a 390×844 portrait reference (iPhone-class). Every primary action sits in the bottom third of the screen (thumb zone): the FAB, the tab bar, and primary CTAs on sheets are all bottom-anchored. Minimum tap target 48px, enforced even on secondary icon buttons (day-nav chevrons, stepper +/−).

## Elevation & Depth

Shadows are warm-toned (`rgba(42,38,33,…)`, never pure black) and used sparingly: the outer app "device frame" gets a soft ambient shadow; the FAB gets a stronger, tinted-ink shadow to read as floating above the tab bar; primary brand elements (app icon, onboarding CTA) get a colored shadow matching their own hue (green glow under the green icon). Cards otherwise rely on the card/page color contrast plus a 1px hairline border — not shadow — to separate from the page.

## Shapes

Radius scales with the size and "weight" of the element: small pills and icon tiles ~11px, standard cards/buttons ~16–18px, large sheets/panels ~22–30px, anything circular (FAB, avatar tiles, stepper buttons, pill badges) goes fully round. The bottom sheet used for every logging flow always gets the largest radius (30px) on its top corners only — it's the app's signature "arriving from below" shape.

## Components

See the `components` frontmatter table for token mappings. Two components carry outsized product importance and deserve prose:

- **Confidence badge** — always paired with a `~` prefix on the number, a dotted underline under the value, and a `± n` caption underneath. This three-part treatment (badge + `~` + dotted underline + margin caption) is the system's entire vocabulary for "this is an estimate" — it must appear as a set, never partially, anywhere an AI-derived number is shown (photo results, text-estimate results, and by extension any future AI-derived value).
- **Progress ring** — the one recurring "hero" shape (home screen budget ring, and structurally related to the app icon itself, which is a simplified version of the same ring). Track color is always the muted `surface-track`, fill is always semantic (`budget-under/near/over`), stroke always round-capped.

## Do's and Don'ts

- **Do** keep red (`budget-over`) exclusive to over-budget states. **Don't** use it for AI confidence-low, destructive-but-routine actions (a "Wis"/delete affordance on a list item legitimately uses it too, since deleting a log entry is itself budget-adjacent — but nowhere else).
- **Do** always show the confidence badge + `~` + dotted-underline + `±` caption together for AI-estimated numbers. **Don't** show a bare `~` number without its badge, or a bare badge without the margin caption.
- **Do** keep `reward` (lilac) visually subordinate — smaller, later in reading order, never competing with the budget ring for primary attention. **Don't** introduce confetti, aggressive gradients, or celebratory motion for badges/streaks (explicit product constraint, carried over from the design-handoff brief).
- **Do** anchor every primary action to the bottom thumb-zone. **Don't** place a FAB-equivalent or primary CTA above the vertical midpoint of the screen.
- **Do** treat the AI-coach's typing/chat surface as a deliberate, opt-in exception to the "avoid typing" rule elsewhere — it's allowed to look and feel like a focused text exchange. **Don't** let that chat-input pattern leak into other logging flows, which stay slider/stepper/tap-first.
