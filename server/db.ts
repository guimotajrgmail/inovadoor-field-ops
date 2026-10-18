import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  customers,
  customerContacts,
  customerSegments,
  customerTickets,
  customFormDefinitions,
  equipment,
  equipmentCatalogs,
  equipmentCategories,
  equipmentManufacturers,
  installationPlanVisibility,
  installationPlans,
  installationEnvironments,
  integrationConnections,
  mondaySimulatedItems,
  notifications,
  serviceFormTemplates,
  teamMembers,
  technicalRequests,
  thirdParties,
  thirdPartyContacts,
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

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function assignUserScope(input: {
  userId: number;
  organizationId: number;
  accessProfile: "gestao" | "terceiros" | "pessoas" | "campo" | "cliente";
  customerId?: number;
  thirdPartyId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({
      organizationId: input.organizationId,
      accessProfile: input.accessProfile,
      customerId: input.customerId ?? null,
      thirdPartyId: input.thirdPartyId ?? null,
    })
    .where(eq(users.id, input.userId));
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  return result[0];
}

export async function listOrganizationUsers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      accessProfile: users.accessProfile,
      lastSignedIn: users.lastSignedIn,
      customerId: users.customerId,
      thirdPartyId: users.thirdPartyId,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(users.name);
}

export async function listNotifications(
  organizationId: number,
  userId: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        sql`(${notifications.userId} is null or ${notifications.userId} = ${userId})`
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(30);
}

export async function createNotification(input: {
  organizationId: number;
  userId?: number;
  title: string;
  detail: string;
  tone?: "orange" | "blue" | "green";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(input);
}

export async function markNotificationRead(input: {
  organizationId: number;
  userId: number;
  id: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, input.id),
        eq(notifications.organizationId, input.organizationId),
        sql`(${notifications.userId} is null or ${notifications.userId} = ${input.userId})`
      )
    );
  return { success: true } as const;
}

export async function markAllNotificationsRead(input: {
  organizationId: number;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, input.organizationId),
        sql`(${notifications.userId} is null or ${notifications.userId} = ${input.userId})`,
        sql`${notifications.readAt} is null`
      )
    );
  return { success: true } as const;
}

export async function getDashboardSummary(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) {
    return {
      workOrdersOpen: 0,
      inField: 0,
      technicians: 0,
      techniciansTotal: 0,
      slaPercent: 0,
      critical: 0,
      lastSyncAt: new Date(),
    };
  }
  const [orders, field, staff, critical] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          sql`${workOrders.status} not in ('concluida','cancelada')`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          eq(workOrders.status, "em_campo")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.organizationId, organizationId),
          eq(teamMembers.status, "ativo")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          sql`${workOrders.priority} = 'alta' and ${workOrders.status} not in ('concluida','cancelada')`
        )
      ),
  ]);
  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMembers)
    .where(eq(teamMembers.organizationId, organizationId));
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

export async function listWorkOrders(
  organizationId: number,
  thirdPartyId?: number,
  customerId?: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const scope = thirdPartyId
    ? eq(workOrders.assignedThirdPartyId, thirdPartyId)
    : customerId
      ? eq(workOrders.customerId, customerId)
      : undefined;
  return db
    .select()
    .from(workOrders)
    .where(
      scope
        ? and(eq(workOrders.organizationId, organizationId), scope)
        : eq(workOrders.organizationId, organizationId)
    )
    .orderBy(desc(workOrders.createdAt));
}

export async function createWorkOrder(input: InsertWorkOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(workOrders).values(input);
  const rows = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.externalId, input.externalId))
    .limit(1);
  return rows[0];
}

export async function updateWorkOrderStatus(
  organizationId: number,
  id: number,
  status: InsertWorkOrder["status"],
  actorUserId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(workOrders)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(workOrders.id, id), eq(workOrders.organizationId, organizationId))
    );
  await db.insert(workOrderEvents).values({
    workOrderId: id,
    actorUserId,
    type: "status_updated",
    payloadJson: JSON.stringify({ status }),
  });
  await createNotification({
    organizationId,
    userId: actorUserId,
    title: "Status da OS atualizado",
    detail: `A ordem de serviço #${id} agora está em ${status}.`,
    tone: status === "concluida" ? "green" : "blue",
  });
  const rows = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.id, id))
    .limit(1);
  return rows[0];
}

export async function listCustomers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .orderBy(customers.name);
}

export async function listCustomerSegments(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(customerSegments)
    .where(
      and(
        eq(customerSegments.organizationId, organizationId),
        eq(customerSegments.active, 1)
      )
    )
    .orderBy(customerSegments.name);
}

