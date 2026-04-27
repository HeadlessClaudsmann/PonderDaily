-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ageBand" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "question1" TEXT NOT NULL,
    "question2" TEXT NOT NULL,
    "question3" TEXT NOT NULL,
    "topicCategory" TEXT NOT NULL,
    "publishDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyGridId" TEXT,
    CONSTRAINT "ContentPiece_dailyGridId_fkey" FOREIGN KEY ("dailyGridId") REFERENCES "DailyGrid" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyGrid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "ageBand" TEXT NOT NULL,
    "publishedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyGrid_date_ageBand_key" ON "DailyGrid"("date", "ageBand");
