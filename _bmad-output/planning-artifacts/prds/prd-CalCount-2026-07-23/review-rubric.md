# PRD Quality Review — CalCount (v1.1, 2026-07-23)

> Historische reviewmomentopname. De badge-set, coachlimiet, authenticatie, het design
> en de streak-tijdzone zijn later besloten; zie de canonieke documenten in `docs/`.

## Overall verdict

The v1.0 core (Epics 1/2/4, now Epic 3) is a tight, well-scoped single-user PRD, and the v1.1 additions inherit its good habits: inline `(Aanname: ...)` tags on every new FR, an honest Out-of-Scope boundary for gamification (§7), and a genuine counter-metric tying gamification to the trackgemak metric (§8). But the two brand-new epics have real done-ness gaps that the existing epics didn't have: Epic 5's badge milestone set is undefined despite the epic already being written at story/AC granularity, and Epic 6's AI-coach has no defined interaction model (single Q&A vs. stateful conversation) and no concrete cost/abuse bound for a feature exposed on an unauthenticated single-user app. Nothing here is critical for a hobby app, but these are the three items an engineer would actually get stuck on.

## Decision-readiness — adequate

Real trade-offs are named, not smoothed over. §7's gamification boundary is explicit about what was given up ("punten/levels, sociale competitie/leaderboards en wisselende wekelijkse uitdagingen zijn bewust buiten scope"), and the UX vision's tension between "rustig" and adding streaks/badges is resolved concretely via Story 5.1 AC2/AC3 and the §8 counter-metric rather than asserted away. The Epic 3 reactivation (§10) states plainly what changed (status only, scope unchanged) and what it now requires (`ANTHROPIC_API_KEY`).

What's missing: no PM-level flag anywhere that three independent AI features (photo estimate, periodic insights, interactive coach) now stack cost exposure, each covered by its own NFR (NFR7, NFR9) but never considered in aggregate. This isn't a fictional risk — it's the kind of thing that gets found in the first architecture pass instead of the PRD, which is the wrong place for it to surface a scope question.

### Findings
- **low** No aggregate AI-cost consideration across the three AI features (§2 NFR7/NFR9, §8) — Each feature's cost is bounded individually but nothing addresses that a single user session could now trigger photo estimation, weekly insights, and a coach conversation in the same day. *Fix:* add a one-line `[NOTE FOR PM]` or NFR acknowledging combined AI spend is out of scope for v1.1 monitoring, or fold it into NFR9's cost containment.

## Substance over theater — adequate

The NFRs are mostly product-specific, not boilerplate: NFR3 gives a number (~10s), NFR7 gives an order of magnitude ("richtwaarde onder enkele centen per foto"), NFR8 states a concrete presentation constraint (estimate-with-margin, not exact). The Vision statement ("Hoeveel mag ik vandaag nog?") and Goals are specific to this product, not swappable boilerplate. No persona theater — the PRD never invents personas beyond "de gebruiker" (the actual single stakeholder), which is right-sized for this shape (see Shape fit).

NFR9 is a partial regression from that standard: "de kosten per gesprek beheersbaar (bv. gelimiteerde contextlengte)" gives no number where its sibling NFR7 does. Given the new epics are the ones under scrutiny, this is worth calling out even though it isn't fatal.

### Findings
- **medium** NFR9 cost bound is an adjective, not a number (§2) — "beheersbaar" and "gelimiteerde contextlengte" have no threshold, unlike NFR7's "enkele centen per foto." This is scored under Done-ness clarity below (see that section) rather than double-counted here.

## Strategic coherence — adequate

The thesis (frictionless tracking → sustained deficit → weight loss) is stated and the v1.1 additions extend it coherently in the Goals section: gamification is explicitly framed as supporting adherence ("beloont zonder de app druk of competitief te maken," §1) and AI-advies as supporting the *why* behind the numbers, not just the numbers (§1, Epic 6 doel). Epic ordering rationale in §5's footer ("Epic 5 en 6 (v1.1) versterken motivatie en inzicht bovenop het werkende fundament") is a real sequencing argument, not filler.

The weak point is Epic 6's Success Metrics (§8): "de AI-coach wordt ten minste 1× per week geraadpleegd" and "periodieke inzichten worden gelezen (geopend), niet genegeerd" are activity/frequency metrics (consulted, opened), not metrics that validate the stated thesis of the user *understanding why* their progress moves the way it does. This is exactly the DAU/MAU-style tell the rubric warns about — the thesis is about insight quality, the metric is about usage frequency.

