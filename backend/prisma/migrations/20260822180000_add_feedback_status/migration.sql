-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "status" "FeedbackStatus" NOT NULL DEFAULT 'open';
