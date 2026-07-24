# Design handoff prompt (CalCount)

Paste the block below into your design tool of choice (Claude in browser, Stitch, etc.). Save whatever it produces (DESIGN.md + per-screen HTML/mockups) into this run folder: `_bmad-output/planning-artifacts/ux-designs/ux-CalCount-2026-07-23/imports/`.

---

Design a mobile-first Progressive Web App called **CalCount** — an AI-assisted calorie tracker for a single user trying to lose weight sustainably. Propose a complete, cohesive visual identity (colors, typography, shapes, elevation) — no existing brand exists yet, you have full creative freedom within the constraints below.

**Product tone:** calm, fast, encouraging — never clinical, never guilt-inducing, never gamified-loud. The single question the app answers is *"How much can I still eat today?"* Everything serves getting from "I ate something" to "it's logged" with minimal friction.

**Hard constraints:**
- One-handed mobile use: large tap targets, primary actions reachable by thumb, bottom-anchored navigation.
- One accent-color system already anchored functionally: green = under budget, amber/red = approaching or over budget. Propose the actual hues/tones — just keep that semantic mapping.
- A distinct, subtle "reward" accent for gamification (streaks/badges) — must read as *light and encouraging*, never loud, competitive, or slot-machine-like (no confetti explosions, no aggressive gradients).
- AI-estimated values must always visually read as "estimate with a margin," not exact figures.
- Accessibility target: WCAG AA (contrast, legible type at mobile sizes, dynamic type support).
- Light mode required; dark mode a nice-to-have if it fits the direction.

**Screens to design** (mobile, portrait):
1. **Onboarding & profiel** — height/weight/birthdate/sex/activity-level form, then goal-rate/target-weight.
2. **Hoofdscherm (today)** — the hero: remaining calories as one large number, a ring/bar visualizing the day, today's logged items list, a prominent "+" log action, and a streak indicator that stays secondary to the main number. Include: a day-navigation control (browse to previous/next day) and the item-edit/delete interaction (e.g. tap an item to edit its amount/calories, swipe or a delete action to remove it — the day total updates live).
3. **Log-flow — mode picker** — the "+" action opens a sheet with modes: **Recent** (one-tap re-log a previous item), **Zoeken** (search a food database by name), **Handmatig** (manual name + calories + optional grams), **AI-tekst** (type a free-text description of what you ate, AI estimates calories/macros/portion), **Foto** (camera/gallery). Design this as one cohesive tabbed/segmented sheet, not five unrelated screens.
4. **Log-flow: foto** — within the sheet above: camera/gallery capture, an AI-analyzing loading state (not a bare spinner), then a read-only result list of recognized food items with a confidence indicator per item (this exact screen already exists functionally — feel free to propose how it should really look).
5. **Log-flow: correctie** — shared final step for Zoeken/Handmatig/AI-tekst/Foto: user adjusts the estimate via slider/stepper (avoid typing where possible), confirms, saves.
6. **Gewicht invoeren** — a small, fast form/modal (reachable from the Voortgang screen) to log a new weight measurement with today's date (or a chosen date); edit/delete an existing measurement.
7. **Voortgang** — weight-over-time chart with a target-weight trendline, plus a periodic AI-generated insight/summary panel (calm, observational tone — presented as suggestion, never as medical advice).
8. **Prestaties (badges)** — a light overview of earned and locked badges/milestones (3/7/30-day streaks, total days logged, first trend progress toward goal) — keep this understated, not a "collection game" aesthetic.
9. **AI-coach** — a simple question/answer interface where the user asks about their nutrition/progress and gets a grounded, personalized answer; needs to coexist with the "no typing, one-handed" ethos elsewhere — a deliberate, opt-in exception, so it can look and feel more like a focused text exchange, just don't let it clash with the rest of the system.
10. **Instellingen** — profile/goal editing, privacy info.

**Also design as reusable components (appear across multiple screens above):**
- **Bottom tab bar** — top-level navigation between "Vandaag" (screens 2-6) and "Voortgang" (screens 7-9, incl. Prestaties/AI-coach reachable from there or their own tab — your call).
- **Confidence badge** — low/medium/high indicator used on both the AI-tekst and Foto result screens.

**Deliverable:** DESIGN.md (per the google-labs-code/design.md spec: colors, typography, rounded, spacing, components tokens + Brand & Style / Colors / Typography / Layout & Spacing / Elevation & Depth / Shapes / Components / Do's and Don'ts prose) plus per-screen HTML mockups for all screens and components above.
