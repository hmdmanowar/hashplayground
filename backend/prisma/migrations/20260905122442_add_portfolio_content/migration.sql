-- CreateTable
CREATE TABLE "PortfolioContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "PortfolioContent_pkey" PRIMARY KEY ("id")
);
