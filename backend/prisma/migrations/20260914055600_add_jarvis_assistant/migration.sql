-- CreateTable
CREATE TABLE "JarvisConversation" (
    "id" TEXT NOT NULL,
    "ownerUsername" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JarvisConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JarvisMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JarvisMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JarvisWorkspaceFile" (
    "id" TEXT NOT NULL,
    "ownerUsername" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JarvisWorkspaceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JarvisConversation_ownerUsername_idx" ON "JarvisConversation"("ownerUsername");

-- CreateIndex
CREATE INDEX "JarvisMessage_conversationId_createdAt_idx" ON "JarvisMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "JarvisWorkspaceFile_ownerUsername_idx" ON "JarvisWorkspaceFile"("ownerUsername");

-- CreateIndex
CREATE UNIQUE INDEX "JarvisWorkspaceFile_ownerUsername_path_key" ON "JarvisWorkspaceFile"("ownerUsername", "path");

-- AddForeignKey
ALTER TABLE "JarvisConversation" ADD CONSTRAINT "JarvisConversation_ownerUsername_fkey" FOREIGN KEY ("ownerUsername") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JarvisMessage" ADD CONSTRAINT "JarvisMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "JarvisConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JarvisWorkspaceFile" ADD CONSTRAINT "JarvisWorkspaceFile_ownerUsername_fkey" FOREIGN KEY ("ownerUsername") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;
