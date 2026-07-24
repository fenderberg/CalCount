-- Story 5.1: vaste daggrens voor streaks. Bestaande profielen worden bij de
-- eerste streak-opvraag gevuld met de tijdzone van het apparaat.
ALTER TABLE "Profile" ADD COLUMN "timeZone" TEXT;
