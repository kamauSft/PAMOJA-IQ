import { Prisma, type AuditSource } from "@prisma/client";
import { getDb } from "../db";
import { currentTenant, TenantIsolationError } from "../tenancy/context";
import { GENESIS_HASH, auditHash, type AuditBody } from "./chain";

export async function appendAuditLog(input: {
  action: string;
  entityType: string;
  entityId: string;
  source?: AuditSource;
  before?: unknown;
  after?: unknown;
  createdAt?: Date;
}): Promise<{ seq: number; hash: string }> {
  const context = currentTenant();
  if (!context?.chamaId || context.bypass) {
    throw new TenantIsolationError("Audit entries must be written inside a chama context");
  }
  const db = getDb(context);
  const last = await db.auditLog.findFirst({ orderBy: { seq: "desc" } });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.hash ?? GENESIS_HASH;
  const createdAt = input.createdAt ?? new Date();
  const body: AuditBody = {
    chamaId: context.chamaId,
    seq,
    actorMembershipId: context.membershipId ?? null,
    actorPersonId: context.personId ?? null,
    source: input.source ?? "SYSTEM",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
    createdAt: createdAt.toISOString(),
  };
  const hash = auditHash(prevHash, body);
  await db.auditLog.create({
    data: {
      chamaId: context.chamaId,
      seq,
      prevHash,
      hash,
      actorMembershipId: body.actorMembershipId,
      actorPersonId: body.actorPersonId,
      source: body.source as AuditSource,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      before: body.before === null ? undefined : (body.before as object),
      after: body.after === null ? undefined : (body.after as object),
      createdAt,
    },
  });
  return { seq, hash };
}

/** Write the next audit row inside the same database transaction as the change. */
export async function appendAuditInTransaction(
  tx: Prisma.TransactionClient,
  input: {
    chamaId: string;
    membershipId: string;
    personId: string;
    action: string;
    entityType: string;
    entityId: string;
    after?: unknown;
  },
): Promise<void> {
  const last = await tx.auditLog.findFirst({
    where: { chamaId: input.chamaId },
    orderBy: { seq: "desc" },
  });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.hash ?? GENESIS_HASH;
  const createdAt = new Date();
  const body: AuditBody = {
    chamaId: input.chamaId,
    seq,
    actorMembershipId: input.membershipId,
    actorPersonId: input.personId,
    source: "MANUAL",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: null,
    after: input.after ?? null,
    createdAt: createdAt.toISOString(),
  };
  await tx.auditLog.create({
    data: {
      chamaId: input.chamaId,
      seq,
      prevHash,
      hash: auditHash(prevHash, body),
      actorMembershipId: input.membershipId,
      actorPersonId: input.personId,
      source: "MANUAL",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      after: input.after === undefined ? undefined : (input.after as Prisma.InputJsonValue),
      createdAt,
    },
  });
}
