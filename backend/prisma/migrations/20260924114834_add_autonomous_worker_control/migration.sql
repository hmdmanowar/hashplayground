-- CreateTable
CREATE TABLE "AutonomousWorkerState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AutonomousWorkerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousTask" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resultSummary" TEXT,
    "outcome" TEXT,
    "commitHash" TEXT,

    CONSTRAINT "AutonomousTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousCycleLog" (
    "id" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "filesChanged" JSONB NOT NULL,
    "commitHash" TEXT,
    "taskId" TEXT,

    CONSTRAINT "AutonomousCycleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutonomousTask_status_createdAt_idx" ON "AutonomousTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AutonomousCycleLog_timestamp_idx" ON "AutonomousCycleLog"("timestamp");
