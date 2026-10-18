import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  convertCustomerTicketToWorkOrder,
  createCustomer,
  createCustomerSegment,
  createCustomerTicket,
  createEquipment,
  createEquipmentCatalog,
  createCustomFormDefinition,
  createServiceFormTemplate,
  createThirdParty,
  createEquipmentCategory,
  createEquipmentManufacturer,
  createInstallationEnvironment,
  createTeamMember,
  createWorkOrder,
  addWorkOrderEvidence,
  addCustomerTicketEvidence,
  assignUserScope,
  getDashboardSummary,
  getIntegrationConnection,
  duplicateCustomFormDefinition,
  linkEquipmentToCustomer,
  installEquipmentFromCatalog,
  updateEquipmentDetails,
  listCustomers,
  listCustomerSegments,
  listCustomerContacts,
  listCustomerTickets,
  listCustomerTicketEvidence,
  listCustomFormDefinitions,
  updateCustomFormDefinition,
  listEquipment,
  listEquipmentCatalogs,
  listEquipmentCategories,
  listEquipmentManufacturers,
  listInstallationEnvironments,
  listServiceFormTemplates,
  listTeamMembers,
  updateTeamMember,
  listThirdParties,
  listThirdPartyContacts,
  listWorkOrderEvidence,
  listWorkOrders,
  listMondaySimulatedItems,
  listInstallationPlans,
  upsertInstallationPlan,
  assignInstallationPlanVisibility,
  acceptInstallationPlan,
  listTechnicalRequests,
  upsertTechnicalRequest,
  updateTechnicalRequest,
  convertTechnicalRequestToWorkOrder,
  listNotifications,
  listOrganizationUsers,
  markAllNotificationsRead,
  markNotificationRead,
  simulateMondayInbound,
  syncWorkOrderToMonday,
  updateWorkOrderStatus,
  upsertMondayConnection,
  authenticateLocalUser,
} from "./db";
import { sdk } from "./_core/sdk";

const organizationIdFor = (user: { organizationId?: number | null }) =>
  user.organizationId ?? 1;

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.accessProfile !== "gestao") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito à gestão da operação.",
    });
  }
  return next();
});

