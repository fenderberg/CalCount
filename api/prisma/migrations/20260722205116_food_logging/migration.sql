-- CreateTable
CREATE TABLE "FoodReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL,
    "carbsPer100g" REAL,
    "fatPer100g" REAL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodReference_externalId_key" ON "FoodReference"("externalId");

-- CreateIndex
CREATE INDEX "FoodReference_lastUsedAt_idx" ON "FoodReference"("lastUsedAt");
