import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  customers,
  customerTickets,
  equipment,
  integrationConnections,
  serviceFormTemplates,
  teamMembers,
  thirdParties,
  users,
  workOrderEvents,
  workOrders,
  type InsertWorkOrder,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  for (const field of textFields) {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.accessProfile !== undefined) {
    values.accessProfile = user.accessProfile;
    updateSet.accessProfile = user.accessProfile;
  }
  if (user.organizationId !== undefined) {
    values.organizationId = user.organizationId;
    updateSet.organizationId = user.organizationId;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getDashboardSummary(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) {
    return { workOrdersOpen: 0, inField: 0, technicians: 0, techniciansTotal: 0, slaPercent: 0, critical: 0, lastSyncAt: new Date() };
  }
  const [orders, field, staff, critical] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(workOrders).where(and(eq(workOrders.organizationId, organizationId), sql`${workOrders.status} not in ('concluida','cancelada')`)),
    db.select({ count: sql<number>`count(*)` }).from(workOrders).where(and(eq(workOrders.organizationId, organizationId), eq(workOrders.status, "em_campo"))),
    db.select({ count: sql<number>`count(*)` }).from(teamMembers).where(and(eq(teamMembers.organizationId, organizationId), eq(teamMembers.status, "ativo"))),
    db.select({ count: sql<number>`count(*)` }).from(workOrders).where(and(eq(workOrders.organizationId, organizationId), sql`${workOrders.priority} = 'alta' and ${workOrders.status} not in ('concluida','cancelada')`)),
  ]);
  const total = await db.select({ count: sql<number>`count(*)` }).from(teamMembers).where(eq(teamMembers.organizationId, organizationId));
  return {
    workOrdersOpen: Number(orders[0]?.count ?? 0),
    inField: Number(field[0]?.count ?? 0),
    technicians: Number(staff[0]?.count ?? 0),
    techniciansTotal: Number(total[0]?.count ?? 0),
    slaPercent: 0,
    critical: Number(critical[0]?.count ?? 0),
    lastSyncAt: new Date(),
  };
}

export async function listWorkOrders(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(workOrders).where(eq(workOrders.organizationId, organizationId)).orderBy(desc(workOrders.createdAt));
}

export async function createWorkOrder(input: InsertWorkOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(workOrders).values(input);
  const rows = await db.select().from(workOrders).where(eq(workOrders.externalId, input.externalId)).limit(1);
  return rows[0];
}

export async function updateWorkOrderStatus(organizationId: number, id: number, status: InsertWorkOrder["status"], actorUserId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(workOrders).set({ status, updatedAt: new Date() }).where(and(eq(workOrders.id, id), eq(workOrders.organizationId, organizationId)));
  await db.insert(workOrderEvents).values({ workOrderId: id, actorUserId, type: "status_updated", payloadJson: JSON.stringify({ status }) });
  const rows = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  return rows[0];
}

export async function listCustomers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(customers).where(eq(customers.organizationId, organizationId)).orderBy(customers.name);
}

export async function createCustomer(input: {
  organizationId: number;
  name: string;
  document?: string;
  city?: string;
  state?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(customers).values(input);
  const rows = await db.select().from(customers).where(and(eq(customers.organizationId, input.organizationId), eq(customers.name, input.name))).orderBy(desc(customers.id)).limit(1);
  return rows[0];
}

export async function listEquipment(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(equipment).where(eq(equipment.organizationId, organizationId)).orderBy(desc(equipment.updatedAt));
}

export async function createEquipment(input: {
  organizationId: number;
  customerId?: number;
  code: string;
  name: string;
  model?: string;
  serialNumber?: string;
  state?: "operacional" | "manutencao" | "atencao" | "baixado";
  installedAt?: Date;
  lastMaintenanceAt?: Date;
  nextMaintenanceAt?: Date;
  qrCode?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(equipment).values(input);
  const rows = await db.select().from(equipment).where(eq(equipment.code, input.code)).limit(1);
  return rows[0];
}

export async function linkEquipmentToCustomer(organizationId: number, equipmentId: number, customerId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(equipment).set({ customerId, updatedAt: new Date() }).where(and(eq(equipment.id, equipmentId), eq(equipment.organizationId, organizationId)));
  const rows = await db.select().from(equipment).where(and(eq(equipment.id, equipmentId), eq(equipment.organizationId, organizationId))).limit(1);
  return rows[0];
}

export async function listTeamMembers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.organizationId, organizationId)).orderBy(teamMembers.name);
}

