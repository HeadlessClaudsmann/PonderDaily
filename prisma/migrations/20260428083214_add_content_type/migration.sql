-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentPiece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ageBand" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "question1" TEXT NOT NULL,
    "question2" TEXT NOT NULL,
    "question3" TEXT NOT NULL,
    "topicCategory" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'article',
    "publishDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "evergreen" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyGridId" TEXT,
    CONSTRAINT "ContentPiece_dailyGridId_fkey" FOREIGN KEY ("dailyGridId") REFERENCES "DailyGrid" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContentPiece" ("ageBand", "approvedAt", "body", "createdAt", "dailyGridId", "evergreen", "generatedAt", "id", "publishDate", "question1", "question2", "question3", "status", "title", "topicCategory") SELECT "ageBand", "approvedAt", "body", "createdAt", "dailyGridId", "evergreen", "generatedAt", "id", "publishDate", "question1", "question2", "question3", "status", "title", "topicCategory" FROM "ContentPiece";
DROP TABLE "ContentPiece";
ALTER TABLE "new_ContentPiece" RENAME TO "ContentPiece";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