export async function createCustomerSegment(input: {
  organizationId: number;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(customerSegments).values(input);
  const rows = await db
    .select()
    .from(customerSegments)
    .where(
      and(
        eq(customerSegments.organizationId, input.organizationId),
        eq(customerSegments.name, input.name)
      )
    )
    .orderBy(desc(customerSegments.id))
    .limit(1);
  return rows[0];
}

export async function listCustomerContacts(
  organizationId: number,
  customerId: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(customerContacts)
    .where(
      and(
        eq(customerContacts.organizationId, organizationId),
        eq(customerContacts.customerId, customerId)
      )
    )
    .orderBy(customerContacts.name);
}

export async function createCustomer(input: {
  organizationId: number;
  name: string;
  document?: string;
  contractNumber?: string;
  segmentId?: number;
  city?: string;
  state?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contacts?: Array<{
    name: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const year = new Date().getFullYear();
  const [latest] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.organizationId, input.organizationId))
    .orderBy(desc(customers.id))
    .limit(1);
  const contractNumber =
    input.contractNumber ||
    `CTR-${year}-${String((latest?.id ?? 0) + 1).padStart(5, "0")}`;
  await db.insert(customers).values({
    organizationId: input.organizationId,
    name: input.name,
    document: input.document,
    contractNumber,
    segmentId: input.segmentId,
    city: input.city,
    state: input.state,
    address: input.address,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
  });
  const rows = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, input.organizationId),
        eq(customers.contractNumber, contractNumber)
      )
    )
    .limit(1);
  const customer = rows[0];
  if (customer && input.contacts?.length) {
    await db.insert(customerContacts).values(
      input.contacts.map(contact => ({
        organizationId: input.organizationId,
        customerId: customer.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        isPrimary: contact.isPrimary ? 1 : 0,
      }))
    );
  }
  return customer;
}

export async function listEquipment(
  organizationId: number,
  customerId?: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(equipment)
    .where(
      customerId
        ? and(
            eq(equipment.organizationId, organizationId),
            eq(equipment.customerId, customerId)
          )
        : eq(equipment.organizationId, organizationId)
    )
    .orderBy(desc(equipment.updatedAt));
}

export async function listEquipmentCategories(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(equipmentCategories)
    .where(
      and(
        eq(equipmentCategories.organizationId, organizationId),
        eq(equipmentCategories.active, 1)
      )
    )
    .orderBy(equipmentCategories.name);
}

export async function createEquipmentCategory(input: {
  organizationId: number;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(equipmentCategories).values(input);
  const rows = await db
    .select()
    .from(equipmentCategories)
    .where(
      and(
        eq(equipmentCategories.organizationId, input.organizationId),
        eq(equipmentCategories.name, input.name)
      )
    )
    .orderBy(desc(equipmentCategories.id))
    .limit(1);
  return rows[0];
}

export async function listEquipmentManufacturers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(equipmentManufacturers)
    .where(
      and(
        eq(equipmentManufacturers.organizationId, organizationId),
        eq(equipmentManufacturers.active, 1)
      )
    )
    .orderBy(equipmentManufacturers.name);
}

export async function createEquipmentManufacturer(input: {
  organizationId: number;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(equipmentManufacturers).values(input);
  const rows = await db
    .select()
    .from(equipmentManufacturers)
    .where(
      and(
        eq(equipmentManufacturers.organizationId, input.organizationId),
        eq(equipmentManufacturers.name, input.name)
      )
    )
    .orderBy(desc(equipmentManufacturers.id))
    .limit(1);
  return rows[0];
}

export async function listInstallationEnvironments(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(installationEnvironments)
    .where(eq(installationEnvironments.organizationId, organizationId))
    .orderBy(installationEnvironments.name);
}

export async function createInstallationEnvironment(input: {
  organizationId: number;
  name: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(installationEnvironments).values(input);
  const rows = await db
    .select()
    .from(installationEnvironments)
    .where(
      and(
        eq(installationEnvironments.organizationId, input.organizationId),
        eq(installationEnvironments.name, input.name)
      )
    )
    .orderBy(desc(installationEnvironments.id))
    .limit(1);
  return rows[0];
}

export async function listEquipmentCatalogs(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(equipmentCatalogs)
    .where(
      and(
        eq(equipmentCatalogs.organizationId, organizationId),
        eq(equipmentCatalogs.active, 1)
      )
    )
    .orderBy(equipmentCatalogs.name);
}

export async function createEquipmentCatalog(input: {
  organizationId: number;
  code: string;
  name: string;
  category?: string;
  categoryId?: number;
  manufacturer?: string;
  manufacturerId?: number;
  model?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(equipmentCatalogs).values(input);
  const rows = await db
    .select()
    .from(equipmentCatalogs)
    .where(
      and(
        eq(equipmentCatalogs.organizationId, input.organizationId),
        eq(equipmentCatalogs.code, input.code)
      )
    )
    .limit(1);
  return rows[0];
}

export async function installEquipmentFromCatalog(input: {
  organizationId: number;
  catalogId: number;
  customerId: number;
  serialNumber: string;
  installationLocation: string;
  environmentId?: number;
  state?: "operacional" | "manutencao" | "atencao" | "baixado";
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [catalog] = await db
    .select()
    .from(equipmentCatalogs)
    .where(
      and(
        eq(equipmentCatalogs.id, input.catalogId),
        eq(equipmentCatalogs.organizationId, input.organizationId)
      )
    )
    .limit(1);
  if (!catalog) throw new Error("Equipment standard not found");
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, input.customerId),
        eq(customers.organizationId, input.organizationId)
      )
    )
    .limit(1);
  if (!customer) throw new Error("Customer not found");
  const [duplicate] = await db
    .select({ id: equipment.id })
    .from(equipment)
    .where(
      and(
        eq(equipment.organizationId, input.organizationId),
        eq(equipment.serialNumber, input.serialNumber)
      )
    )
    .limit(1);
  if (duplicate)
    throw new Error("Serial number already linked to an equipment");
  const code = `INST-${catalog.code}-${input.serialNumber}`
    .replace(/[^A-Za-z0-9-]/g, "-")
    .slice(0, 80);
  await db.insert(equipment).values({
    organizationId: input.organizationId,
    catalogId: catalog.id,
    customerId: customer.id,
    code,
    name: catalog.name,
    model: catalog.model ?? undefined,
    serialNumber: input.serialNumber,
    installationLocation: input.installationLocation,
    environmentId: input.environmentId,
    state: input.state ?? "operacional",
    installedAt: new Date(),
    qrCode: `EQUIP:${code}`,
    notes: input.notes,
  });
  const rows = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.organizationId, input.organizationId),
        eq(equipment.code, code)
      )
    )
    .limit(1);
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
  const rows = await db
    .select()
    .from(equipment)
    .where(eq(equipment.code, input.code))
    .limit(1);
  return rows[0];
}

