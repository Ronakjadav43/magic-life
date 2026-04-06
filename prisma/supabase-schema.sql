-- Magic Life – Full Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xosdpfzoyjtsepxusmft/sql

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Staff',
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teamIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_entries" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "timeSpent" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "assigneeId" TEXT,
    "approval" TEXT NOT NULL DEFAULT 'Not Submitted',
    "approvedBy" TEXT,
    "approvalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "proposalSent" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'New',
    "dealValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "tasks" DROP COLUMN "approval";
  ALTER TABLE "tasks" DROP COLUMN "approvedBy";
  ALTER TABLE "tasks" DROP COLUMN "approvalNote";
  ALTER TABLE "tasks" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'backlog';
EXCEPTION WHEN undefined_column THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_activities" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyReminderTime" TEXT NOT NULL DEFAULT '10:00',
    "overdueReminderTime" TEXT NOT NULL DEFAULT '09:00',
    "whatsappNumber" TEXT NOT NULL DEFAULT '919723242591',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey (safe – skip if already exists)
DO $$ BEGIN
  ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "daily_entries" ADD COLUMN IF NOT EXISTS "taskId" TEXT;

DO $$ BEGIN
  ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
