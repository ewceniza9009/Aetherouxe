-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('published', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewed', 'dismissed', 'actioned');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('post', 'comment');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('publish', 'hide', 'archive', 'restore', 'delete', 'dismiss_report', 'action_report');

-- AlterTable
ALTER TABLE "agent_commission_releases" ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'paid';

-- AlterTable
ALTER TABLE "collection_cases" ADD COLUMN     "caseNumber" TEXT;

-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published';

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_reports" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reportedById" TEXT,
    "reporterName" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "reason" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_cases_caseNumber_key" ON "collection_cases"("caseNumber");

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

