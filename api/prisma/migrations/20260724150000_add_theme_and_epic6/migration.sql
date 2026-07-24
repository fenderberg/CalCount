ALTER TABLE "Profile" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light';

CREATE TABLE "AiInsight" (
  "id" TEXT NOT NULL,
  "windowStart" TEXT NOT NULL,
  "windowEnd" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiInsight_createdAt_idx" ON "AiInsight"("createdAt");

CREATE TABLE "AiCoachUsage" (
  "day" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AiCoachUsage_pkey" PRIMARY KEY ("day")
);
