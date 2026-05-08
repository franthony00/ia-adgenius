-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('facebook', 'instagram', 'tiktok', 'google', 'linkedin');

-- CreateEnum
CREATE TYPE "AccountPlatform" AS ENUM ('meta', 'google', 'tiktok', 'linkedin');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('active', 'paused', 'draft', 'completed');

-- CreateEnum
CREATE TYPE "AdFormat" AS ENUM ('image', 'video', 'carousel', 'reel');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('brand_awareness', 'conversions', 'traffic', 'lead_generation', 'reach');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'completed', 'draft');

-- CreateEnum
CREATE TYPE "VariationStatus" AS ENUM ('pending', 'testing', 'approved', 'draft', 'rejected');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('copy', 'visual', 'both', 'cta');

-- CreateEnum
CREATE TYPE "SalesAngle" AS ENUM ('emocional', 'directa', 'urgencia', 'oferta', 'autoridad', 'problema_solucion', 'curiosidad', 'social_proof', 'ugc');

-- CreateEnum
CREATE TYPE "AIModel" AS ENUM ('claude_3_5_sonnet', 'claude_opus_4', 'gpt_4o', 'gemini_1_5_pro');

-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('starter', 'pro', 'performance', 'agency', 'enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trialing', 'past_due', 'cancelled');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "HistoryType" AS ENUM ('analysis', 'variation', 'ad_added', 'metric_update', 'status_change');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('connected', 'disconnected', 'expired', 'error');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('success', 'error', 'partial');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('positive', 'neutral', 'negative');

-- CreateEnum
CREATE TYPE "PerformanceLevel" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "planId" "PlanId" NOT NULL DEFAULT 'pro',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "platform" "AccountPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "externalAccountId" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'disconnected',
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "tokenExpiresAt" TIMESTAMP(3),
    "adsImported" INTEGER NOT NULL DEFAULT 0,
    "campaignsImported" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" "CampaignObjective" NOT NULL DEFAULT 'brand_awareness',
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "platform" "Platform" NOT NULL DEFAULT 'facebook',
    "dailyBudget" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "imageUrl" TEXT,
    "format" "AdFormat" NOT NULL DEFAULT 'image',
    "platform" "Platform" NOT NULL DEFAULT 'facebook',
    "status" "AdStatus" NOT NULL DEFAULT 'active',
    "aiScore" INTEGER,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION,
    "cpa" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reach" INTEGER,
    "frequency" DOUBLE PRECISION,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION,
    "cpa" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reach" INTEGER,
    "frequency" DOUBLE PRECISION,
    "adId" TEXT NOT NULL,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "model" "AIModel" NOT NULL DEFAULT 'claude_3_5_sonnet',
    "overallScore" INTEGER NOT NULL,
    "copyScore" INTEGER NOT NULL,
    "visualScore" INTEGER NOT NULL,
    "audienceScore" INTEGER NOT NULL,
    "hookStrength" INTEGER NOT NULL,
    "estimatedCTR" DOUBLE PRECISION NOT NULL,
    "estimatedROAS" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "recommendations" TEXT[],
    "patterns" JSONB NOT NULL DEFAULT '[]',
    "sentiment" "Sentiment" NOT NULL DEFAULT 'positive',
    "predictedPerformance" "PerformanceLevel" NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adId" TEXT NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdVariation" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "predictedCTR" DOUBLE PRECISION NOT NULL,
    "predictedCPC" DOUBLE PRECISION,
    "predictedROAS" DOUBLE PRECISION NOT NULL,
    "confidence" INTEGER,
    "angle" "SalesAngle",
    "recommendedPlatform" "Platform",
    "status" "VariationStatus" NOT NULL DEFAULT 'pending',
    "model" "AIModel" NOT NULL DEFAULT 'claude_3_5_sonnet',
    "rationale" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL DEFAULT 'copy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalAdId" TEXT NOT NULL,

    CONSTRAINT "AdVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "type" "HistoryType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "model" "AIModel",
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedAdId" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncHistory" (
    "id" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "adsImported" INTEGER NOT NULL DEFAULT 0,
    "campaignsImported" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "note" TEXT,
    "connectedAccountId" TEXT NOT NULL,

    CONSTRAINT "SyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_workspaceId_key" ON "Subscription"("workspaceId");

-- CreateIndex
CREATE INDEX "MetricSnapshot_adId_date_idx" ON "MetricSnapshot"("adId", "date");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdVariation" ADD CONSTRAINT "AdVariation_originalAdId_fkey" FOREIGN KEY ("originalAdId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_relatedAdId_fkey" FOREIGN KEY ("relatedAdId") REFERENCES "Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncHistory" ADD CONSTRAINT "SyncHistory_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
