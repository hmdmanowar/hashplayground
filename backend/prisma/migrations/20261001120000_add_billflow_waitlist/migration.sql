-- CreateTable
CREATE TABLE "BillflowWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "priceIntent" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillflowWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillflowEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillflowWaitlist_email_key" ON "BillflowWaitlist"("email");

-- CreateIndex
CREATE INDEX "BillflowEvent_type_createdAt_idx" ON "BillflowEvent"("type", "createdAt");
