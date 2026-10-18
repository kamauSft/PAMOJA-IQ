-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'SW', 'SHENG');

-- CreateEnum
CREATE TYPE "ChamaStatus" AS ENUM ('TRIAL', 'ACTIVE', 'READ_ONLY', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STANDARD', 'PRO');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('CHAIR', 'TREASURER', 'SECRETARY', 'MEMBER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXITED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MPESA', 'BANK');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('MANUAL', 'AI', 'MPESA', 'IMPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('FLAT', 'REDUCING');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'ACTIVE', 'PAID', 'DEFAULTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('SCHEDULED', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FineType" AS ENUM ('LATE_CONTRIBUTION', 'MISSED_MEETING', 'LATE_INSTALLMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "WelfareType" AS ENUM ('BEREAVEMENT', 'ILLNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "WelfareStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MpesaMatchStatus" AS ENUM ('MATCHED', 'NEEDS_REVIEW', 'IGNORED');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS', 'USSD', 'WEB');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('YES', 'NO', 'ABSTAIN');

-- CreateEnum
CREATE TYPE "AuditSource" AS ENUM ('MANUAL', 'AI', 'SYSTEM', 'MPESA');

-- CreateTable
CREATE TABLE "Chama" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "county" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "settings" JSONB NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'PRO',
    "trialEndsAt" TIMESTAMP(3),
    "status" "ChamaStatus" NOT NULL DEFAULT 'TRIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'EN',
    "channelPrefs" JSONB NOT NULL,
    "consent" JSONB NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "memberNo" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "hashedPin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "datePaid" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "source" "RecordSource" NOT NULL,
    "reversesId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "principalCents" INTEGER NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "interestType" "InterestType" NOT NULL,
    "months" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanInstallment" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalDueCents" INTEGER NOT NULL,
    "interestDueCents" INTEGER NOT NULL,
    "paidAmountCents" INTEGER NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "datePaid" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "source" "RecordSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guarantor" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "guarantorMembershipId" TEXT NOT NULL,
    "amountGuaranteedCents" INTEGER NOT NULL,
    "status" "GuarantorStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fine" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "type" "FineType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'UNPAID',
    "waivedByMembershipId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "source" "RecordSource" NOT NULL,
    "reversesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareClaim" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "membershipId" TEXT,
    "type" "WelfareType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WelfareStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelfareClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT NOT NULL,
    "attendance" JSONB NOT NULL,
    "minutes" TEXT,
    "decisions" JSONB NOT NULL,
    "voiceNoteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "PollStatus" NOT NULL,
    "quorumBps" INTEGER NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetCents" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MpesaTransaction" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "transId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "phone" TEXT,
    "billRef" TEXT,
    "matchedMembershipId" TEXT,
    "status" "MpesaMatchStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MpesaTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestedByMembershipId" TEXT NOT NULL,
    "approvedByMembershipId" TEXT,
    "status" "ApprovalStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "prevHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "actorMembershipId" TEXT,
    "actorPersonId" TEXT,
    "source" "AuditSource" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "inputSummary" TEXT NOT NULL,
    "toolsCalled" JSONB NOT NULL,
    "output" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "status" "AgentRunStatus" NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "personId" TEXT,
    "channel" "MessageChannel" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "personId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "aiCalls" INTEGER NOT NULL DEFAULT 0,
    "aiInputTokens" INTEGER NOT NULL DEFAULT 0,
    "aiOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueMetric" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "minutesSaved" INTEGER NOT NULL,
    "remindersSent" INTEGER NOT NULL,
    "questionsAnswered" INTEGER NOT NULL,
    "paymentsRecorded" INTEGER NOT NULL,
    "onTimeRateBps" INTEGER NOT NULL,
    "onTimeRateBeforeBps" INTEGER NOT NULL,
    "arrearsRecoveredCents" INTEGER NOT NULL,
    "statementsIssued" INTEGER NOT NULL,
    "reconciliationVarianceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValueMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingAction" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "confirmationTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "confirmedByMembershipId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAccess" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "grantedByMembershipId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_phone_key" ON "Person"("phone");

-- CreateIndex
CREATE INDEX "Membership_chamaId_idx" ON "Membership"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_chamaId_personId_key" ON "Membership"("chamaId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_chamaId_memberNo_key" ON "Membership"("chamaId", "memberNo");

-- CreateIndex
CREATE INDEX "Contribution_chamaId_membershipId_period_idx" ON "Contribution"("chamaId", "membershipId", "period");

-- CreateIndex
CREATE INDEX "Loan_chamaId_status_idx" ON "Loan"("chamaId", "status");

-- CreateIndex
CREATE INDEX "LoanInstallment_chamaId_dueDate_idx" ON "LoanInstallment"("chamaId", "dueDate");

-- CreateIndex
CREATE INDEX "LoanInstallment_loanId_idx" ON "LoanInstallment"("loanId");

-- CreateIndex
CREATE INDEX "LoanRepayment_chamaId_loanId_idx" ON "LoanRepayment"("chamaId", "loanId");

-- CreateIndex
CREATE INDEX "Guarantor_chamaId_idx" ON "Guarantor"("chamaId");

-- CreateIndex
CREATE INDEX "Guarantor_loanId_idx" ON "Guarantor"("loanId");

-- CreateIndex
CREATE INDEX "Fine_chamaId_membershipId_idx" ON "Fine"("chamaId", "membershipId");

-- CreateIndex
CREATE INDEX "Expense_chamaId_idx" ON "Expense"("chamaId");

-- CreateIndex
CREATE INDEX "WelfareClaim_chamaId_idx" ON "WelfareClaim"("chamaId");

-- CreateIndex
CREATE INDEX "Meeting_chamaId_date_idx" ON "Meeting"("chamaId", "date");

-- CreateIndex
CREATE INDEX "Poll_chamaId_idx" ON "Poll"("chamaId");

-- CreateIndex
CREATE INDEX "Vote_chamaId_idx" ON "Vote"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_membershipId_key" ON "Vote"("pollId", "membershipId");

-- CreateIndex
CREATE INDEX "SavingsGoal_chamaId_membershipId_idx" ON "SavingsGoal"("chamaId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "MpesaTransaction_transId_key" ON "MpesaTransaction"("transId");

-- CreateIndex
CREATE INDEX "MpesaTransaction_chamaId_status_idx" ON "MpesaTransaction"("chamaId", "status");

-- CreateIndex
CREATE INDEX "Approval_chamaId_entityType_entityId_idx" ON "Approval"("chamaId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_chamaId_idx" ON "AuditLog"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_chamaId_seq_key" ON "AuditLog"("chamaId", "seq");

-- CreateIndex
CREATE INDEX "AgentRun_chamaId_createdAt_idx" ON "AgentRun"("chamaId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_chamaId_createdAt_idx" ON "Message"("chamaId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_chamaId_idx" ON "Notification"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_chamaId_key" ON "Subscription"("chamaId");

-- CreateIndex
CREATE INDEX "Invoice_chamaId_period_idx" ON "Invoice"("chamaId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_chamaId_period_key" ON "UsageCounter"("chamaId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ValueMetric_chamaId_period_key" ON "ValueMetric"("chamaId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "PendingAction_confirmationTokenHash_key" ON "PendingAction"("confirmationTokenHash");

-- CreateIndex
CREATE INDEX "PendingAction_chamaId_idx" ON "PendingAction"("chamaId");

-- CreateIndex
CREATE INDEX "SupportAccess_chamaId_idx" ON "SupportAccess"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_personId_idx" ON "Session"("personId");

-- CreateIndex
CREATE INDEX "OtpChallenge_personId_idx" ON "OtpChallenge"("personId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInstallment" ADD CONSTRAINT "LoanInstallment_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInstallment" ADD CONSTRAINT "LoanInstallment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_guarantorMembershipId_fkey" FOREIGN KEY ("guarantorMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_waivedByMembershipId_fkey" FOREIGN KEY ("waivedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaim" ADD CONSTRAINT "WelfareClaim_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaim" ADD CONSTRAINT "WelfareClaim_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaTransaction" ADD CONSTRAINT "MpesaTransaction_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MpesaTransaction" ADD CONSTRAINT "MpesaTransaction_matchedMembershipId_fkey" FOREIGN KEY ("matchedMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestedByMembershipId_fkey" FOREIGN KEY ("requestedByMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approvedByMembershipId_fkey" FOREIGN KEY ("approvedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueMetric" ADD CONSTRAINT "ValueMetric_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingAction" ADD CONSTRAINT "PendingAction_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccess" ADD CONSTRAINT "SupportAccess_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccess" ADD CONSTRAINT "SupportAccess_grantedByMembershipId_fkey" FOREIGN KEY ("grantedByMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
