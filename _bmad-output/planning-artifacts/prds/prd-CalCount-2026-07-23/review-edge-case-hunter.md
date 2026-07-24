> Historische edge-case-inventaris van 2026-07-23. De actuele besluiten en status staan
> in `docs/prd.md`, `docs/design.md` en `docs/handoff.md`.

```json
[
  {
    "location": "FR14 / Story 5.1 AC1, AC3",
    "trigger_condition": "Device timezone changes or user travels across timezones during an active streak",
    "guard_snippet": "Streak day-boundary is computed against a fixed reference (e.g. server UTC or explicit user timezone setting), not raw device clock.",
    "potential_consequence": "Travel across timezones can skip or double-count a streak day"
  },
  {
    "location": "FR14 / Story 5.1",
    "trigger_condition": "Streak break evaluated via device local time vs server time is unspecified",
    "guard_snippet": "Specify explicitly whether streak calculation uses server time or device time as source of truth.",
    "potential_consequence": "Streak state can diverge between client display and backend record"
  },
  {
    "location": "FR8 interacting with FR14 / Story 5.1",
    "trigger_condition": "User deletes the only logged item of a day inside an active or past streak",
    "guard_snippet": "On deleting the last entry of a day, recompute the streak retroactively from remaining log history.",
    "potential_consequence": "Streak stays inflated and no longer reflects actual logging history"
  },
  {
    "location": "FR8 / FR12 interacting with FR14",
    "trigger_condition": "User logs an entry on a previously-missed day via day-navigation (backdating)",
    "guard_snippet": "Specify whether logging on a past day via day-browse retroactively restores that day's streak contribution.",
    "potential_consequence": "Streak can be manipulated or remain wrongly broken after legitimate backfill"
  },
  {
    "location": "Story 5.1 AC3",
    "trigger_condition": "Timing of streak-reset detection (real-time at midnight vs next app open) is unspecified",
    "guard_snippet": "Define that streak-break is evaluated lazily on next app open against the last known log date, or via a scheduled job.",
    "potential_consequence": "Streak may display a stale unbroken value until the user reopens the app"
  },
  {
    "location": "FR14 / FR15 interacting with Epic 3 (§10)",
    "trigger_condition": "A photo-logged item (Epic 3) is saved once Epic 3 ships alongside streak/badges",
    "guard_snippet": "State explicitly that every entry counts equally toward streak/badges regardless of source (manual, photo, product).",
    "potential_consequence": "Streak/badges could inconsistently ignore photo-logged days"
  },
  {
    "location": "FR15 / Story 5.2",
    "trigger_condition": "Underlying data that earned a badge is later edited or deleted via FR8",
    "guard_snippet": "Specify whether badges are revoked, kept, or flagged when the log history that earned them is later corrected.",
    "potential_consequence": "User retains a badge no longer supported by actual log history"
  },
  {
    "location": "FR15 / Story 5.2 AC3",
    "trigger_condition": "Two or more milestones are reached simultaneously from a single action",
    "guard_snippet": "Specify presentation when multiple badges are earned at once (e.g. stacked notification or queue).",
    "potential_consequence": "Simultaneous badge notifications could overlap or one could be silently dropped"
  },
  {
    "location": "FR15 (milestone \"eerste voortgang richting streefgewicht\")",
    "trigger_condition": "Weight regresses after the first-progress-toward-goal milestone was already awarded",
    "guard_snippet": "Define whether the first-progress badge is a permanent one-time award or re-evaluated after regression and recovery.",
    "potential_consequence": "Unclear whether badge stays earned or can be re-triggered inconsistently"
  },
  {
    "location": "FR15 (milestone set marked as open assumption)",
    "trigger_condition": "Milestone definitions are added or changed after users already have qualifying historical data",
    "guard_snippet": "Specify whether new/changed milestone rules apply retroactively to existing log data or only prospectively.",
    "potential_consequence": "Users may unexpectedly gain or miss badges when milestone rules change post-launch"
  },
  {
    "location": "FR15 / Story 5.2",
    "trigger_condition": "Streak resets to 0 then regrows to a length already rewarded by an earlier badge",
    "guard_snippet": "Define whether a given streak-length badge is awarded once ever per user or re-awarded on each occurrence.",
    "potential_consequence": "Duplicate or missing badge-award notifications on repeated streak lengths"
  },
  {
    "location": "FR16 / Story 6.1 AC1-AC3",
    "trigger_condition": "A periodic insight already shown is followed by a retroactive edit/delete of entries in that period (FR8)",
    "guard_snippet": "Specify whether an already-generated periodic insight is regenerated or flagged stale after retroactive data edits.",
    "potential_consequence": "Displayed insight can reference data that no longer matches the actual log"
  },
  {
    "location": "FR16 / Story 6.1 interacting with FR11",
    "trigger_condition": "A new weight entry retroactively recalculates TDEE/budget after a periodic insight was already shown",
    "guard_snippet": "Specify whether a shown periodic insight is revised or marked outdated when FR11 subsequently changes the budget.",
    "potential_consequence": "Insight cites stale budget-adherence figures inconsistent with the recalculated budget"
  },
  {
    "location": "Story 6.1 (no AC for AI generation failure)",
    "trigger_condition": "AI provider is unavailable or errors during periodic insight generation, distinct from the insufficient-data case",
    "guard_snippet": "Add an AC: on API error or missing AI key, the progress screen shows a graceful message instead of a blank/broken insight (mirroring Story 6.2 AC3).",
    "potential_consequence": "Progress screen may show a blank or stuck state with no fallback messaging"
  },
  {
    "location": "Story 6.1 AC1 (\"periodiek, bv. wekelijks\")",
    "trigger_condition": "User does not open the app for multiple periods, so several weekly insights are missed",
    "guard_snippet": "Define behavior for missed periods: summarize only the most recent period, or show a backlog of prior periods.",
    "potential_consequence": "Unclear whether stale or multiple backlogged insights accumulate or overwrite each other"
  },
  {
    "location": "Story 6.1 AC1 (\"wekelijks\")",
    "trigger_condition": "Definition of the period boundary (calendar week vs rolling 7 days, and which timezone) is unspecified",
    "guard_snippet": "Specify the exact period boundary (e.g. rolling 7-day window in a defined timezone) for generating periodic insights.",
    "potential_consequence": "Insight period could misalign with the user's actual day boundaries while traveling"
  },
  {
    "location": "FR17 / Story 6.2",
    "trigger_condition": "User asks the AI coach a question outside their own logged data or outside nutrition/progress entirely",
    "guard_snippet": "Add an AC specifying the coach recognizes out-of-scope questions and redirects/declines instead of answering freely.",
    "potential_consequence": "Coach may fabricate answers or give off-topic or medical advice beyond intended scope"
  },
  {
    "location": "FR17 / Story 6.2 (no equivalent of Story 6.1 AC3)",
    "trigger_condition": "User asks the coach a question before any data has been logged (empty log/profile state)",
    "guard_snippet": "Add an AC: with insufficient logged data, the coach gives a graceful explanation instead of a fabricated answer (mirroring Story 6.1 AC3).",
    "potential_consequence": "Coach may produce a nonsensical or hallucinated answer with no underlying data"
  },
  {
    "location": "NFR9 / Story 6.2",
    "trigger_condition": "Repeated or rapid coach conversations across a day/week exceed acceptable aggregate cost",
    "guard_snippet": "Specify an aggregate cost cap or rate-limit per user per day in addition to per-conversation context-length limiting.",
    "potential_consequence": "Cumulative AI cost across many conversations could exceed acceptable spend"
  },
  {
    "location": "FR17 / Story 6.2 AC2",
    "trigger_condition": "Multi-turn conversation history/session persistence across app restarts is unspecified",
    "guard_snippet": "Specify whether coach conversations retain history between sessions or always start fresh.",
    "potential_consequence": "Coach may lose mid-conversation context or retain unrelated prior context unexpectedly"
  },
  {
    "location": "§10 Epic 3 reactivation interacting with FR14/FR15",
    "trigger_condition": "Epic 5 streak/badge feature launches after users already have historical log data from Epics 1/2/4",
    "guard_snippet": "Specify whether existing historical log history is backfilled to seed the initial streak/badge state at Epic 5 launch.",
    "potential_consequence": "Streak could start at 0 despite an existing consistent log history"
  },
  {
    "location": "FR18/NFR8 vs FR17 / Story 6.2",
    "trigger_condition": "User directly requests medical or diagnostic advice from the coach",
    "guard_snippet": "Add an AC specifying the coach redirects to a medical professional for questions beyond nutrition/progress suggestion.",
    "potential_consequence": "Coach could be perceived as giving medical guidance despite FR18's framing requirement"
  },
  {
    "location": "Story 3.2 AC3 interacting with FR16/FR17",
    "trigger_condition": "AI insights/coach reference photo-logged entries whose calories are estimates with margin",
    "guard_snippet": "Specify whether AI insights/coach distinguish estimated (photo) from exact (weight/product) entries in their analysis.",
    "potential_consequence": "Insights/coach may present budget-adherence conclusions with unwarranted precision"
  },
  {
    "location": "Story 6.1 AC3",
    "trigger_condition": "Data exists but is sparse/inconsistent within the period (e.g. 1 of 7 days logged) rather than fully absent",
    "guard_snippet": "Define a minimum threshold (e.g. minimum days logged) for the insufficient-data message, not just full absence of data.",
    "potential_consequence": "Insight may generate a misleading summary from too little data despite AC3 intent"
  },
  {
    "location": "Story 5.1 AC3 (\"gemist dagdeel\")",
    "trigger_condition": "AC uses \"dagdeel\" (part of day) instead of \"dag\" (day) for the streak-break condition",
    "guard_snippet": "Replace \"dagdeel\" with an unambiguous definition: the streak only breaks on a full calendar day with zero logged items.",
    "potential_consequence": "Ambiguous wording could cause the streak to break after only part of a day unlogged"
  },
  {
    "location": "FR16 / Story 6.1 interacting with Story 4.4",
    "trigger_condition": "User adjusts goal/tempo (Story 4.4), instantly changing the budget referenced by an already-shown periodic insight",
    "guard_snippet": "Specify whether periodic insights discussing budget adherence are revised when the user changes goal/tempo after generation.",
    "potential_consequence": "Insight's budget-adherence claims become inconsistent with the newly adjusted budget"
  },
  {
    "location": "Story 6.1 AC1 (\"gewichtstrend\")",
    "trigger_condition": "User has never logged a weight entry, so the weight-trend input has no data",
    "guard_snippet": "Specify behavior when one of the three data sources (log, budget adherence, weight trend) is entirely absent, not only for the first-week case.",
    "potential_consequence": "Insight generation may fail or fabricate a weight trend when none exists"
  },
  {
    "location": "NFR9 interacting with Epic 3 (NFR3/NFR7)",
    "trigger_condition": "Concurrent AI-proxy usage from photo recognition (Epic 3) and coach/insights (Epic 6) sharing the same proxy pattern",
    "guard_snippet": "Specify whether concurrent AI calls share a rate-limit/quota and how contention between features is handled.",
    "potential_consequence": "Concurrent AI feature usage could cause unexpected latency or throttling across features"
  }
]
```
