-- CreateTable
CREATE TABLE "FeedbackStatusChange" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "FeedbackStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackStatusChange_feedbackId_changedAt_idx" ON "FeedbackStatusChange"("feedbackId", "changedAt");

-- AddForeignKey
ALTER TABLE "FeedbackStatusChange" ADD CONSTRAINT "FeedbackStatusChange_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: seed one history row per existing Feedback from its current
-- status, using resolvedAt as the timestamp when present (more accurate for
-- rows already marked resolved) and falling back to createdAt otherwise.
INSERT INTO "FeedbackStatusChange" ("id", "feedbackId", "status", "changedAt", "changedBy")
SELECT gen_random_uuid(), "id", "status", COALESCE("resolvedAt", "createdAt"), NULL
FROM "Feedback";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "inProgressAt",
DROP COLUMN "resolvedAt";
