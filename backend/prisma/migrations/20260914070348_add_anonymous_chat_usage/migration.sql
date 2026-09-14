-- CreateTable
CREATE TABLE "AnonymousChatUsage" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousChatUsage_pkey" PRIMARY KEY ("id")
);