const optionalId = z.number().int().positive().optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      const {
        passwordHash: _passwordHash,
        passwordSalt: _passwordSalt,
        ...safeUser
      } = user;
      return safeUser;
    }),
    localLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await authenticateLocalUser(input.email, input.password);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail, senha ou status de acesso inválido.",
          });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "Usuário Inovadoor",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        const {
          passwordHash: _passwordHash,
          passwordSalt: _passwordSalt,
          ...safeUser
        } = user;
        return { success: true, user: safeUser } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  users: router({
    list: managerProcedure.query(({ ctx }) =>
      listOrganizationUsers(organizationIdFor(ctx.user))
    ),
    assignScope: managerProcedure
      .input(
        z
          .object({
            userId: z.number().int().positive(),
            accessProfile: z.enum([
              "gestao",
              "terceiros",
              "pessoas",
              "campo",
              "cliente",
            ]),
            customerId: optionalId,
            thirdPartyId: optionalId,
          })
          .refine(
            input =>
              input.accessProfile !== "cliente" || Boolean(input.customerId),
            { message: "customerId is required for client users" }
          )
          .refine(
            input =>
              input.accessProfile !== "terceiros" ||
              Boolean(input.thirdPartyId),
            { message: "thirdPartyId is required for third-party users" }
          )
      )
      .mutation(({ ctx, input }) =>
        assignUserScope({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) =>
      getDashboardSummary(organizationIdFor(ctx.user))
    ),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) =>
      listNotifications(organizationIdFor(ctx.user), ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        markNotificationRead({
          organizationId: organizationIdFor(ctx.user),
          userId: ctx.user.id,
          id: input.id,
        })
      ),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      markAllNotificationsRead({
        organizationId: organizationIdFor(ctx.user),
        userId: ctx.user.id,
      })
    ),
  }),
  workOrders: router({
    list: protectedProcedure.query(({ ctx }) =>
      listWorkOrders(
        organizationIdFor(ctx.user),
        ctx.user.accessProfile === "terceiros"
          ? (ctx.user.thirdPartyId ?? undefined)
          : undefined,
        ctx.user.accessProfile === "cliente"
          ? (ctx.user.customerId ?? undefined)
          : undefined
      )
    ),
    create: managerProcedure
      .input(
        z.object({
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
        })
      )
      .mutation(({ ctx, input }) =>
        createWorkOrder({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum([
            "rascunho",
            "agendada",
            "em_campo",
            "aguardando_peca",
            "em_aprovacao",
            "concluida",
            "cancelada",
          ]),
        })
      )
      .mutation(({ ctx, input }) =>
        updateWorkOrderStatus(
          organizationIdFor(ctx.user),
          input.id,
          input.status,
          ctx.user.id
        )
      ),
  }),
  customers: router({
    list: protectedProcedure.query(({ ctx }) =>
      listCustomers(organizationIdFor(ctx.user))
    ),
    segments: router({
      list: protectedProcedure.query(({ ctx }) =>
        listCustomerSegments(organizationIdFor(ctx.user))
      ),
      create: managerProcedure
        .input(z.object({ name: z.string().min(2).max(120) }))
        .mutation(({ ctx, input }) =>
          createCustomerSegment({
            organizationId: organizationIdFor(ctx.user),
            name: input.name,
          })
        ),
    }),
    contacts: protectedProcedure
      .input(z.object({ customerId: z.number().int().positive() }))
      .query(({ ctx, input }) =>
        listCustomerContacts(organizationIdFor(ctx.user), input.customerId)
      ),
    create: managerProcedure
      .input(
        z.object({
          name: z.string().min(2).max(180),
          document: z.string().max(30).optional(),
          contractNumber: z.string().max(60).optional(),
          segmentId: optionalId,
          city: z.string().max(100).optional(),
          state: z.string().length(2).optional(),
          address: z.string().max(1000).optional(),
          contactName: z.string().max(160).optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().max(40).optional(),
          contacts: z
            .array(
              z.object({
                name: z.string().min(2).max(160),
                phone: z.string().max(40).optional(),
                email: z.string().email().optional(),
                isPrimary: z.boolean().optional(),
              })
            )
            .max(20)
            .optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createCustomer({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  equipment: router({
    list: protectedProcedure.query(({ ctx }) =>
      listEquipment(
        organizationIdFor(ctx.user),
        ctx.user.accessProfile === "cliente"
          ? (ctx.user.customerId ?? undefined)
          : undefined
      )
    ),
    standards: router({
      list: protectedProcedure.query(({ ctx }) =>
        listEquipmentCatalogs(organizationIdFor(ctx.user))
      ),
      categories: router({
        list: protectedProcedure.query(({ ctx }) =>
          listEquipmentCategories(organizationIdFor(ctx.user))
        ),
        create: managerProcedure
          .input(z.object({ name: z.string().min(2).max(120) }))
          .mutation(({ ctx, input }) =>
            createEquipmentCategory({
              organizationId: organizationIdFor(ctx.user),
              name: input.name,
            })
          ),
      }),
      manufacturers: router({
        list: protectedProcedure.query(({ ctx }) =>
          listEquipmentManufacturers(organizationIdFor(ctx.user))
        ),
        create: managerProcedure
          .input(z.object({ name: z.string().min(2).max(120) }))
          .mutation(({ ctx, input }) =>
            createEquipmentManufacturer({
              organizationId: organizationIdFor(ctx.user),
              name: input.name,
            })
          ),
      }),
      create: managerProcedure
        .input(
          z.object({
            code: z.string().min(2).max(80),
            name: z.string().min(2).max(180),
            category: z.string().max(120).optional(),
            categoryId: optionalId,
            manufacturer: z.string().max(120).optional(),
            manufacturerId: optionalId,
            model: z.string().max(120).optional(),
            description: z.string().max(4000).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          createEquipmentCatalog({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
    }),
    create: managerProcedure
      .input(
        z.object({
          code: z.string().min(2).max(80),
          name: z.string().min(2).max(180),
          model: z.string().max(120).optional(),
          serialNumber: z.string().max(120).optional(),
          customerId: optionalId,
          state: z
            .enum(["operacional", "manutencao", "atencao", "baixado"])
            .default("operacional"),
          installedAt: z.date().optional(),
          lastMaintenanceAt: z.date().optional(),
          nextMaintenanceAt: z.date().optional(),
          qrCode: z.string().max(160).optional(),
          notes: z.string().max(4000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createEquipment({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
    install: managerProcedure
      .input(
        z.object({
          catalogId: z.number().int().positive(),
          customerId: z.number().int().positive(),
          serialNumber: z.string().min(2).max(120),
          installationLocation: z.string().min(2).max(180),
          environmentId: optionalId,
          state: z
            .enum(["operacional", "manutencao", "atencao", "baixado"])
            .default("operacional"),
          notes: z.string().max(4000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        installEquipmentFromCatalog({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
    environments: router({
      list: protectedProcedure.query(({ ctx }) =>
        listInstallationEnvironments(organizationIdFor(ctx.user))
      ),
      create: managerProcedure
        .input(
          z.object({
            name: z.string().min(2).max(160),
            description: z.string().max(1000).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          createInstallationEnvironment({
            organizationId: organizationIdFor(ctx.user),
            ...input,
          })
        ),
    }),
    linkCustomer: managerProcedure
      .input(
        z.object({
          equipmentId: z.number().int().positive(),
          customerId: z.number().int().positive().nullable(),
          installationLocation: z.string().max(180).optional(),
          serialNumber: z.string().max(120).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        linkEquipmentToCustomer(
          organizationIdFor(ctx.user),
          input.equipmentId,
          input.customerId,
          input.installationLocation,
          input.serialNumber
        )
      ),
    updateDetails: managerProcedure
      .input(
        z.object({
          equipmentId: z.number().int().positive(),
          installationLocation: z.string().max(180).optional(),
          environmentId: optionalId,
          state: z
            .enum(["operacional", "manutencao", "atencao", "baixado"])
            .optional(),
          notes: z.string().max(4000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateEquipmentDetails({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  people: router({
    list: protectedProcedure.query(({ ctx }) =>
      listTeamMembers(organizationIdFor(ctx.user))
    ),
    create: managerProcedure
      .input(
        z.object({
          name: z.string().min(2).max(180),
          email: z.string().email(),
          password: z.string().min(8).max(200),
          phone: z.string().max(40).optional(),
          profile: z.enum(["gestao", "coordenacao", "campo", "terceiro"]),
          area: z.string().max(120).optional(),
          status: z.enum(["ativo", "pendente", "inativo"]).default("pendente"),
        })
      )
      .mutation(({ ctx, input }) =>
        createTeamMember({
          organizationId: organizationIdFor(ctx.user),
          ...input,
        })
      ),
    update: managerProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(180).optional(),
          email: z.string().email().optional(),
          phone: z.string().max(40).optional(),
          password: z.string().min(8).max(200).optional(),
          profile: z
            .enum(["gestao", "coordenacao", "campo", "terceiro"])
            .optional(),
          area: z.string().max(120).optional(),
          status: z.enum(["ativo", "pendente", "inativo"]).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateTeamMember({
          organizationId: organizationIdFor(ctx.user),
          ...input,
        })
      ),
  }),
  thirdParties: router({
    list: protectedProcedure.query(({ ctx }) =>
      listThirdParties(organizationIdFor(ctx.user))
    ),
    contacts: protectedProcedure
      .input(z.object({ thirdPartyId: z.number().int().positive() }))
      .query(({ ctx, input }) =>
        listThirdPartyContacts(organizationIdFor(ctx.user), input.thirdPartyId)
      ),
    create: managerProcedure
      .input(
        z.object({
          name: z.string().min(2).max(180),
          document: z.string().max(30).optional(),
          region: z.string().max(100).optional(),
          baseAddress: z.string().max(1000).optional(),
          serviceRadiusKm: z.number().int().min(0).max(5000).default(0),
          teamCount: z.number().int().min(0).max(1000).default(0),
          contactName: z.string().max(160).optional(),
          contactPhone: z.string().max(40).optional(),
          contactEmail: z.string().email().optional(),
          contacts: z
            .array(
              z.object({
                name: z.string().min(2).max(160),
                phone: z.string().max(40).optional(),
                email: z.string().email().optional(),
              })
            )
            .max(20)
            .optional(),
          status: z
            .enum(["homologado", "em_revisao", "bloqueado"])
            .default("em_revisao"),
          slaPercent: z.number().int().min(0).max(100).default(90),
        })
      )
      .mutation(({ ctx, input }) =>
        createThirdParty({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  forms: router({
    list: protectedProcedure.query(({ ctx }) =>
      listServiceFormTemplates(organizationIdFor(ctx.user))
    ),
    create: managerProcedure
      .input(
        z.object({
          name: z.string().min(2).max(180),
          category: z.enum(["atendimento", "instalacao"]),
          description: z.string().max(4000).optional(),
          fields: z.array(z.string().min(1).max(180)).min(1).max(50),
        })
      )
      .mutation(({ ctx, input }) =>
        createServiceFormTemplate({
          ...input,
          fieldsJson: JSON.stringify(input.fields),
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  customForms: router({
    list: protectedProcedure.query(({ ctx }) =>
      listCustomFormDefinitions(organizationIdFor(ctx.user))
    ),
    create: managerProcedure
      .input(
        z.object({
          entityType: z.enum([
            "customer",
            "equipmentStandard",
            "equipmentInstall",
            "thirdParty",
            "person",
            "workOrder",
            "ticket",
          ]),
          name: z.string().min(2).max(180),
          description: z.string().max(4000).optional(),
          fields: z
            .array(
              z.object({
                key: z.string().min(1).max(80),
                label: z.string().min(1).max(180),
                type: z.enum([
                  "text",
                  "textarea",
                  "number",
                  "date",
                  "select",
                  "checkbox",
                ]),
                required: z.boolean().default(false),
                options: z.array(z.string().max(120)).max(30).optional(),
                condition: z
                  .object({
                    fieldKey: z.string().min(1).max(80),
                    equals: z.string().max(180),
                  })
                  .optional(),
              })
            )
            .min(1)
            .max(50),
        })
      )
      .mutation(({ ctx, input }) =>
        createCustomFormDefinition({
          ...input,
          fieldsJson: JSON.stringify(input.fields),
          organizationId: organizationIdFor(ctx.user),
        })
      ),
    update: managerProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(180).optional(),
          description: z.string().max(4000).optional(),
          fields: z
            .array(
              z.object({
                key: z.string().min(1).max(80),
                label: z.string().min(1).max(180),
                type: z.enum([
                  "text",
                  "textarea",
                  "number",
                  "date",
                  "select",
                  "checkbox",
                ]),
                required: z.boolean().default(false),
                options: z.array(z.string().max(120)).max(30).optional(),
                condition: z
                  .object({
                    fieldKey: z.string().min(1).max(80),
                    equals: z.string().max(180),
                  })
                  .optional(),
              })
            )
            .min(1)
            .max(50)
            .optional(),
          active: z.number().int().min(0).max(1).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateCustomFormDefinition({
          ...input,
          fieldsJson: input.fields ? JSON.stringify(input.fields) : undefined,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
    duplicate: managerProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(2).max(180).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        duplicateCustomFormDefinition({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  customerTickets: router({
    list: protectedProcedure
      .input(z.object({ customerId: optionalId }).optional())
      .query(({ ctx, input }) => {
        const scopedCustomerId =
          ctx.user.accessProfile === "cliente"
            ? (ctx.user.customerId ?? -1)
            : input?.customerId;
        return listCustomerTickets(
          organizationIdFor(ctx.user),
          scopedCustomerId
        );
      }),
    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number().int().positive(),
          equipmentId: optionalId,
          externalId: z.string().min(3).max(80),
          title: z.string().min(3).max(180),
          description: z.string().max(4000).optional(),
          priority: z.enum(["baixa", "media", "alta"]).default("media"),
        })
      )
      .mutation(({ ctx, input }) => {
        if (
          ctx.user.accessProfile === "cliente" &&
          ctx.user.customerId !== input.customerId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "O cliente só pode abrir chamados para a própria unidade.",
          });
        }
        return createCustomerTicket({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        });
      }),
    evidence: router({
      list: protectedProcedure
        .input(z.object({ ticketId: z.number().int().positive() }))
        .query(({ ctx, input }) =>
          listCustomerTicketEvidence(
            organizationIdFor(ctx.user),
            input.ticketId
          )
        ),
      add: protectedProcedure
        .input(
          z.object({
            ticketId: z.number().int().positive(),
            type: z.enum(["foto", "video"]),
            fileName: z.string().min(1).max(180),
            mimeType: z.string().min(3).max(120),
            dataUrl: z.string().startsWith("data:").max(30_000_000),
          })
        )
        .mutation(({ ctx, input }) =>
          addCustomerTicketEvidence({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
    }),
    convertToWorkOrder: managerProcedure
      .input(
        z.object({
          ticketId: z.number().int().positive(),
          externalId: z.string().min(3).max(80),
          assignedMemberId: optionalId,
          assignedThirdPartyId: optionalId,
          scheduledAt: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        convertCustomerTicketToWorkOrder({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  evidence: router({
    list: protectedProcedure
      .input(z.object({ workOrderId: z.number().int().positive() }))
      .query(({ ctx, input }) =>
        listWorkOrderEvidence(organizationIdFor(ctx.user), input.workOrderId)
      ),
    add: protectedProcedure
      .input(
        z
          .object({
            workOrderId: optionalId,
            workOrderExternalId: z.string().min(3).max(80).optional(),
            type: z.enum(["foto", "assinatura", "documento"]),
            fileName: z.string().min(1).max(180),
            mimeType: z.string().min(3).max(120),
            dataUrl: z.string().startsWith("data:").max(12_000_000),
            latitude: z.string().max(32).optional(),
            longitude: z.string().max(32).optional(),
            notes: z.string().max(1000).optional(),
          })
          .refine(
            input => Boolean(input.workOrderId || input.workOrderExternalId),
            { message: "workOrderId or workOrderExternalId is required" }
          )
      )
      .mutation(({ ctx, input }) =>
        addWorkOrderEvidence({
          ...input,
          organizationId: organizationIdFor(ctx.user),
        })
      ),
  }),
  integrations: router({
    operations: router({
      installationPlans: protectedProcedure.query(({ ctx }) =>
        listInstallationPlans(
          organizationIdFor(ctx.user),
          ctx.user.accessProfile === "campo" ? ctx.user.email : null
        )
      ),
      importInstallation: managerProcedure
        .input(
          z.object({
            boardId: z.string().min(2).max(120),
            mondayItemId: z.string().min(1).max(80),
            title: z.string().min(2).max(240),
            mondayStatus: z.string().max(80).optional(),
            customerName: z.string().max(180).optional(),
            location: z.string().max(240).optional(),
            scheduledAt: z.date().optional(),
            metadataJson: z.string().max(12000).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          upsertInstallationPlan({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      assignInstallation: managerProcedure
        .input(
          z.object({
            planId: z.number().int().positive(),
            teamMemberId: z.number().int().positive(),
          })
        )
        .mutation(({ ctx, input }) =>
          assignInstallationPlanVisibility({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      acceptInstallation: protectedProcedure
        .input(z.object({ planId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => {
          if (ctx.user.accessProfile !== "campo") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Somente um instalador de campo pode aceitar a obra.",
            });
          }
          if (!ctx.user.email) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "O instalador precisa ter e-mail cadastrado.",
            });
          }
          return acceptInstallationPlan({
            organizationId: organizationIdFor(ctx.user),
            planId: input.planId,
            memberEmail: ctx.user.email,
          });
        }),
      technicalRequests: protectedProcedure.query(({ ctx }) =>
        listTechnicalRequests(
          organizationIdFor(ctx.user),
          ctx.user.accessProfile === "terceiros"
            ? (ctx.user.thirdPartyId ?? undefined)
            : undefined
        )
      ),
      importTechnicalRequest: managerProcedure
        .input(
          z.object({
            boardId: z.string().min(2).max(120),
            mondayItemId: z.string().min(1).max(80),
            title: z.string().min(2).max(240),
            customerName: z.string().max(180).optional(),
            location: z.string().max(240).optional(),
            equipment: z.string().max(180).optional(),
            priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
            notes: z.string().max(4000).optional(),
            metadataJson: z.string().max(12000).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          upsertTechnicalRequest({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      updateTechnicalRequest: managerProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z
              .enum([
                "novo",
                "triagem",
                "agendado",
                "em_execucao",
                "concluido",
                "cancelado",
              ])
              .optional(),
            priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
            assignedMemberId: z.number().int().positive().nullable().optional(),
            assignedThirdPartyId: z
              .number()
              .int()
              .positive()
              .nullable()
              .optional(),
            notes: z.string().max(4000).nullable().optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          updateTechnicalRequest({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      convertTechnicalRequest: managerProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) =>
          convertTechnicalRequestToWorkOrder({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
    }),
    monday: router({
      status: protectedProcedure.query(({ ctx }) =>
        getIntegrationConnection(organizationIdFor(ctx.user), "monday")
      ),
      connect: managerProcedure
        .input(
          z.object({
            workspaceId: z.string().min(2).max(120),
            settingsJson: z.string().max(4000).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          upsertMondayConnection(
            organizationIdFor(ctx.user),
            input.workspaceId,
            input.settingsJson
          )
        ),
      simulatedItems: protectedProcedure
        .input(
          z
            .object({ boardId: z.string().min(2).max(120).optional() })
            .optional()
        )
        .query(({ ctx, input }) =>
          listMondaySimulatedItems(organizationIdFor(ctx.user), input?.boardId)
        ),
      simulateInbound: managerProcedure
        .input(
          z.object({
            boardId: z.string().min(2).max(120),
            mondayItemId: z.string().min(1).max(80),
            itemName: z.string().min(2).max(180),
            status: z.string().min(2).max(80),
            quantity: z.number().int().min(1).max(100),
            customerName: z.string().min(2).max(180),
            city: z.string().min(2).max(120),
            equipmentStandard: z.string().min(2).max(180),
            serialPrefix: z.string().min(2).max(80),
            installationBase: z.string().min(2).max(180),
          })
        )
        .mutation(({ ctx, input }) =>
          simulateMondayInbound({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      simulateOutbound: managerProcedure
        .input(
          z.object({
            mondayItemId: z.string().min(1).max(80),
            workOrderExternalId: z.string().min(2).max(80),
            status: z.string().min(2).max(80),
            evidenceCount: z.number().int().min(0).max(100).default(0),
            videoCount: z.number().int().min(0).max(100).default(0),
          })
        )
        .mutation(({ ctx, input }) =>
          syncWorkOrderToMonday({
            ...input,
            organizationId: organizationIdFor(ctx.user),
          })
        ),
      webhook: publicProcedure
        .input(
          z.object({
            boardId: z.string().min(2).max(120),
            event: z.string().min(2).max(120),
            payload: z.record(z.string(), z.unknown()).optional(),
          })
        )
        .mutation(({ input }) => ({
          accepted: true,
          boardId: input.boardId,
          event: input.event,
          receivedAt: Date.now(),
        })),
    }),
  }),
  access: router({
    canManage: protectedProcedure.query(({ ctx }) => ({
      canManage:
        ctx.user.role === "admin" || ctx.user.accessProfile === "gestao",
      profile: ctx.user.accessProfile,
    })),
  }),
});

export type AppRouter = typeof appRouter;
