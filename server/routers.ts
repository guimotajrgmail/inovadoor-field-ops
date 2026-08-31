import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  convertCustomerTicketToWorkOrder,
  createCustomer,
  createCustomerTicket,
  createEquipment,
  createServiceFormTemplate,
  createThirdParty,
  createWorkOrder,
  getDashboardSummary,
  getIntegrationConnection,
  linkEquipmentToCustomer,
  listCustomers,
  listCustomerTickets,
  listEquipment,
  listServiceFormTemplates,
  listTeamMembers,
  listThirdParties,
  listWorkOrders,
  updateWorkOrderStatus,
  upsertMondayConnection,
} from "./db";

const organizationIdFor = (user: { organizationId?: number | null }) => user.organizationId ?? 1;

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.accessProfile !== "gestao") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito à gestão da operação." });
  }
  return next();
});

const optionalId = z.number().int().positive().optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(organizationIdFor(ctx.user))),
  }),
  workOrders: router({
    list: protectedProcedure.query(({ ctx }) => listWorkOrders(organizationIdFor(ctx.user))),
    create: managerProcedure.input(z.object({
      externalId: z.string().min(3).max(80),
      title: z.string().min(3).max(180),
      serviceType: z.string().min(2).max(120),
      priority: z.enum(["baixa", "media", "alta"]).default("media"),
      customerId: optionalId,
      equipmentId: optionalId,
      assignedMemberId: optionalId,
      assignedThirdPartyId: optionalId,
      scheduledAt: z.date().optional(),
      address: z.string().max(500).optional(),
      notes: z.string().max(4000).optional(),
    })).mutation(({ ctx, input }) => createWorkOrder({ ...input, organizationId: organizationIdFor(ctx.user) })),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["rascunho", "agendada", "em_campo", "aguardando_peca", "em_aprovacao", "concluida", "cancelada"]) })).mutation(({ ctx, input }) => updateWorkOrderStatus(organizationIdFor(ctx.user), input.id, input.status, ctx.user.id)),
  }),
  customers: router({
    list: protectedProcedure.query(({ ctx }) => listCustomers(organizationIdFor(ctx.user))),
    create: managerProcedure.input(z.object({
      name: z.string().min(2).max(180),
      document: z.string().max(30).optional(),
      city: z.string().max(100).optional(),
      state: z.string().length(2).optional(),
      address: z.string().max(1000).optional(),
      contactName: z.string().max(160).optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().max(40).optional(),
    })).mutation(({ ctx, input }) => createCustomer({ ...input, organizationId: organizationIdFor(ctx.user) })),
  }),
  equipment: router({
    list: protectedProcedure.query(({ ctx }) => listEquipment(organizationIdFor(ctx.user))),
    create: managerProcedure.input(z.object({
      code: z.string().min(2).max(80),
      name: z.string().min(2).max(180),
      model: z.string().max(120).optional(),
      serialNumber: z.string().max(120).optional(),
      customerId: optionalId,
      state: z.enum(["operacional", "manutencao", "atencao", "baixado"]).default("operacional"),
      installedAt: z.date().optional(),
      lastMaintenanceAt: z.date().optional(),
      nextMaintenanceAt: z.date().optional(),
      qrCode: z.string().max(160).optional(),
      notes: z.string().max(4000).optional(),
    })).mutation(({ ctx, input }) => createEquipment({ ...input, organizationId: organizationIdFor(ctx.user) })),
    linkCustomer: managerProcedure.input(z.object({ equipmentId: z.number().int().positive(), customerId: z.number().int().positive().nullable() })).mutation(({ ctx, input }) => linkEquipmentToCustomer(organizationIdFor(ctx.user), input.equipmentId, input.customerId)),
  }),
  people: router({
    list: protectedProcedure.query(({ ctx }) => listTeamMembers(organizationIdFor(ctx.user))),
  }),
  thirdParties: router({
    list: protectedProcedure.query(({ ctx }) => listThirdParties(organizationIdFor(ctx.user))),
    create: managerProcedure.input(z.object({
      name: z.string().min(2).max(180),
      document: z.string().max(30).optional(),
      region: z.string().max(100).optional(),
      contactName: z.string().max(160).optional(),
      contactEmail: z.string().email().optional(),
      status: z.enum(["homologado", "em_revisao", "bloqueado"]).default("em_revisao"),
      slaPercent: z.number().int().min(0).max(100).default(90),
    })).mutation(({ ctx, input }) => createThirdParty({ ...input, organizationId: organizationIdFor(ctx.user) })),
  }),
  forms: router({
    list: protectedProcedure.query(({ ctx }) => listServiceFormTemplates(organizationIdFor(ctx.user))),
    create: managerProcedure.input(z.object({
      name: z.string().min(2).max(180),
      category: z.enum(["atendimento", "instalacao"]),
      description: z.string().max(4000).optional(),
      fields: z.array(z.string().min(1).max(180)).min(1).max(50),
    })).mutation(({ ctx, input }) => createServiceFormTemplate({ ...input, fieldsJson: JSON.stringify(input.fields), organizationId: organizationIdFor(ctx.user) })),
  }),
  customerTickets: router({
    list: protectedProcedure.input(z.object({ customerId: optionalId }).optional()).query(({ ctx, input }) => listCustomerTickets(organizationIdFor(ctx.user), input?.customerId)),
    create: protectedProcedure.input(z.object({
      customerId: z.number().int().positive(),
      equipmentId: optionalId,
      externalId: z.string().min(3).max(80),
      title: z.string().min(3).max(180),
      description: z.string().max(4000).optional(),
      priority: z.enum(["baixa", "media", "alta"]).default("media"),
    })).mutation(({ ctx, input }) => createCustomerTicket({ ...input, organizationId: organizationIdFor(ctx.user) })),
    convertToWorkOrder: managerProcedure.input(z.object({
      ticketId: z.number().int().positive(),
      externalId: z.string().min(3).max(80),
      assignedMemberId: optionalId,
      assignedThirdPartyId: optionalId,
      scheduledAt: z.date().optional(),
    })).mutation(({ ctx, input }) => convertCustomerTicketToWorkOrder({ ...input, organizationId: organizationIdFor(ctx.user) })),
  }),
  integrations: router({
    monday: router({
      status: protectedProcedure.query(({ ctx }) => getIntegrationConnection(organizationIdFor(ctx.user), "monday")),
      connect: managerProcedure.input(z.object({ workspaceId: z.string().min(2).max(120), settingsJson: z.string().max(4000).optional() })).mutation(({ ctx, input }) => upsertMondayConnection(organizationIdFor(ctx.user), input.workspaceId, input.settingsJson)),
    }),
  }),
  access: router({
    canManage: protectedProcedure.query(({ ctx }) => ({ canManage: ctx.user.role === "admin" || ctx.user.accessProfile === "gestao", profile: ctx.user.accessProfile })),
  }),
});

export type AppRouter = typeof appRouter;
