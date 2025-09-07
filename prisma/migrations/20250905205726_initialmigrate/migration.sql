-- CreateEnum
CREATE TYPE "public"."WebinarStatusEnum" AS ENUM ('SCHEDULED', 'WAITING_ROOM', 'LIVE', 'ENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."CtaTypeEnum" AS ENUM ('BUY_NOW', 'BOOK_A_CALL');

-- CreateEnum
CREATE TYPE "public"."AttendedTypeEnum" AS ENUM ('REGISTERED', 'ATTENDED', 'ADDED_TO_CART', 'FOLLOW_UP', 'BREAKOUT_ROOM', 'CONVERTED');

-- CreateEnum
CREATE TYPE "public"."CallStatusEnum" AS ENUM ('PENDING', 'COMPLETED', 'CANCELED', 'IN_PROGRESS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profileImage" TEXT,
    "clerkId" TEXT NOT NULL,
    "stripeConnectId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "subscription" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" VARCHAR(255),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Webinar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "webinarStatus" "public"."WebinarStatusEnum" NOT NULL DEFAULT 'SCHEDULED',
    "presenterId" UUID NOT NULL,
    "tags" TEXT[],
    "ctaLabel" VARCHAR(100),
    "ctaType" "public"."CtaTypeEnum",
    "ctaUrl" VARCHAR(255),
    "couponCode" VARCHAR(50),
    "couponEnabled" BOOLEAN NOT NULL DEFAULT false,
    "couponExpiry" TIMESTAMP(3),
    "lockChat" BOOLEAN NOT NULL DEFAULT false,
    "stripeProductId" VARCHAR(255),
    "aiAgentId" VARCHAR(255),
    "priceId" VARCHAR(255),
    "recordingUrl" TEXT,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Webinar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" VARCHAR(100),
    "callStatus" "public"."CallStatusEnum" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webinarId" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "attendedType" "public"."AttendedTypeEnum" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectId_key" ON "public"."User"("stripeConnectId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Webinar_startTime_idx" ON "public"."Webinar"("startTime");

-- CreateIndex
CREATE INDEX "Webinar_presenterId_idx" ON "public"."Webinar"("presenterId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_email_key" ON "public"."Attendee"("email");

-- CreateIndex
CREATE INDEX "Attendance_attendeeId_idx" ON "public"."Attendance"("attendeeId");

-- CreateIndex
CREATE INDEX "Attendance_webinarId_idx" ON "public"."Attendance"("webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_attendeeId_webinarId_key" ON "public"."Attendance"("attendeeId", "webinarId");

-- AddForeignKey
ALTER TABLE "public"."Webinar" ADD CONSTRAINT "Webinar_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "public"."Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
