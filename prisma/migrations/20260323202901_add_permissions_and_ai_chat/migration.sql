-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canViewYarn" BOOLEAN NOT NULL DEFAULT false,
    "canViewFabric" BOOLEAN NOT NULL DEFAULT false,
    "canViewGarment" BOOLEAN NOT NULL DEFAULT false,
    "canViewAccessory" BOOLEAN NOT NULL DEFAULT false,
    "canViewMaster" BOOLEAN NOT NULL DEFAULT false,
    "canViewReports" BOOLEAN NOT NULL DEFAULT false,
    "canEditYarn" BOOLEAN NOT NULL DEFAULT false,
    "canEditFabric" BOOLEAN NOT NULL DEFAULT false,
    "canEditGarment" BOOLEAN NOT NULL DEFAULT false,
    "canEditAccessory" BOOLEAN NOT NULL DEFAULT false,
    "canEditMaster" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteYarn" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteFabric" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteGarment" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteAccessory" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteMaster" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canPrint" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canUseAI" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_key" ON "user_permissions"("userId");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