export async function linkEquipmentToCustomer(
  organizationId: number,
  equipmentId: number,
  customerId: number | null,
  installationLocation?: string,
  serialNumber?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (serialNumber) {
    const [duplicate] = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(
        and(
          eq(equipment.organizationId, organizationId),
          eq(equipment.serialNumber, serialNumber)
        )
      )
      .limit(1);
    if (duplicate && duplicate.id !== equipmentId)
      throw new Error("Serial number already linked to another equipment");
  }
  await db
    .update(equipment)
    .set({
      customerId,
      installationLocation,
      serialNumber,
      installedAt: customerId ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(equipment.id, equipmentId),
        eq(equipment.organizationId, organizationId)
      )
    );
  const rows = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.id, equipmentId),
        eq(equipment.organizationId, organizationId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function listTeamMembers(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.organizationId, organizationId))
    .orderBy(teamMembers.name);
}

export async function createTeamMember(input: {
  organizationId: number;
  name: string;
  email: string;
  phone?: string;
  profile: "gestao" | "coordenacao" | "campo" | "terceiro";
  area?: string;
  status?: "ativo" | "pendente" | "inativo";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(teamMembers).values({
    ...input,
    area: input.area || "Operações de campo",
    status: input.status || "pendente",
  });
  const rows = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.organizationId, input.organizationId),
        eq(teamMembers.email, input.email)
      )
    )
    .orderBy(desc(teamMembers.id))
    .limit(1);
  return rows[0];
}

