-- CreateEnum
CREATE TYPE "CrewInviteStatus" AS ENUM ('PENDING', 'APPROVED', 'REVOKED', 'REGISTERED');

-- CreateTable
CREATE TABLE "CrewInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "CrewInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrewInvite_email_key" ON "CrewInvite"("email");