export async function listThirdParties(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(thirdParties).where(eq(thirdParties.organizationId, organizationId)).orderBy(thirdParties.name);
}

export async function createThirdParty(input: {
  organizationId: number;
  name: string;
  document?: string;
  region?: string;
  contactName?: string;
  contactEmail?: string;
  status?: "homologado" | "em_revisao" | "bloqueado";
  slaPercent?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(thirdParties).values(input);
  const rows = await db.select().from(thirdParties).where(and(eq(thirdParties.organizationId, input.organizationId), eq(thirdParties.name, input.name))).orderBy(desc(thirdParties.id)).limit(1);
  return rows[0];
}

export async function listServiceFormTemplates(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(serviceFormTemplates).where(eq(serviceFormTemplates.organizationId, organizationId)).orderBy(desc(serviceFormTemplates.updatedAt));
}

export async function createServiceFormTemplate(input: {
  organizationId: number;
  name: string;
  category: "atendimento" | "instalacao";
  description?: string;
  fieldsJson: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(serviceFormTemplates).values(input);
  const rows = await db.select().from(serviceFormTemplates).where(and(eq(serviceFormTemplates.organizationId, input.organizationId), eq(serviceFormTemplates.name, input.name))).orderBy(desc(serviceFormTemplates.id)).limit(1);
  return rows[0];
}

export async function listCustomerTickets(organizationId: number, customerId?: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const filters = customerId ? and(eq(customerTickets.organizationId, organizationId), eq(customerTickets.customerId, customerId)) : eq(customerTickets.organizationId, organizationId);
  return db.select().from(customerTickets).where(filters).orderBy(desc(customerTickets.createdAt));
}

export async function createCustomerTicket(input: {
  organizationId: number;
  customerId: number;
  equipmentId?: number;
  externalId: string;
  title: string;
  description?: string;
  priority?: "baixa" | "media" | "alta";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(customerTickets).values(input);
  const rows = await db.select().from(customerTickets).where(eq(customerTickets.externalId, input.externalId)).limit(1);
  return rows[0];
}

export async function convertCustomerTicketToWorkOrder(input: {
  organizationId: number;
  ticketId: number;
  externalId: string;
  assignedMemberId?: number;
  assignedThirdPartyId?: number;
  scheduledAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const ticketRows = await db.select().from(customerTickets).where(and(eq(customerTickets.id, input.ticketId), eq(customerTickets.organizationId, input.organizationId))).limit(1);
  const ticket = ticketRows[0];
  if (!ticket) throw new Error("Customer ticket not found");
  await db.insert(workOrders).values({
    organizationId: input.organizationId,
    customerId: ticket.customerId,
    equipmentId: ticket.equipmentId ?? undefined,
    assignedMemberId: input.assignedMemberId,
    assignedThirdPartyId: input.assignedThirdPartyId,
    externalId: input.externalId,
    title: ticket.title,
    serviceType: "Solicitação do cliente",
    priority: ticket.priority,
    status: "em_aprovacao",
    scheduledAt: input.scheduledAt,
    notes: ticket.description,
  });
  await db.update(customerTickets).set({ status: "convertido_em_os", updatedAt: new Date() }).where(and(eq(customerTickets.id, ticket.id), eq(customerTickets.organizationId, input.organizationId)));
  const rows = await db.select().from(workOrders).where(eq(workOrders.externalId, input.externalId)).limit(1);
  return rows[0];
}

export async function getIntegrationConnection(organizationId: number, provider: "monday" | "maps" | "email") {
  const db = await getDb();
  if (!db || !organizationId) return undefined;
  const rows = await db.select().from(integrationConnections).where(and(eq(integrationConnections.organizationId, organizationId), eq(integrationConnections.provider, provider))).limit(1);
  return rows[0];
}

export async function upsertMondayConnection(organizationId: number, workspaceId: string, settingsJson?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getIntegrationConnection(organizationId, "monday");
  if (existing) {
    await db.update(integrationConnections).set({ status: "conectado", workspaceId, settingsJson, updatedAt: new Date() }).where(eq(integrationConnections.id, existing.id));
  } else {
    await db.insert(integrationConnections).values({ organizationId, provider: "monday", status: "conectado", workspaceId, settingsJson });
  }
  return getIntegrationConnection(organizationId, "monday");
}
