-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastMfaUsedAt" TIMESTAMP(3),
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaEnabledAt" TIMESTAMP(3),
ADD COLUMN     "mfaSecret" TEXT;

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "public"."User"("clerkId");