### Findings
- **medium** Epic 6 Success Metrics measure engagement, not comprehension (§8) — "geraadpleegd" and "geopend" are proxies for usage, not for whether the advice changed the user's understanding or behavior. *Fix:* add an outcome-oriented proxy even a hobby PRD can self-report, e.g. "gebruiker past minstens 1× een AI-suggestie toe (bijv. doel/tempo bijstellen na een inzicht)."

## Done-ness clarity — thin

This is the dimension where the new epics show the most strain, and per the rubric this is the one to be unforgiving on.

**FR15 / Story 5.2 (badges)** is honestly flagged as incomplete — "*(Aanname: de exacte mijlpaal-set wordt bepaald tijdens architectuur/epics-verfijning — geen uitputtende lijst in dit PRD.)*" — but this honesty doesn't resolve the done-ness problem, it just names it. Story 5.2 AC1 says badges are awarded for "vooraf gedefinieerde mijlpalen (bv. streak-lengtes, totaal aantal geloggde dagen, eerste voortgang richting streefgewicht)" with no enumerated list, no count, no thresholds. Every other epic in this PRD (1–4, and Epic 3's stories 3.1–3.4) is written at exactly this level of granularity *with* concrete ACs; Epic 5 stops short specifically on the one thing that determines whether Story 5.2 is "done."

**FR17 / Story 6.2 (interactive coach)** never resolves whether this is a single-turn Q&A (ask one question, get one answer, no memory) or a stateful conversation (the word "coach" and "interactieve" imply the latter). The ACs describe "een vraag stellen" → "een antwoord" (singular), which reads like single-turn, but nothing rules out follow-up questions referencing prior answers. This materially changes the data model (does a Conversation/Message table exist?) and the architecture update §11 flags as pending ("AI-coach-endpoint" to be added) doesn't resolve it either. An engineer building this from the PRD alone would have to guess.

**NFR9's cost/abuse bound** is the same issue as the Substance-over-theater finding but sharper here: the PRD confirms in §4 that v1 has no login ("simpele lokale/gepersonaliseerde toegang volstaat... Multi-user/login is toekomstig") — meaning FR17's free-text coach endpoint is the first AI feature in this PRD that accepts arbitrary user input rather than a fixed photo/analyze call. NFR9's only protection is "gelimiteerde contextlengte," with no rate limit, no per-day cap, no number. For a single-user hobby app this isn't catastrophic, but it is a genuinely open engineering question the PRD should own rather than leave to NFR9's adjective.

**Story 5.1 AC3** introduces a terminology drift that affects done-ness: "Bij een gemist **dagdeel** (geen log die dag) wordt de streak informatief teruggezet" — "dagdeel" means part-of-day (morning/afternoon/evening), but FR14 defines the streak at day granularity ("opeenvolgende **dagen**"). The parenthetical clarifies intent, but the primary term contradicts the FR it implements, which is exactly the kind of glossary drift that produces two different implementations from two different readers.

### Findings
- **high** No enumerated badge milestone set (FR15, Story 5.2 AC1) — "vooraf gedefinieerde mijlpalen" with only "bv." examples means there is no way to verify Story 5.2 is complete. *Fix:* either enumerate a minimal v1.1 badge set (e.g., 3/7/30-day streaks, first weight-goal check-in) directly in the PRD, or explicitly mark this a `[NOTE FOR PM]` deferred decision due before Epic 5 story-writing, not during it.
- **high** Coach interaction model undefined (FR17, Story 6.2) — single-turn vs. multi-turn/stateful conversation is never decided, yet it drives the data model and the architecture update that §11 says is still pending. *Fix:* add one sentence to FR17 or Story 6.2 stating whether the coach retains conversation history within a session, across sessions, or is stateless per question.
- **high** NFR9 has no concrete rate/cost bound and the coach endpoint is the PRD's first free-text AI input on an unauthenticated single-user app (§4, §2) — "beheersbaar" is not testable and nothing mitigates cost-abuse if the URL is discovered. *Fix:* give NFR9 a number (e.g., max N coach questions/day, max context tokens) the way NFR7 does for photos.
- **medium** "dagdeel" vs. "dag" terminology drift (Story 5.1 AC3 vs. FR14) — the AC's primary term contradicts the FR's day-level streak definition. *Fix:* replace "gemist dagdeel" with "gemiste dag" to match FR14's wording.

## Scope honesty — strong

