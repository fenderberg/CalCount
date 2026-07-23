-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "birthDate" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "goalRateKgPerWeek" REAL NOT NULL,
    "targetWeightKg" REAL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loggedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "grams" REAL,
    "calories" REAL NOT NULL,
    "protein" REAL,
    "carbs" REAL,
    "fat" REAL,
    "isEstimate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "measuredAt" DATETIME NOT NULL,
    "weightKg" REAL NOT NULL
);

-- CreateIndex
CREATE INDEX "FoodEntry_loggedAt_idx" ON "FoodEntry"("loggedAt");

-- CreateIndex
CREATE INDEX "WeightEntry_measuredAt_idx" ON "WeightEntry"("measuredAt");
