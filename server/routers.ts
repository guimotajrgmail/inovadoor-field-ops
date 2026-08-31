import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createWorkOrder,
  getDashboardSummary,
  getIntegrationConnection,
  listCustomers,
  listEquipment,
  listTeamMembers,
  listThirdParties,
  listWorkOrders,
  updateWorkOrderStatus,
  upsertMondayConnection,
} from "./db";

const organizationIdFor = (user: { organizationId?: number | null }) => user.organizationId ?? 1;

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
    create: protectedProcedure.input(z.object({
      externalId: z.string().min(3).max(80),
      title: z.string().min(3).max(180),
      serviceType: z.string().min(2).max(120),
      priority: z.enum(["baixa", "media", "alta"]).default("media"),
      customerId: z.number().int().positive().optional(),
      equipmentId: z.number().int().positive().optional(),
      assignedMemberId: z.number().int().positive().optional(),
      assignedThirdPartyId: z.number().int().positive().optional(),
      scheduledAt: z.date().optional(),
      address: z.string().max(500).optional(),
      notes: z.string().max(4000).optional(),
    })).mutation(({ ctx, input }) => createWorkOrder({ ...input, organizationId: organizationIdFor(ctx.user) })),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["rascunho", "agendada", "em_campo", "aguardando_peca", "em_aprovacao", "concluida", "cancelada"]) })).mutation(({ ctx, input }) => updateWorkOrderStatus(organizationIdFor(ctx.user), input.id, input.status, ctx.user.id)),
  }),
  customers: router({ list: protectedProcedure.query(({ ctx }) => listCustomers(organizationIdFor(ctx.user))) }),
  equipment: router({ list: protectedProcedure.query(({ ctx }) => listEquipment(organizationIdFor(ctx.user))) }),
  people: router({ list: protectedProcedure.query(({ ctx }) => listTeamMembers(organizationIdFor(ctx.user))) }),
  thirdParties: router({ list: protectedProcedure.query(({ ctx }) => listThirdParties(organizationIdFor(ctx.user))) }),
  integrations: router({
    monday: router({
      status: protectedProcedure.query(({ ctx }) => getIntegrationConnection(organizationIdFor(ctx.user), "monday")),
      connect: protectedProcedure.input(z.object({ workspaceId: z.string().min(2).max(120), settingsJson: z.string().max(4000).optional() })).mutation(({ ctx, input }) => upsertMondayConnection(organizationIdFor(ctx.user), input.workspaceId, input.settingsJson)),
    }),
  }),
  access: router({
    canManage: protectedProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return { canManage: ctx.user.role === "admin" || ctx.user.accessProfile === "gestao", profile: ctx.user.accessProfile };
    }),
  }),
});

export type AppRouter = typeof appRouter;
