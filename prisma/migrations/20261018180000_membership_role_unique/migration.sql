-- AlterTable
CREATE UNIQUE INDEX "Membership_chamaId_personId_role_key" ON "Membership"("chamaId", "personId", "role");
