---
name: CalCount
status: final
updated: '2026-07-24'
sources:
  - docs/prd.md
  - docs/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - imports/CalCount.dc.html
---

# Experience Spec for CalCount

_Behavioral companion to `DESIGN.md`. Visual tokens referenced here as `{path.to.token}` resolve against that file. Distilled from the external design-tool export produced in response to the v1.1 redesign handoff (`.working/stitch-prompt.md`)._

## Foundation

**Form-factor:** mobile-first PWA, single portrait surface (390×844 reference, iPhone-class). No tablet/desktop layout in scope for v1.1 — matches PRD §3 ("Web Responsive, mobile-first... Desktop niet in scope"). Mocks show native-style status-bar/home-indicator chrome purely as framing convention for the design board — the PWA itself runs in-browser and must not attempt to fake native chrome at runtime.

**UI system:** none inherited (no shadcn/MUI/native kit) — DESIGN.md's tokens are the full system, built directly in Tailwind-equivalent utility classes matching the existing codebase's styling approach (`web/src/screens/*.tsx`, `web/src/components/*.tsx`).

## Information Architecture

Two top-level destinations, reached via a persistent bottom tab bar:

1. **Vandaag** (today) — hoofdscherm, and everything reachable from its "+" FAB (log mode picker → foto / correctie / gewicht-product / recent / handmatig / AI-tekst).
2. **Voortgang** — a 3-way segmented sub-navigation *within* this tab: **Gewicht** (chart + insight panel + weight-entry access) / **Prestaties** (badges) / **AI-coach**. This resolves an ambiguity the PRD's flat screen list (§3) left open — Prestaties and AI-coach are not separate top-level tabs, they nest under Voortgang.

Onboarding and Instellingen sit outside this tab structure (onboarding is pre-tab-bar; instellingen is reached from a profile entry point, not modeled in the tab bar itself).

**Surface closure check:** every screen named in the PRD's Core Screens list (§3) has a surface in this IA (onboarding, hoofdscherm, log-flow foto, log-flow gewicht/product, voortgang, prestaties, AI-coach, instellingen) plus two the mockup surfaces that the PRD implied but didn't separately enumerate: a dedicated **log mode picker** (the "+" sheet itself, hosting Recent/Zoeken/Handmatig/AI-tekst/Foto as one cohesive tabbed sheet rather than five unrelated screens) and a dedicated **gewicht-invoeren** screen (distinct from the food log-flow, reached from Voortgang → Gewicht, not from the "+" FAB).

## Voice and Tone

