-- CreateEnum
CREATE TYPE "PendingUpdateStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "PendingUpdateRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestedByUsername" TEXT NOT NULL,
    "status" "PendingUpdateStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUsername" TEXT,

    CONSTRAINT "PendingUpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingUpdateRequest_projectId_status_idx" ON "PendingUpdateRequest"("projectId", "status");

-- AddForeignKey
ALTER TABLE "PendingUpdateRequest" ADD CONSTRAINT "PendingUpdateRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