export async function updateTeamMember(input: {
  organizationId: number;
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  profile?: "gestao" | "coordenacao" | "campo" | "terceiro";
  area?: string;
  status?: "ativo" | "pendente" | "inativo";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { id, organizationId, ...changes } = input;
  await db
    .update(teamMembers)
    .set(changes)
    .where(
      and(
        eq(teamMembers.id, id),
        eq(teamMembers.organizationId, organizationId)
      )
    );
  const rows = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.id, id),
        eq(teamMembers.organizationId, organizationId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function listThirdParties(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(thirdParties)
    .where(eq(thirdParties.organizationId, organizationId))
    .orderBy(thirdParties.name);
}

export async function listThirdPartyContacts(
  organizationId: number,
  thirdPartyId: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(thirdPartyContacts)
    .where(
      and(
        eq(thirdPartyContacts.organizationId, organizationId),
        eq(thirdPartyContacts.thirdPartyId, thirdPartyId)
      )
    )
    .orderBy(thirdPartyContacts.name);
}

export async function createThirdParty(input: {
  organizationId: number;
  name: string;
  document?: string;
  region?: string;
  baseAddress?: string;
  serviceRadiusKm?: number;
  teamCount?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contacts?: Array<{ name: string; phone?: string; email?: string }>;
  status?: "homologado" | "em_revisao" | "bloqueado";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(thirdParties).values({
    organizationId: input.organizationId,
    name: input.name,
    document: input.document,
    region: input.region,
    baseAddress: input.baseAddress,
    serviceRadiusKm: input.serviceRadiusKm ?? 0,
    teamCount: input.teamCount ?? 0,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    status: input.status ?? "em_revisao",
  });
  const rows = await db
    .select()
    .from(thirdParties)
    .where(
      and(
        eq(thirdParties.organizationId, input.organizationId),
        eq(thirdParties.name, input.name)
      )
    )
    .orderBy(desc(thirdParties.id))
    .limit(1);
  const thirdParty = rows[0];
  if (thirdParty && input.contacts?.length) {
    await db.insert(thirdPartyContacts).values(
      input.contacts.map(contact => ({
        organizationId: input.organizationId,
        thirdPartyId: thirdParty.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      }))
    );
  }
  return thirdParty;
}

export async function listServiceFormTemplates(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(serviceFormTemplates)
    .where(eq(serviceFormTemplates.organizationId, organizationId))
    .orderBy(desc(serviceFormTemplates.updatedAt));
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
  const rows = await db
    .select()
    .from(serviceFormTemplates)
    .where(
      and(
        eq(serviceFormTemplates.organizationId, input.organizationId),
        eq(serviceFormTemplates.name, input.name)
      )
    )
    .orderBy(desc(serviceFormTemplates.id))
    .limit(1);
  return rows[0];
}

export async function listCustomFormDefinitions(organizationId: number) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(customFormDefinitions)
    .where(
      and(
        eq(customFormDefinitions.organizationId, organizationId),
        eq(customFormDefinitions.active, 1)
      )
    )
    .orderBy(desc(customFormDefinitions.updatedAt));
}

export async function createCustomFormDefinition(input: {
  organizationId: number;
  entityType: string;
  name: string;
  description?: string;
  fieldsJson: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(customFormDefinitions).values(input);
  const rows = await db
    .select()
    .from(customFormDefinitions)
    .where(
      and(
        eq(customFormDefinitions.organizationId, input.organizationId),
        eq(customFormDefinitions.name, input.name)
      )
    )
    .orderBy(desc(customFormDefinitions.id))
    .limit(1);
  return rows[0];
}

export async function updateCustomFormDefinition(input: {
  organizationId: number;
  id: number;
  name?: string;
  description?: string;
  fieldsJson?: string;
  active?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(customFormDefinitions)
    .set({
      name: input.name,
      description: input.description,
      fieldsJson: input.fieldsJson,
      active: input.active,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customFormDefinitions.id, input.id),
        eq(customFormDefinitions.organizationId, input.organizationId)
      )
    );
  const rows = await db
    .select()
    .from(customFormDefinitions)
    .where(
      and(
        eq(customFormDefinitions.id, input.id),
        eq(customFormDefinitions.organizationId, input.organizationId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function duplicateCustomFormDefinition(input: {
  organizationId: number;
  id: number;
  name?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [source] = await db
    .select()
    .from(customFormDefinitions)
    .where(
      and(
        eq(customFormDefinitions.id, input.id),
        eq(customFormDefinitions.organizationId, input.organizationId)
      )
    )
    .limit(1);
  if (!source) throw new Error("Custom form definition not found");
  return createCustomFormDefinition({
    organizationId: input.organizationId,
    entityType: source.entityType,
    name: input.name || `${source.name} (cópia)`,
    description: source.description || undefined,
    fieldsJson: source.fieldsJson,
  });
}

export async function listCustomerTickets(
  organizationId: number,
  customerId?: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const filters = customerId
    ? and(
        eq(customerTickets.organizationId, organizationId),
        eq(customerTickets.customerId, customerId)
      )
    : eq(customerTickets.organizationId, organizationId);
  return db
    .select()
    .from(customerTickets)
    .where(filters)
    .orderBy(desc(customerTickets.createdAt));
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
  await createNotification({
    organizationId: input.organizationId,
    title: "Novo chamado recebido",
    detail: `${input.title} foi encaminhado para a triagem Inovadoor.`,
    tone: "orange",
  });
  const rows = await db
    .select()
    .from(customerTickets)
    .where(eq(customerTickets.externalId, input.externalId))
    .limit(1);
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
  const ticketRows = await db
    .select()
    .from(customerTickets)
    .where(
      and(
        eq(customerTickets.id, input.ticketId),
        eq(customerTickets.organizationId, input.organizationId)
      )
    )
    .limit(1);
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
  await db
    .update(customerTickets)
    .set({ status: "convertido_em_os", updatedAt: new Date() })
    .where(
      and(
        eq(customerTickets.id, ticket.id),
        eq(customerTickets.organizationId, input.organizationId)
      )
    );
  const rows = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.externalId, input.externalId))
    .limit(1);
  return rows[0];
}

export async function listWorkOrderEvidence(
  organizationId: number,
  workOrderId: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  return db
    .select()
    .from(workOrderEvidence)
    .where(
      and(
        eq(workOrderEvidence.organizationId, organizationId),
        eq(workOrderEvidence.workOrderId, workOrderId)
      )
    )
    .orderBy(desc(workOrderEvidence.createdAt));
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
    ? await db
        .select()
        .from(workOrders)
        .where(
          and(
            eq(workOrders.id, input.workOrderId),
            eq(workOrders.organizationId, input.organizationId)
          )
        )
        .limit(1)
    : await db
        .select()
        .from(workOrders)
        .where(
          and(
            eq(workOrders.externalId, input.workOrderExternalId ?? ""),
            eq(workOrders.organizationId, input.organizationId)
          )
        )
        .limit(1);
  const workOrder = workOrderRows[0];
  if (!workOrder) throw new Error("Work order not found");
  const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (!match?.[1]) throw new Error("Evidence must be a base64 data URL");
  const data = Buffer.from(match[1], "base64");
  if (data.byteLength > 8 * 1024 * 1024)
    throw new Error("Evidence file is larger than 8 MB");
  const uploaded = await storagePut(
    `work-orders/${input.organizationId}/${workOrder.id}/${input.fileName}`,
    data,
    input.mimeType
  );
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

export async function getIntegrationConnection(
  organizationId: number,
  provider: "monday" | "maps" | "email"
) {
  const db = await getDb();
  if (!db || !organizationId) return undefined;
  const rows = await db
    .select()
    .from(integrationConnections)
    .where(
      and(
        eq(integrationConnections.organizationId, organizationId),
        eq(integrationConnections.provider, provider)
      )
    )
    .limit(1);
  return rows[0];
}

export async function upsertMondayConnection(
  organizationId: number,
  workspaceId: string,
  settingsJson?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getIntegrationConnection(organizationId, "monday");
  if (existing) {
    await db
      .update(integrationConnections)
      .set({
        status: "conectado",
        workspaceId,
        settingsJson,
        updatedAt: new Date(),
      })
      .where(eq(integrationConnections.id, existing.id));
  } else {
    await db.insert(integrationConnections).values({
      organizationId,
      provider: "monday",
      status: "conectado",
      workspaceId,
      settingsJson,
    });
  }
  return getIntegrationConnection(organizationId, "monday");
}

export async function listMondaySimulatedItems(
  organizationId: number,
  boardId?: string
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const filters = boardId
    ? and(
        eq(mondaySimulatedItems.organizationId, organizationId),
        eq(mondaySimulatedItems.boardId, boardId)
      )
    : eq(mondaySimulatedItems.organizationId, organizationId);
  return db
    .select()
    .from(mondaySimulatedItems)
    .where(filters)
    .orderBy(desc(mondaySimulatedItems.lastSyncedAt));
}

export async function simulateMondayInbound(input: {
  organizationId: number;
  boardId: string;
  mondayItemId: string;
  itemName: string;
  status: string;
  quantity: number;
  customerName: string;
  city: string;
  equipmentStandard: string;
  serialPrefix: string;
  installationBase: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select()
    .from(mondaySimulatedItems)
    .where(
      and(
        eq(mondaySimulatedItems.organizationId, input.organizationId),
        eq(mondaySimulatedItems.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, input.organizationId))
    .limit(1);
  const workOrderExternalIds: string[] = [];
  const quantity = Math.min(Math.max(input.quantity, 1), 100);
  for (let index = 1; index <= quantity; index += 1) {
    const externalId = `MON-${input.mondayItemId}-${String(index).padStart(2, "0")}`;
    workOrderExternalIds.push(externalId);
    await db.insert(workOrders).values({
      organizationId: input.organizationId,
      customerId: customer?.id,
      externalId,
      title: `${input.itemName} · Porta ${index}/${quantity}`,
      serviceType: "Instalação de porta industrial",
      priority: "media",
      status:
        input.status.toLowerCase() === "expedido" ? "agendada" : "rascunho",
      address: `${input.installationBase} · ${input.city}`,
      checklistJson: JSON.stringify({
        origem: "monday-simulado",
        mondayItemId: input.mondayItemId,
        porta: index,
        quantidade: quantity,
        equipamento: input.equipmentStandard,
        serial: `${input.serialPrefix}-${String(index).padStart(3, "0")}`,
      }),
    });
  }
  const columns = {
    situacao: input.status,
    quantidade: quantity,
    cliente: input.customerName,
    cidade: input.city,
    equipamento: input.equipmentStandard,
    prefixo_serie: input.serialPrefix,
    local_instalacao: input.installationBase,
    os_criadas: quantity,
    os_concluidas: 0,
    fotos: 0,
    videos: 0,
    ultima_sincronizacao: new Date().toISOString(),
  };
  await db.insert(mondaySimulatedItems).values({
    organizationId: input.organizationId,
    boardId: input.boardId,
    mondayItemId: input.mondayItemId,
    name: input.itemName,
    status: input.status,
    columnsJson: JSON.stringify(columns),
    workOrderIdsJson: JSON.stringify(workOrderExternalIds),
  });
  await createNotification({
    organizationId: input.organizationId,
    title: "Lote importado do monday.com",
    detail: `${quantity} OS foram criadas a partir de ${input.itemName}.`,
    tone: "blue",
  });
  const rows = await db
    .select()
    .from(mondaySimulatedItems)
    .where(
      and(
        eq(mondaySimulatedItems.organizationId, input.organizationId),
        eq(mondaySimulatedItems.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function syncWorkOrderToMonday(input: {
  organizationId: number;
  mondayItemId: string;
  workOrderExternalId: string;
  status: string;
  evidenceCount: number;
  videoCount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [item] = await db
    .select()
    .from(mondaySimulatedItems)
    .where(
      and(
        eq(mondaySimulatedItems.organizationId, input.organizationId),
        eq(mondaySimulatedItems.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  if (!item) throw new Error("Simulated monday item not found");
  const columns = (() => {
    try {
      return JSON.parse(item.columnsJson) as Record<string, unknown>;
    } catch {
      return {};
    }
  })();
  const workOrderIds = (() => {
    try {
      return JSON.parse(item.workOrderIdsJson) as string[];
    } catch {
      return [];
    }
  })();
  const completed =
    Number(columns.os_concluidas || 0) +
    (input.status.toLowerCase() === "concluída" ||
    input.status.toLowerCase() === "concluida"
      ? 1
      : 0);
  const nextColumns = {
    ...columns,
    situacao: completed >= workOrderIds.length ? "Concluído" : "Em execução",
    os_concluidas: Math.min(completed, workOrderIds.length),
    ultima_os_atualizada: input.workOrderExternalId,
    fotos: Number(columns.fotos || 0) + input.evidenceCount,
    videos: Number(columns.videos || 0) + input.videoCount,
    ultima_sincronizacao: new Date().toISOString(),
  };
  await db
    .update(mondaySimulatedItems)
    .set({
      status: String(nextColumns.situacao),
      columnsJson: JSON.stringify(nextColumns),
      lastSyncedAt: new Date(),
    })
    .where(
      and(
        eq(mondaySimulatedItems.id, item.id),
        eq(mondaySimulatedItems.organizationId, input.organizationId)
      )
    );
  await createNotification({
    organizationId: input.organizationId,
    title: "Atualização enviada ao monday.com",
    detail: `${input.workOrderExternalId} sincronizada com ${input.evidenceCount} fotos e ${input.videoCount} vídeos.`,
    tone: nextColumns.situacao === "Concluído" ? "green" : "blue",
  });
  const [updated] = await db
    .select()
    .from(mondaySimulatedItems)
    .where(eq(mondaySimulatedItems.id, item.id))
    .limit(1);
  return updated;
}

export async function listInstallationPlans(
  organizationId: number,
  memberEmail?: string | null
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const plans = await db
    .select()
    .from(installationPlans)
    .where(eq(installationPlans.organizationId, organizationId))
    .orderBy(desc(installationPlans.updatedAt));
  if (!memberEmail) return plans;
  const member = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.organizationId, organizationId),
        eq(teamMembers.email, memberEmail)
      )
    )
    .limit(1);
  if (!member[0]) return [];
  const visibility = await db
    .select()
    .from(installationPlanVisibility)
    .where(
      and(
        eq(installationPlanVisibility.organizationId, organizationId),
        eq(installationPlanVisibility.teamMemberId, member[0].id)
      )
    );
  const visibleIds = new Set(
    visibility.filter(row => row.state !== "recusada").map(row => row.planId)
  );
  return plans.filter(
    plan =>
      plan.acceptedByMemberId === member[0].id ||
      (plan.status === "disponivel" && visibleIds.has(plan.id))
  );
}

export async function upsertInstallationPlan(input: {
  organizationId: number;
  boardId: string;
  mondayItemId: string;
  title: string;
  mondayStatus?: string | null;
  customerName?: string | null;
  location?: string | null;
  scheduledAt?: Date | null;
  metadataJson?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [existing] = await db
    .select()
    .from(installationPlans)
    .where(
      and(
        eq(installationPlans.organizationId, input.organizationId),
        eq(installationPlans.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  if (existing) {
    await db
      .update(installationPlans)
      .set({
        boardId: input.boardId,
        title: input.title,
        mondayStatus: input.mondayStatus,
        customerName: input.customerName,
        location: input.location,
        scheduledAt: input.scheduledAt,
        metadataJson: input.metadataJson,
        updatedAt: new Date(),
      })
      .where(eq(installationPlans.id, existing.id));
    const [updated] = await db
      .select()
      .from(installationPlans)
      .where(eq(installationPlans.id, existing.id))
      .limit(1);
    return updated;
  }
  await db.insert(installationPlans).values({
    organizationId: input.organizationId,
    boardId: input.boardId,
    mondayItemId: input.mondayItemId,
    title: input.title,
    mondayStatus: input.mondayStatus,
    customerName: input.customerName,
    location: input.location,
    scheduledAt: input.scheduledAt,
    metadataJson: input.metadataJson,
  });
  const [created] = await db
    .select()
    .from(installationPlans)
    .where(
      and(
        eq(installationPlans.organizationId, input.organizationId),
        eq(installationPlans.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  return created;
}

export async function assignInstallationPlanVisibility(input: {
  organizationId: number;
  planId: number;
  teamMemberId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [existing] = await db
    .select()
    .from(installationPlanVisibility)
    .where(
      and(
        eq(installationPlanVisibility.organizationId, input.organizationId),
        eq(installationPlanVisibility.planId, input.planId),
        eq(installationPlanVisibility.teamMemberId, input.teamMemberId)
      )
    )
    .limit(1);
  if (existing) {
    await db
      .update(installationPlanVisibility)
      .set({ state: "visivel", updatedAt: new Date() })
      .where(eq(installationPlanVisibility.id, existing.id));
    return existing.id;
  }
  await db.insert(installationPlanVisibility).values({
    organizationId: input.organizationId,
    planId: input.planId,
    teamMemberId: input.teamMemberId,
  });
  return true;
}

export async function acceptInstallationPlan(input: {
  organizationId: number;
  planId: number;
  memberEmail: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.organizationId, input.organizationId),
        eq(teamMembers.email, input.memberEmail),
        eq(teamMembers.status, "ativo")
      )
    )
    .limit(1);
  if (!member) throw new Error("Técnico não encontrado no time ativo");
  const [plan] = await db
    .select()
    .from(installationPlans)
    .where(
      and(
        eq(installationPlans.id, input.planId),
        eq(installationPlans.organizationId, input.organizationId)
      )
    )
    .limit(1);
  if (!plan) throw new Error("Obra de instalação não encontrada");
  if (plan.status !== "disponivel") {
    if (plan.acceptedByMemberId === member.id) return plan;
    throw new Error("Esta obra já foi aceita por outro instalador");
  }
  const [candidate] = await db
    .select()
    .from(installationPlanVisibility)
    .where(
      and(
        eq(installationPlanVisibility.organizationId, input.organizationId),
        eq(installationPlanVisibility.planId, plan.id),
        eq(installationPlanVisibility.teamMemberId, member.id),
        eq(installationPlanVisibility.state, "visivel")
      )
    )
    .limit(1);
  if (!candidate)
    throw new Error("Você não está na lista de instaladores desta obra");

  let workOrderId = plan.workOrderId;
  if (!workOrderId) {
    const externalId = `MON-INST-${plan.mondayItemId}`;
    const [existingOrder] = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(eq(workOrders.externalId, externalId))
      .limit(1);
    if (existingOrder) {
      workOrderId = existingOrder.id;
    } else {
      await db.insert(workOrders).values({
        organizationId: input.organizationId,
        assignedMemberId: member.id,
        externalId,
        title: plan.title,
        serviceType: "Instalação de porta industrial",
        priority: "media",
        status: "agendada",
        scheduledAt: plan.scheduledAt,
        address: plan.location,
        notes: `Obra aceita pelo instalador ${member.name}. Origem monday item ${plan.mondayItemId}.`,
      });
      const [createdOrder] = await db
        .select({ id: workOrders.id })
        .from(workOrders)
        .where(eq(workOrders.externalId, externalId))
        .limit(1);
      workOrderId = createdOrder?.id;
    }
  }
  await db
    .update(installationPlans)
    .set({
      status: "aceita",
      acceptedByMemberId: member.id,
      acceptedAt: new Date(),
      workOrderId,
      updatedAt: new Date(),
    })
    .where(eq(installationPlans.id, plan.id));
  await db
    .update(installationPlanVisibility)
    .set({ state: "recusada", updatedAt: new Date() })
    .where(
      and(
        eq(installationPlanVisibility.organizationId, input.organizationId),
        eq(installationPlanVisibility.planId, plan.id)
      )
    );
  await db
    .update(installationPlanVisibility)
    .set({ state: "aceita", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(installationPlanVisibility.id, candidate.id));
  await createNotification({
    organizationId: input.organizationId,
    title: "Obra aceita pelo instalador",
    detail: `${plan.title} foi aceita por ${member.name} e virou a OS ${workOrderId ?? "pendente"}.`,
    tone: "green",
  });
  const [updated] = await db
    .select()
    .from(installationPlans)
    .where(eq(installationPlans.id, plan.id))
    .limit(1);
  return updated;
}

export async function listTechnicalRequests(
  organizationId: number,
  thirdPartyId?: number
) {
  const db = await getDb();
  if (!db || !organizationId) return [];
  const scope = thirdPartyId
    ? and(
        eq(technicalRequests.organizationId, organizationId),
        eq(technicalRequests.assignedThirdPartyId, thirdPartyId)
      )
    : eq(technicalRequests.organizationId, organizationId);
  return db
    .select()
    .from(technicalRequests)
    .where(scope)
    .orderBy(desc(technicalRequests.updatedAt));
}

export async function upsertTechnicalRequest(input: {
  organizationId: number;
  boardId: string;
  mondayItemId: string;
  title: string;
  customerName?: string | null;
  location?: string | null;
  equipment?: string | null;
  priority?: "baixa" | "media" | "alta" | "critica";
  notes?: string | null;
  metadataJson?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [existing] = await db
    .select()
    .from(technicalRequests)
    .where(
      and(
        eq(technicalRequests.organizationId, input.organizationId),
        eq(technicalRequests.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  if (existing) {
    await db
      .update(technicalRequests)
      .set({
        boardId: input.boardId,
        title: input.title,
        customerName: input.customerName,
        location: input.location,
        equipment: input.equipment,
        priority: input.priority ?? existing.priority,
        notes: input.notes,
        metadataJson: input.metadataJson,
        updatedAt: new Date(),
      })
      .where(eq(technicalRequests.id, existing.id));
    const [updated] = await db
      .select()
      .from(technicalRequests)
      .where(eq(technicalRequests.id, existing.id))
      .limit(1);
    return updated;
  }
  await db.insert(technicalRequests).values({
    organizationId: input.organizationId,
    boardId: input.boardId,
    mondayItemId: input.mondayItemId,
    title: input.title,
    customerName: input.customerName,
    location: input.location,
    equipment: input.equipment,
    priority: input.priority ?? "media",
    notes: input.notes,
    metadataJson: input.metadataJson,
  });
  const [created] = await db
    .select()
    .from(technicalRequests)
    .where(
      and(
        eq(technicalRequests.organizationId, input.organizationId),
        eq(technicalRequests.mondayItemId, input.mondayItemId)
      )
    )
    .limit(1);
  return created;
}

export async function updateTechnicalRequest(input: {
  organizationId: number;
  id: number;
  status?:
    | "novo"
    | "triagem"
    | "agendado"
    | "em_execucao"
    | "concluido"
    | "cancelado";
  priority?: "baixa" | "media" | "alta" | "critica";
  assignedMemberId?: number | null;
  assignedThirdPartyId?: number | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { id, organizationId, ...changes } = input;
  await db
    .update(technicalRequests)
    .set({ ...changes, updatedAt: new Date() })
    .where(
      and(
        eq(technicalRequests.id, id),
        eq(technicalRequests.organizationId, organizationId)
      )
    );
  const [updated] = await db
    .select()
    .from(technicalRequests)
    .where(eq(technicalRequests.id, id))
    .limit(1);
  return updated;
}

export async function convertTechnicalRequestToWorkOrder(input: {
  organizationId: number;
  id: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [request] = await db
    .select()
    .from(technicalRequests)
    .where(
      and(
        eq(technicalRequests.id, input.id),
        eq(technicalRequests.organizationId, input.organizationId)
      )
    )
    .limit(1);
  if (!request) throw new Error("Solicitação técnica não encontrada");
  if (request.workOrderId) return request;
  const externalId = `MON-ASSIST-${request.mondayItemId}`;
  const [existingOrder] = await db
    .select({ id: workOrders.id })
    .from(workOrders)
    .where(eq(workOrders.externalId, externalId))
    .limit(1);
  let workOrderId = existingOrder?.id;
  if (!workOrderId) {
    await db.insert(workOrders).values({
      organizationId: input.organizationId,
      assignedMemberId: request.assignedMemberId,
      assignedThirdPartyId: request.assignedThirdPartyId,
      externalId,
      title: request.title,
      serviceType: "Assistência técnica",
      priority: request.priority === "critica" ? "alta" : request.priority,
      status: "rascunho",
      address: request.location,
      notes: request.notes,
    });
    const [createdOrder] = await db
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(eq(workOrders.externalId, externalId))
      .limit(1);
    workOrderId = createdOrder?.id;
  }
  await db
    .update(technicalRequests)
    .set({ status: "agendado", workOrderId, updatedAt: new Date() })
    .where(eq(technicalRequests.id, request.id));
  await createNotification({
    organizationId: input.organizationId,
    title: "Assistência convertida em OS",
    detail: `${request.title} foi convertida para a OS ${workOrderId ?? "pendente"}.`,
    tone: "blue",
  });
  return { ...request, status: "agendado" as const, workOrderId };
}