This is the strongest dimension in the document. §7's "Gamification (v1.1-grens)" is a textbook `[NON-GOAL]`-style callout even without the bracket syntax: it names exactly what's excluded ("punten/levels, sociale competitie/leaderboards en wisselende wekelijkse uitdagingen") and why ("v1.1 beperkt gamification expliciet tot streak + badges"). The "coaching" clarification in the same section — distinguishing the pre-existing human/social-coaching exclusion from the new in-scope AI-coach — directly resolves the exact ambiguity a reader would trip on, rather than leaving it implicit. §9 items 10–12 record the three v1.1 scope decisions as confirmed-by-stakeholder, not smoothed into "considerations." FR14–16 each carry an inline assumption tag naming what's still open and where it gets resolved ("Te bevestigen bij architectuur/UX").

No findings — this dimension does real work and should be treated as the template for tightening Done-ness clarity above.

## Downstream usability — adequate

FR/NFR numbering is contiguous and clean: FR1–18 and NFR1–9 with no gaps or dupes, and the new items (FR14–18, NFR9) slot in without renumbering existing ones. Cross-references resolve: "conform NFR8" (FR18, Story 3.2 AC3, Story 6.1 AC2, Story 6.2 AC2) and "conform NFR9" (Story 6.2 AC3) all point at requirements that exist and say what the citing text claims. Epic List (§5) and Epic Details (§6) stay in the same order. §3's Core Screens list ("Prestaties/badges-overzicht," "AI-coach") maps cleanly onto Epic 5/6, so a UX pass can source-extract screen requirements directly.

Two structural gaps, both pre-existing rather than introduced by v1.1: there is no Glossary section anywhere in the document, and the ~13 inline `(Aanname: ...)` tags (FR14, FR15, FR16, NFR1, Accessibility, Branding, and four Technical Assumptions items) are never collected into an index. For a standalone hobby PRD this matters less, but §11's own "Aanbevolen volgorde" names `bmad-create-epics-and-stories` as the very next step, which will want an assumptions list to check off.

### Findings
- **low** No Glossary section in the PRD — terms (streak, budget, TDEE, badge) stay consistent by convention, not by a defined reference. *Fix:* low priority given single-author/single-reader stakes; add only if the doc gains other consumers.
- **low** No consolidated Assumptions Index — inline `(Aanname: ...)` tags are never rolled up, despite the PRD explicitly queuing downstream skill work in §11. *Fix:* a short "Open Aannames" list at the end referencing FR14–16 and the Technical Assumptions items would let `bmad-check-implementation-readiness` verify roundtrip.

## Shape fit — strong

The PRD is correctly right-sized for a single-user hobby PWA. It doesn't invent personas or force multi-stakeholder UJ formalism — "Als gebruiker wil ik..." stories with the one real protagonist (the opdrachtgever) are proportionate, not under-formalized, since there's exactly one user and no B2B/consumer-market shape to justify named personas. Brownfield references check out against the actual codebase: §10's claim that "de `photo`-bron bestaat in het datamodel" and "het API-contract staat in architecture.md §5" both verify — `api/src/routes/entries.ts` and `web/src/api.ts` list `'photo'` in the entry `source` enum, and architecture.md §5 ("AI Fotoherkenning — Contract") documents exactly the request/response contract described. §11's implementation-status table distinguishes built (✅ Epics 1/2/4) from planned (📝 Epic 5/6) from reactivated (🔵 Epic 3) clearly, so a reader can't mistake new v1.1 scope for already-shipped work.

No findings — the document's formality level matches its stakes.

## Mechanical notes

- ID continuity is clean: FR1–18, NFR1–9, Epic 1–6, and every Story numbered contiguously with no gaps or duplicates.
- Cross-references resolve throughout (checked "conform NFR8/NFR9," Story references from Epic 3/5/6 back to Epic 2 patterns, e.g. Story 5.1 AC3 "aansluitend bij Story 2.2 AC3").
- Model-ID references (`claude-sonnet-5`, `claude-haiku-4-5`, `claude-opus-4-8`) are internally consistent across prd.md, architecture.md, handoff.md, deployment.md, and the actual code (`api/src/services/aiEstimate.ts`, `api/.env.example`) — no drift found.
- Terminology drift: "dagdeel" (Story 5.1 AC3) vs. "dag" (FR14) — see Done-ness clarity finding above; only instance of drift found in the v1.1 additions.
- No Assumptions Index and no Glossary section exist in the document (see Downstream usability); assumption tags use PRD-local `(Aanname: ...)` phrasing rather than the rubric's `[ASSUMPTION: ...]` bracket convention — functionally equivalent, differently formatted, not indexed.
- No `[NOTE FOR PM]` or `[NON-GOAL]` bracket-tag conventions are used anywhere in the PRD (v1.0 or v1.1); the document achieves similar honesty through prose (§7, §9) instead.
