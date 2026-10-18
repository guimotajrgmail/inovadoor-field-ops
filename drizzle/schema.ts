import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accessProfile: mysqlEnum("accessProfile", [
    "gestao",
    "terceiros",
    "pessoas",
    "campo",
    "cliente",
  ])
    .default("gestao")
    .notNull(),
  organizationId: int("organizationId"),
  customerId: int("customerId"),
  thirdPartyId: int("thirdPartyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId"),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  tone: mysqlEnum("tone", ["orange", "blue", "green"])
    .default("blue")
    .notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  segment: varchar("segment", { length: 120 })
    .default("Portas industriais")
    .notNull(),
  plan: varchar("plan", { length: 60 }).default("enterprise").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  profile: mysqlEnum("profile", ["gestao", "coordenacao", "campo", "terceiro"])
    .default("campo")
    .notNull(),
  area: varchar("area", { length: 120 })
    .default("Operações de campo")
    .notNull(),
  status: mysqlEnum("status", ["ativo", "pendente", "inativo"])
    .default("ativo")
    .notNull(),
  lastAccessAt: timestamp("lastAccessAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  document: varchar("document", { length: 30 }),
  contractNumber: varchar("contractNumber", { length: 60 }).unique(),
  segmentId: int("segmentId"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  address: text("address"),
  contactName: varchar("contactName", { length: 160 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerSegments = mysqlTable("customerSegments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerContacts = mysqlTable("customerContacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  customerId: int("customerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  isPrimary: int("isPrimary").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const thirdParties = mysqlTable("thirdParties", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  document: varchar("document", { length: 30 }),
  region: varchar("region", { length: 100 }),
  baseAddress: text("baseAddress"),
  serviceRadiusKm: int("serviceRadiusKm").default(0).notNull(),
  teamCount: int("teamCount").default(0).notNull(),
  contactName: varchar("contactName", { length: 160 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  status: mysqlEnum("status", ["homologado", "em_revisao", "bloqueado"])
    .default("em_revisao")
    .notNull(),
  slaPercent: int("slaPercent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const thirdPartyContacts = mysqlTable("thirdPartyContacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  thirdPartyId: int("thirdPartyId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const equipmentCategories = mysqlTable("equipmentCategories", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const equipmentManufacturers = mysqlTable("equipmentManufacturers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const installationEnvironments = mysqlTable("installationEnvironments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const equipmentCatalogs = mysqlTable("equipmentCatalogs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  categoryId: int("categoryId"),
  manufacturerId: int("manufacturerId"),
  category: varchar("category", { length: 120 })
    .default("Porta industrial")
    .notNull(),
  manufacturer: varchar("manufacturer", { length: 120 }),
  model: varchar("model", { length: 120 }),
  description: text("description"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  catalogId: int("catalogId"),
  customerId: int("customerId"),
  code: varchar("code", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  model: varchar("model", { length: 120 }),
  serialNumber: varchar("serialNumber", { length: 120 }),
  installationLocation: varchar("installationLocation", { length: 180 }),
  environmentId: int("environmentId"),
  state: mysqlEnum("state", ["operacional", "manutencao", "atencao", "baixado"])
    .default("operacional")
    .notNull(),
  installedAt: timestamp("installedAt"),
  lastMaintenanceAt: timestamp("lastMaintenanceAt"),
  nextMaintenanceAt: timestamp("nextMaintenanceAt"),
  qrCode: varchar("qrCode", { length: 160 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workOrders = mysqlTable("workOrders", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  customerId: int("customerId"),
  equipmentId: int("equipmentId"),
  assignedMemberId: int("assignedMemberId"),
  assignedThirdPartyId: int("assignedThirdPartyId"),
  externalId: varchar("externalId", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  serviceType: varchar("serviceType", { length: 120 }).notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta"])
    .default("media")
    .notNull(),
  status: mysqlEnum("status", [
    "rascunho",
    "agendada",
    "em_campo",
    "aguardando_peca",
    "em_aprovacao",
    "concluida",
    "cancelada",
  ])
    .default("rascunho")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  checkInAt: timestamp("checkInAt"),
  checkOutAt: timestamp("checkOutAt"),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  address: text("address"),
  checklistJson: text("checklistJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workOrderEvents = mysqlTable("workOrderEvents", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: int("workOrderId").notNull(),
  actorUserId: int("actorUserId"),
  type: varchar("type", { length: 80 }).notNull(),
  payloadJson: text("payloadJson"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export const integrationConnections = mysqlTable("integrationConnections", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  provider: mysqlEnum("provider", ["monday", "maps", "email"]).notNull(),
  status: mysqlEnum("status", ["pendente", "conectado", "erro"])
    .default("pendente")
    .notNull(),
  workspaceId: varchar("workspaceId", { length: 120 }),
  settingsJson: text("settingsJson"),
  lastSyncAt: timestamp("lastSyncAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mondaySimulatedItems = mysqlTable("mondaySimulatedItems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  boardId: varchar("boardId", { length: 80 }).notNull(),
  mondayItemId: varchar("mondayItemId", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  status: varchar("status", { length: 80 }).notNull(),
  columnsJson: text("columnsJson").notNull(),
  workOrderIdsJson: text("workOrderIdsJson").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
});

export const serviceFormTemplates = mysqlTable("serviceFormTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["atendimento", "instalacao"]).notNull(),
  description: text("description"),
  fieldsJson: text("fieldsJson").notNull(),
  active: int("active").default(1).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customFormDefinitions = mysqlTable("customFormDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  fieldsJson: text("fieldsJson").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerTickets = mysqlTable("customerTickets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  customerId: int("customerId").notNull(),
  equipmentId: int("equipmentId"),
  externalId: varchar("externalId", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["baixa", "media", "alta"])
    .default("media")
    .notNull(),
  status: mysqlEnum("status", [
    "novo",
    "em_triagem",
    "convertido_em_os",
    "cancelado",
  ])
    .default("novo")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerTicketEvidence = mysqlTable("customerTicketEvidence", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  ticketId: int("ticketId").notNull(),
  type: mysqlEnum("type", ["foto", "video"]).notNull(),
  fileName: varchar("fileName", { length: 180 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workOrderEvidence = mysqlTable("workOrderEvidence", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  workOrderId: int("workOrderId").notNull(),
  type: mysqlEnum("type", ["foto", "assinatura", "documento"]).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const installationPlans = mysqlTable("installationPlans", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  boardId: varchar("boardId", { length: 80 }).notNull(),
  mondayItemId: varchar("mondayItemId", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  mondayStatus: varchar("mondayStatus", { length: 80 }),
  status: mysqlEnum("status", [
    "disponivel",
    "aceita",
    "em_execucao",
    "concluida",
    "cancelada",
  ])
    .default("disponivel")
    .notNull(),
  customerName: varchar("customerName", { length: 180 }),
  location: varchar("location", { length: 240 }),
  scheduledAt: timestamp("scheduledAt"),
  acceptedByMemberId: int("acceptedByMemberId"),
  acceptedAt: timestamp("acceptedAt"),
  workOrderId: int("workOrderId"),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const installationPlanVisibility = mysqlTable(
  "installationPlanVisibility",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    planId: int("planId").notNull(),
    teamMemberId: int("teamMemberId").notNull(),
    state: mysqlEnum("state", ["visivel", "aceita", "recusada"])
      .default("visivel")
      .notNull(),
    acceptedAt: timestamp("acceptedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export const technicalRequests = mysqlTable("technicalRequests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  boardId: varchar("boardId", { length: 80 }).notNull(),
  mondayItemId: varchar("mondayItemId", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  status: mysqlEnum("status", [
    "novo",
    "triagem",
    "agendado",
    "em_execucao",
    "concluido",
    "cancelado",
  ])
    .default("novo")
    .notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "critica"])
    .default("media")
    .notNull(),
  customerName: varchar("customerName", { length: 180 }),
  location: varchar("location", { length: 240 }),
  equipment: varchar("equipment", { length: 180 }),
  assignedMemberId: int("assignedMemberId"),
  assignedThirdPartyId: int("assignedThirdPartyId"),
  workOrderId: int("workOrderId"),
  notes: text("notes"),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;
export type ServiceFormTemplate = typeof serviceFormTemplates.$inferSelect;
export type CustomerTicket = typeof customerTickets.$inferSelect;
export type WorkOrderEvidence = typeof workOrderEvidence.$inferSelect;
