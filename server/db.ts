import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  customers,
  customerTickets,
  customFormDefinitions,
  equipment,
  equipmentCatalogs,
  integrationConnections,
  mondaySimulatedItems,
  serviceFormTemplates,
  teamMembers,
  thirdParties,
  users,
  workOrderEvents,
  workOrderEvidence,
  workOrders,
  type InsertWorkOrder,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

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

export async function assignUserScope(input: { userId: number; organizationId: number; accessProfile: "gestao" | "terceiros" | "pessoas" | "campo" | "cliente"; customerId?: number; thirdPartyId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set({
    organizationId: input.organizationId,
    accessProfile: input.accessProfile,
    customerId: input.customerId ?? null,
    thirdPartyId: input.thirdPartyId ?? null,
  }).where(eq(users.id, input.userId));
  const result = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
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

export async function listWorkOrders(organizationId: number, thirdPartyId?: number | null) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(workOrders).where(thirdPartyId ? and(eq(workOrders.organizationId, organizationId), eq(workOrders.assignedThirdPartyId, thirdPartyId)) : eq(workOrders.organizationId, organizationId)).orderBy(desc(workOrders.createdAt));
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

export async function listEquipmentCatalogs(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(equipmentCatalogs).where(and(eq(equipmentCatalogs.organizationId, organizationId), eq(equipmentCatalogs.active, 1))).orderBy(equipmentCatalogs.name);
}

export async function createEquipmentCatalog(input: { organizationId: number; code: string; name: string; category?: string; manufacturer?: string; model?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(equipmentCatalogs).values(input);
  const rows = await db.select().from(equipmentCatalogs).where(and(eq(equipmentCatalogs.organizationId, input.organizationId), eq(equipmentCatalogs.code, input.code))).limit(1);
  return rows[0];
}

export async function installEquipmentFromCatalog(input: { organizationId: number; catalogId: number; customerId: number; serialNumber: string; installationLocation: string; state?: "operacional" | "manutencao" | "atencao" | "baixado"; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [catalog] = await db.select().from(equipmentCatalogs).where(and(eq(equipmentCatalogs.id, input.catalogId), eq(equipmentCatalogs.organizationId, input.organizationId))).limit(1);
  if (!catalog) throw new Error("Equipment standard not found");
  const [customer] = await db.select().from(customers).where(and(eq(customers.id, input.customerId), eq(customers.organizationId, input.organizationId))).limit(1);
  if (!customer) throw new Error("Customer not found");
  const [duplicate] = await db.select({ id: equipment.id }).from(equipment).where(and(eq(equipment.organizationId, input.organizationId), eq(equipment.serialNumber, input.serialNumber))).limit(1);
  if (duplicate) throw new Error("Serial number already linked to an equipment");
  const code = `INST-${catalog.code}-${input.serialNumber}`.replace(/[^A-Za-z0-9-]/g, "-").slice(0, 80);
  await db.insert(equipment).values({ organizationId: input.organizationId, catalogId: catalog.id, customerId: customer.id, code, name: catalog.name, model: catalog.model ?? undefined, serialNumber: input.serialNumber, installationLocation: input.installationLocation, state: input.state ?? "operacional", installedAt: new Date(), qrCode: `EQUIP:${code}`, notes: input.notes });
  const rows = await db.select().from(equipment).where(and(eq(equipment.organizationId, input.organizationId), eq(equipment.code, code))).limit(1);
  return rows[0];
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

export async function linkEquipmentToCustomer(organizationId: number, equipmentId: number, customerId: number | null, installationLocation?: string, serialNumber?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (serialNumber) {
    const [duplicate] = await db.select({ id: equipment.id }).from(equipment).where(and(eq(equipment.organizationId, organizationId), eq(equipment.serialNumber, serialNumber))).limit(1);
    if (duplicate && duplicate.id !== equipmentId) throw new Error("Serial number already linked to another equipment");
  }
  await db.update(equipment).set({ customerId, installationLocation, serialNumber, installedAt: customerId ? new Date() : undefined, updatedAt: new Date() }).where(and(eq(equipment.id, equipmentId), eq(equipment.organizationId, organizationId)));
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

export async function listCustomFormDefinitions(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(customFormDefinitions).where(and(eq(customFormDefinitions.organizationId, organizationId), eq(customFormDefinitions.active, 1))).orderBy(desc(customFormDefinitions.updatedAt));
}

export async function createCustomFormDefinition(input: { organizationId: number; entityType: string; name: string; description?: string; fieldsJson: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(customFormDefinitions).values(input);
  const rows = await db.select().from(customFormDefinitions).where(and(eq(customFormDefinitions.organizationId, input.organizationId), eq(customFormDefinitions.name, input.name))).orderBy(desc(customFormDefinitions.id)).limit(1);
  return rows[0];
}

export async function updateCustomFormDefinition(input: { organizationId: number; id: number; name?: string; description?: string; fieldsJson?: string; active?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(customFormDefinitions).set({ name: input.name, description: input.description, fieldsJson: input.fieldsJson, active: input.active, updatedAt: new Date() }).where(and(eq(customFormDefinitions.id, input.id), eq(customFormDefinitions.organizationId, input.organizationId)));
  const rows = await db.select().from(customFormDefinitions).where(and(eq(customFormDefinitions.id, input.id), eq(customFormDefinitions.organizationId, input.organizationId))).limit(1);
  return rows[0];
}

export async function duplicateCustomFormDefinition(input: { organizationId: number; id: number; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [source] = await db.select().from(customFormDefinitions).where(and(eq(customFormDefinitions.id, input.id), eq(customFormDefinitions.organizationId, input.organizationId))).limit(1);
  if (!source) throw new Error("Custom form definition not found");
  return createCustomFormDefinition({ organizationId: input.organizationId, entityType: source.entityType, name: input.name || `${source.name} (cópia)`, description: source.description || undefined, fieldsJson: source.fieldsJson });
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

export async function listWorkOrderEvidence(organizationId: number, workOrderId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db.select().from(workOrderEvidence).where(and(eq(workOrderEvidence.organizationId, organizationId), eq(workOrderEvidence.workOrderId, workOrderId))).orderBy(desc(workOrderEvidence.createdAt));
}

export async function addWorkOrderEvidence(input: {
  organizationId: number;
  workOrderId?: number;
  workOrderExternalId?: string;
  type: "foto" | "assinatura" | "documento";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  latitude?: string;
  longitude?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const workOrderRows = input.workOrderId
    ? await db.select().from(workOrders).where(and(eq(workOrders.id, input.workOrderId), eq(workOrders.organizationId, input.organizationId))).limit(1)
    : await db.select().from(workOrders).where(and(eq(workOrders.externalId, input.workOrderExternalId ?? ""), eq(workOrders.organizationId, input.organizationId))).limit(1);
  const workOrder = workOrderRows[0];
  if (!workOrder) throw new Error("Work order not found");
  const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (!match?.[1]) throw new Error("Evidence must be a base64 data URL");
  const data = Buffer.from(match[1], "base64");
  if (data.byteLength > 8 * 1024 * 1024) throw new Error("Evidence file is larger than 8 MB");
  const uploaded = await storagePut(`work-orders/${input.organizationId}/${workOrder.id}/${input.fileName}`, data, input.mimeType);
  await db.insert(workOrderEvidence).values({
    organizationId: input.organizationId,
    workOrderId: workOrder.id,
    type: input.type,
    fileKey: uploaded.key,
    fileUrl: uploaded.url,
    mimeType: input.mimeType,
    latitude: input.latitude,
    longitude: input.longitude,
    notes: input.notes,
  });
  return uploaded;
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

export async function listMondaySimulatedItems(organizationId: number, boardId?: string) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const filters = boardId ? and(eq(mondaySimulatedItems.organizationId, organizationId), eq(mondaySimulatedItems.boardId, boardId)) : eq(mondaySimulatedItems.organizationId, organizationId);
  return db.select().from(mondaySimulatedItems).where(filters).orderBy(desc(mondaySimulatedItems.lastSyncedAt));
}

export async function simulateMondayInbound(input: { organizationId: number; boardId: string; mondayItemId: string; itemName: string; status: string; quantity: number; customerName: string; city: string; equipmentStandard: string; serialPrefix: string; installationBase: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(mondaySimulatedItems).where(and(eq(mondaySimulatedItems.organizationId, input.organizationId), eq(mondaySimulatedItems.mondayItemId, input.mondayItemId))).limit(1);
  if (existing[0]) return existing[0];
  const [customer] = await db.select().from(customers).where(eq(customers.organizationId, input.organizationId)).limit(1);
  const workOrderExternalIds: string[] = [];
  const quantity = Math.min(Math.max(input.quantity, 1), 100);
  for (let index = 1; index <= quantity; index += 1) {
    const externalId = `MON-${input.mondayItemId}-${String(index).padStart(2, "0")}`;
    workOrderExternalIds.push(externalId);
    await db.insert(workOrders).values({ organizationId: input.organizationId, customerId: customer?.id, externalId, title: `${input.itemName} · Porta ${index}/${quantity}`, serviceType: "Instalação de porta industrial", priority: "media", status: input.status.toLowerCase() === "expedido" ? "agendada" : "rascunho", address: `${input.installationBase} · ${input.city}`, checklistJson: JSON.stringify({ origem: "monday-simulado", mondayItemId: input.mondayItemId, porta: index, quantidade: quantity, equipamento: input.equipmentStandard, serial: `${input.serialPrefix}-${String(index).padStart(3, "0")}` }) });
  }
  const columns = { situacao: input.status, quantidade: quantity, cliente: input.customerName, cidade: input.city, equipamento: input.equipmentStandard, prefixo_serie: input.serialPrefix, local_instalacao: input.installationBase, os_criadas: quantity, os_concluidas: 0, fotos: 0, videos: 0, ultima_sincronizacao: new Date().toISOString() };
  await db.insert(mondaySimulatedItems).values({ organizationId: input.organizationId, boardId: input.boardId, mondayItemId: input.mondayItemId, name: input.itemName, status: input.status, columnsJson: JSON.stringify(columns), workOrderIdsJson: JSON.stringify(workOrderExternalIds) });
  const rows = await db.select().from(mondaySimulatedItems).where(and(eq(mondaySimulatedItems.organizationId, input.organizationId), eq(mondaySimulatedItems.mondayItemId, input.mondayItemId))).limit(1);
  return rows[0];
}

export async function syncWorkOrderToMonday(input: { organizationId: number; mondayItemId: string; workOrderExternalId: string; status: string; evidenceCount: number; videoCount: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [item] = await db.select().from(mondaySimulatedItems).where(and(eq(mondaySimulatedItems.organizationId, input.organizationId), eq(mondaySimulatedItems.mondayItemId, input.mondayItemId))).limit(1);
  if (!item) throw new Error("Simulated monday item not found");
  const columns = (() => { try { return JSON.parse(item.columnsJson) as Record<string, unknown>; } catch { return {}; } })();
  const workOrderIds = (() => { try { return JSON.parse(item.workOrderIdsJson) as string[]; } catch { return []; } })();
  const completed = Number(columns.os_concluidas || 0) + (input.status.toLowerCase() === "concluída" || input.status.toLowerCase() === "concluida" ? 1 : 0);
  const nextColumns = { ...columns, situacao: completed >= workOrderIds.length ? "Concluído" : "Em execução", os_concluidas: Math.min(completed, workOrderIds.length), ultima_os_atualizada: input.workOrderExternalId, fotos: Number(columns.fotos || 0) + input.evidenceCount, videos: Number(columns.videos || 0) + input.videoCount, ultima_sincronizacao: new Date().toISOString() };
  await db.update(mondaySimulatedItems).set({ status: String(nextColumns.situacao), columnsJson: JSON.stringify(nextColumns), lastSyncedAt: new Date() }).where(and(eq(mondaySimulatedItems.id, item.id), eq(mondaySimulatedItems.organizationId, input.organizationId)));
  const [updated] = await db.select().from(mondaySimulatedItems).where(eq(mondaySimulatedItems.id, item.id)).limit(1);
  return updated;
}