Dutch UI throughout. Copy stays declarative and low-key even at positive moments ("12 dagen op rij", not "Geweldig gedaan! 🔥"). AI-sourced text (insights, coach) is consistently tagged with a small "Suggestie, geen medisch advies" caption — never presented as bare authoritative statements (see DESIGN.md's confidence-badge discipline for the numeric equivalent of this same principle).

## Component Patterns (behavioral)

- **Log mode picker** — bottom sheet triggered by the "+" FAB, hosting five modes as one segmented control (2 rows). Replaces what the current implementation renders as five flat tab buttons in a single row (`LogSheet.tsx`'s `nav` bar) — the mockup's two-row segmented treatment is a **visual density change**, not a functional one; the underlying `Tab` state machine (`recent | search | manual | ai | photo`) is unchanged.
- **Swipeable list item** — hoofdscherm log entries reveal "Wijzig" (edit) / "Wis" (delete) actions on swipe-left. **This is a new interaction not present in the current implementation**, which reaches edit/delete only via tapping into the correction screen. Treat as an additive fast-path, not a replacement — tap-to-open must keep working for accessibility (swipe gestures are not discoverable or reliably operable for all input modes).
- **Day navigation** — chevrons flank the "Vandaag" date label at the top of the hoofdscherm, consistent with the existing `FR12` day-browse requirement; no new backend contract implied.
- **Weight entry** — its own screen (stepper ± buttons flanking a large tabular value, plus a short recent-measurements list with inline wijzig/wis), reached from Voortgang → Gewicht, separate from the food-logging sheet.
- **AI-coach input** — persistent bottom text-entry bar with a circular send button; suggested-question "chips" appear above it as a light discovery aid. This is the one surface in the app where typing is the primary input, matching the confirmed exception in `DESIGN.md`.

## State Patterns

- **AI analyzing (photo)** — dimmed thumbnail overlay, three-dot pulse animation, live status text ("Maaltijd analyseren…") plus a running recognized-item count. Satisfies the earlier product requirement that this not read as a bare spinner.
- **AI result / confidence** — every AI-derived line item carries the confidence badge set described in `DESIGN.md` (badge + `~` + dotted underline + `±` caption). Applies identically to AI-tekst and Foto results.
- **Badge locked vs. earned** — earned badges: solid icon tile, full opacity, `{colors.reward}` family. Locked badges: dashed border, muted icon color, ~70% opacity. No text label change beyond that (no "gesloten"/"locked" caption shown) — the visual treatment alone carries the state, which needs a non-color-alone check against the Accessibility Floor below.
- **Budget-fit inline note** — the correction screen surfaces a live one-line, dot+sentence readout ("Past ruim binnen je dagbudget") as the user adjusts the slider — a real-time preview of impact before saving. **Not currently in the app or the PRD's ACs**; flagged as a UX-originated enhancement, not a re-derivation of existing scope (see Open Items).

## Interaction Primitives

- Bottom-sheet modality for every logging flow (food and weight alike); sheets always arrive from below over a dimmed backdrop.
- Slider + stepper combo (± circular buttons flanking a large central value) is the one correction pattern used everywhere a number needs adjusting — food calories, weight — deliberately avoiding a numeric keyboard.
- Segmented control (pill-tab row) for any in-screen mode switch (log-picker modes, Voortgang's three sub-views).
- Minimum 48px tap targets, thumb-zone bias for anything primary.

## Accessibility Floor

WCAG AA carried as an explicit design constraint (labeled directly on the design board). Concretely honored in what was designed: confidence and budget states are never color-only (paired with text — "HOOG/MIDDEL/LAAG", explicit kcal numbers, explicit status sentences); tabular numerals aid scannability; tap targets meet the 48px floor. **Not yet verified:** the locked-vs-earned badge distinction currently relies on opacity + dashed border alone with no text label — this likely needs a small text cue ("nog te behalen") added before it clears a strict color/contrast-independent AA check. Dark-mode contrast was proven on 2 of 10 screens (hoofdscherm, log mode picker) — the palette pattern is established (`surface-page-dark`/`surface-card-dark`/`ink-dark`/`budget-under-dark`) but not yet walked across every screen.

## Key Flows

Per the PRD's own Shape-fit finding (single real user, no multi-stakeholder cast — see `docs/prd.md` rubric review), these stay grounded in "de gebruiker" rather than an invented persona name, consistent with the rest of the product's documentation.

**Foto-log, happy path (climax: the confidence badge earns trust or invites a quick correction).** De gebruiker opent de app na de lunch, tikt de FAB, kiest Foto, maakt een foto van het bord. Terwijl de analyse loopt ziet hij de pulse-animatie en "3 items herkend" oplopen. Het resultaat verschijnt: kipfilet (HOOG), rijst (MIDDEL), broccoli (LAAG) — hij vertrouwt de eerste twee, tikt op de broccoli-regel om de hoeveelheid iets bij te stellen via de slider, en slaat op. Het hoofdscherm-getal daalt meteen; de swipe-lijst toont het nieuwe item bovenaan.

**AI-coach, grounded-answer path (climax: the answer cites the user's own numbers, not generic advice).** Aan het eind van de dag twijfelt de gebruiker of er nog ruimte is voor een toetje. Hij opent Voortgang → AI-coach, typt de vraag. Het antwoord noemt het exacte resterende budget (1.240 kcal) en een concreet voorstel, met de "geen medisch advies"-tag zichtbaar. Een vervolgvraag over hardlopen wordt binnen dezelfde sessie beantwoord zonder de context te herhalen — het gesprek onthoudt zichzelf tot het scherm sluit.

## Open Items

Surfaced during distillation, not invented — decisions for whoever picks up implementation:

- **`[NOTE FOR UX]` "Beweging" (movement) stat** on the hoofdscherm ring ("0 beweging") has no backing FR anywhere in the PRD. Either drop it as a leftover placeholder from the design tool, or treat it as a genuinely new scope item to run through a future PRD update — do not build it silently.
- **`[NOTE FOR UX]` Swipe-to-reveal list actions** are new relative to the current implementation (tap-only today). Needs a build decision: add as an enhancement to Epic 2's existing edit/delete (Story 2.3), or defer.
- **`[NOTE FOR UX]` Badge milestone set mismatch.** The mockup shows 3d-streak / 7d-streak / eerste-trend / 30d-totaal(?) / 100d-totaal / −5kg-bereikt — richer than PRD FR15's confirmed minimal set (3/7/30-dagen streak, 30 dagen totaal gelogd, eerste trendmatige voortgang). Reconcile before building Story 5.2; the PRD's confirmed set is authoritative unless the opdrachtgever explicitly expands it.
- **`[NOTE FOR UX]` Confidence-low color correction needed in code.** The already-implemented `PhotoResultPreview` (`web/src/screens/LogSheet.tsx`, Story 3.1) currently colors low-confidence items red — this design reserves red exclusively for over-budget and uses an orange-brown for confidence-low instead. Follow-up fix, not a new feature.
- **`[NOTE FOR UX]` Budget-fit inline note** (correction screen) and the **Voortgang sub-tab nesting** are UX-originated clarifications/enhancements beyond what the PRD's ACs currently specify — small, low-risk, but worth a one-line PRD note if the opdrachtgever wants them tracked as confirmed scope rather than implementation detail.
- **`[NOTE FOR UX]` Dark mode** pattern proven on 2/10 screens only; full-coverage token application still open.
- Locked-badge accessibility (see Accessibility Floor) likely needs a small text cue added.
