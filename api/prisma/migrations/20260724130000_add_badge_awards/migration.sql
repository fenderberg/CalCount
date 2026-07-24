-- Story 5.2: eenmaal toegekende badges blijven permanent behouden.
CREATE TABLE "BadgeAward" (
    "key" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("key")
);
