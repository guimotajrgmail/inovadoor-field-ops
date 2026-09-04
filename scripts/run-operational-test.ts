import { and, eq } from "drizzle-orm";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import {
  addWorkOrderEvidence,
  assignUserScope,
  createCustomFormDefinition,
  createCustomer,
  createCustomerTicket,
  createEquipmentCatalog,
  createServiceFormTemplate,
  createThirdParty,
  createWorkOrder,
  getDb,
  getUserByOpenId,
  installEquipmentFromCatalog,
  listCustomerTickets,
  listEquipment,
  listEquipmentCatalogs,
  listNotifications,
  listThirdParties,
  listWorkOrders,
  syncWorkOrderToMonday,
  updateWorkOrderStatus,
  upsertUser,
} from "../server/db";
import {
  customers,
  equipment,
  equipmentCatalogs,
  thirdParties,
  teamMembers,
  users,
  workOrders,
} from "../drizzle/schema";

type User = NonNullable<TrpcContext["user"]>;
const organizationId = 1;
const now = new Date();
const unique = (prefix: string) => `${prefix}-${Date.now()}`;
const context = (user: User): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
});

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const report: Record<string, unknown> = {
    startedAt: now.toISOString(),
    organizationId,
  };

  const existingCustomer = (
    await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, organizationId),
          eq(customers.name, "Cliente Teste · FrioSul")
        )
      )
      .limit(1)
  )[0];
  const customer =
    existingCustomer ??
    (await createCustomer({
      organizationId,
      name: "Cliente Teste · FrioSul",
      document: "00.000.000/0001-00",
      city: "Araucária",
      state: "PR",
      address: "Rodovia do Teste, 1000",
      contactName: "Marina Teste",
      contactEmail: "marina.teste@example.com",
      contactPhone: "(41) 99999-0000",
    }));
  const existingParty = (
    await db
      .select()
      .from(thirdParties)
      .where(
        and(
          eq(thirdParties.organizationId, organizationId),
          eq(thirdParties.name, "Parceiro Teste · Updoors")
        )
      )
      .limit(1)
  )[0];
  const thirdParty =
    existingParty ??
    (await createThirdParty({
      organizationId,
      name: "Parceiro Teste · Updoors",
      document: "11.111.111/0001-11",
      region: "Sul",
      contactName: "Carlos Teste",
      contactEmail: "carlos.teste@example.com",
      status: "homologado",
      slaPercent: 96,
    }));
  const existingMember = (
    await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.organizationId, organizationId),
          eq(teamMembers.email, "tecnico.teste@example.com")
        )
      )
      .limit(1)
  )[0];
  const member =
    existingMember ??
    (await db
      .insert(teamMembers)
      .values({
        organizationId,
        name: "Técnico Teste · Rafael",
        email: "tecnico.teste@example.com",
        phone: "(41) 98888-0000",
        profile: "campo",
        area: "Instalação e manutenção",
        status: "ativo",
      })
      .then(
        async () =>
          (
            await db
              .select()
              .from(teamMembers)
              .where(eq(teamMembers.email, "tecnico.teste@example.com"))
              .limit(1)
          )[0]
      ));

  const catalogInputs = [
    ["TEST-PORTA-RAPIDA", "Porta rápida · Catálogo teste", "Inova Speed 400"],
    [
      "TEST-PORTA-SECCIONAL",
      "Porta seccional · Catálogo teste",
      "Inova Seccional",
    ],
    ["TEST-ABRIGO-DOCA", "Abrigo de doca · Catálogo teste", "Inova Dock"],
  ] as const;
  const catalogs = [];
  for (const [code, name, model] of catalogInputs) {
    const found = (
      await db
        .select()
        .from(equipmentCatalogs)
        .where(
          and(
            eq(equipmentCatalogs.organizationId, organizationId),
            eq(equipmentCatalogs.code, code)
          )
        )
        .limit(1)
    )[0];
    catalogs.push(
      found ??
        (await createEquipmentCatalog({
          organizationId,
          code,
          name,
          category: "Porta industrial",
          manufacturer: "Inovadoor",
          model,
          description: "Registro genérico criado pelo teste operacional.",
        }))
    );
  }
  const serial = "TEST-SERIE-001";
  const existingInstalled = (
    await db
      .select()
      .from(equipment)
      .where(
        and(
          eq(equipment.organizationId, organizationId),
          eq(equipment.serialNumber, serial)
        )
      )
      .limit(1)
  )[0];
  const installed =
    existingInstalled ??
    (await installEquipmentFromCatalog({
      organizationId,
      catalogId: catalogs[0]!.id,
      customerId: customer!.id,
      serialNumber: serial,
      installationLocation: "Doca de testes 01",
      state: "operacional",
      notes: "Unidade genérica para validação do vínculo cliente/equipamento.",
    }));

  const formNames = [
    [
      "checklist-preventiva-teste",
      "Checklist preventiva · Teste",
      "preventiva",
    ],
    ["checklist-corretiva-teste", "Checklist corretiva · Teste", "corretiva"],
    [
      "checklist-instalacao-teste",
      "Checklist instalação · Teste",
      "instalacao",
    ],
  ] as const;
  const forms = [];
  for (const [name, label, kind] of formNames) {
    const existing = (
      await db
        .select()
        .from((await import("../drizzle/schema")).serviceFormTemplates)
        .where(
          and(
            eq(
              (await import("../drizzle/schema")).serviceFormTemplates
                .organizationId,
              organizationId
            ),
            eq(
              (await import("../drizzle/schema")).serviceFormTemplates.name,
              name
            )
          )
        )
        .limit(1)
    )[0];
    forms.push(
      existing ??
        (await createServiceFormTemplate({
          organizationId,
          name,
          category: kind === "instalacao" ? "instalacao" : "atendimento",
          description: `Ficha genérica para ${label.toLowerCase()}.`,
          fieldsJson: JSON.stringify([
            {
              key: "seguranca",
              label: "Área isolada e segura",
              type: "boolean",
              required: true,
            },
            {
              key: "observacoes",
              label: "Observações técnicas",
              type: "textarea",
              required: false,
            },
            {
              key: "resultado",
              label: "Resultado",
              type: "select",
              required: true,
              options: ["Aprovado", "Com pendência", "Reprovado"],
            },
          ]),
        }))
    );
  }
  const customForm = await createCustomFormDefinition({
    organizationId,
    entityType: "equipment",
    name: `Ficha técnica equipamento · ${unique("teste")}`,
    description: "Ficha customizada genérica do teste operacional.",
    fieldsJson: JSON.stringify([
      {
        key: "tensao",
        label: "Tensão de alimentação",
        type: "text",
        required: true,
      },
      { key: "vao", label: "Vão livre (mm)", type: "number", required: true },
    ]),
  });

  const externalId = "TEST-OS-OPERACIONAL-001";
  const existingOrder = (
    await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.externalId, externalId))
      .limit(1)
  )[0];
  const order =
    existingOrder ??
    (await createWorkOrder({
      organizationId,
      customerId: customer!.id,
      equipmentId: installed!.id,
      assignedMemberId: member!.id,
      assignedThirdPartyId: thirdParty!.id,
      externalId,
      title: "Teste operacional · Instalação de porta rápida",
      serviceType: "Instalação",
      priority: "alta",
      status: "agendada",
      scheduledAt: new Date(Date.now() + 86400000),
      address: "Doca de testes 01 · Araucária/PR",
      checklistJson: JSON.stringify({
        form: "checklist-instalacao-teste",
        campos: { seguranca: true, resultado: "Aprovado" },
      }),
      notes: "OS genérica criada pelo teste completo de perfis.",
    }));
  const ticketId = `TEST-CHAMADO-OPERACIONAL-001`;
  const existingTicket = (await (
    await import("../drizzle/schema")
  ).customerTickets)
    ? (
        await db
          .select()
          .from((await import("../drizzle/schema")).customerTickets)
          .where(
            eq(
              (await import("../drizzle/schema")).customerTickets.externalId,
              ticketId
            )
          )
          .limit(1)
      )[0]
    : undefined;
  const ticket =
    existingTicket ??
    (await createCustomerTicket({
      organizationId,
      customerId: customer!.id,
      equipmentId: installed!.id,
      externalId: ticketId,
      title: "Teste · sensor da porta rápida",
      description:
        "Chamado genérico para validar abertura e acompanhamento pelo cliente.",
      priority: "alta",
    }));

  const profileInputs = [
    ["teste.gestao", "Gestão Teste", "gestao", undefined, undefined],
    [
      "teste.terceiro",
      "Terceiro Teste",
      "terceiros",
      undefined,
      thirdParty!.id,
    ],
    ["teste.cliente", "Cliente Teste", "cliente", customer!.id, undefined],
    ["teste.campo", "Técnico Teste", "campo", undefined, undefined],
    ["teste.pessoas", "Pessoas Teste", "pessoas", undefined, undefined],
  ] as const;
  const profiles: Record<string, User> = {};
  for (const [
    openId,
    name,
    accessProfile,
    customerId,
    thirdPartyId,
  ] of profileInputs) {
    await upsertUser({
      openId,
      name,
      email: `${openId}@example.com`,
      loginMethod: "operational-test",
      role: accessProfile === "gestao" ? "admin" : "user",
      accessProfile,
      organizationId,
    });
    const found = await getUserByOpenId(openId);
    if (!found) throw new Error(`User ${openId} was not created`);
    const scoped = await assignUserScope({
      userId: found.id,
      organizationId,
      accessProfile,
      customerId: customerId ?? undefined,
      thirdPartyId: thirdPartyId ?? undefined,
    });
    profiles[accessProfile] = scoped as User;
  }

  const management = appRouter.createCaller(context(profiles.gestao!));
  const thirdPartyCaller = appRouter.createCaller(context(profiles.terceiros!));
  const customerCaller = appRouter.createCaller(context(profiles.cliente!));
  const fieldCaller = appRouter.createCaller(context(profiles.campo!));
  const peopleCaller = appRouter.createCaller(context(profiles.pessoas!));
  const [
    managementCustomers,
    managementCatalogs,
    managementEquipment,
    managementParties,
    managementForms,
  ] = await Promise.all([
    management.customers.list(),
    management.equipment.standards.list(),
    management.equipment.list(),
    management.thirdParties.list(),
    management.customForms.list(),
  ]);
  const thirdPartyOrders = await thirdPartyCaller.workOrders.list();
  const customerTickets = await customerCaller.customerTickets.list();
  const customerOrders = await customerCaller.workOrders.list();
  const customerEquipment = await customerCaller.equipment.list();
  const peopleMembers = await peopleCaller.people.list();
  let fieldCannotCreate = false;
  try {
    await fieldCaller.customers.create({ name: "Não deve ser criado" });
  } catch (error) {
    fieldCannotCreate = (error as { code?: string }).code === "FORBIDDEN";
  }
  await fieldCaller.workOrders.updateStatus({
    id: order!.id,
    status: "em_campo",
  });
  const pixel =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  let evidence = "not attempted";
  try {
    await addWorkOrderEvidence({
      organizationId,
      workOrderId: order!.id,
      type: "foto",
      fileName: "teste-porta.png",
      mimeType: "image/png",
      dataUrl: `data:image/png;base64,${pixel}`,
      latitude: "-25.4284",
      longitude: "-49.2733",
      notes: "Foto genérica do teste de campo",
    });
    await addWorkOrderEvidence({
      organizationId,
      workOrderId: order!.id,
      type: "assinatura",
      fileName: "assinatura-teste.png",
      mimeType: "image/png",
      dataUrl: `data:image/png;base64,${pixel}`,
      latitude: "-25.4284",
      longitude: "-49.2733",
      notes: "Assinatura genérica do teste",
    });
    evidence = "2 records stored";
  } catch (error) {
    evidence = `failed: ${String(error)}`;
  }
  const completed = await fieldCaller.workOrders.updateStatus({
    id: order!.id,
    status: "concluida",
  });
  const notifications = await listNotifications(
    organizationId,
    profiles.gestao!.id
  );
  report.entities = {
    customerId: customer!.id,
    thirdPartyId: thirdParty!.id,
    catalogIds: catalogs.map(item => item!.id),
    installedEquipmentId: installed!.id,
    formIds: forms.map(item => item!.id),
    customFormId: customForm!.id,
    workOrderId: order!.id,
    ticketId: ticket!.id,
    technicianId: member!.id,
  };
  report.counts = {
    managementCustomers: managementCustomers.length,
    managementCatalogs: managementCatalogs.length,
    managementEquipment: managementEquipment.length,
    managementThirdParties: managementParties.length,
    managementCustomForms: managementForms.length,
    thirdPartyScopedWorkOrders: thirdPartyOrders.length,
    customerScopedTickets: customerTickets.length,
    customerScopedWorkOrders: customerOrders.length,
    customerScopedEquipment: customerEquipment.length,
    peopleMembers: peopleMembers.length,
    notifications: notifications.length,
  };
  report.fieldExecution = {
    status: completed?.status,
    evidence,
    gps: "-25.4284,-49.2733",
    checklist: "stored in checklistJson",
  };
  report.assertions = {
    thirdPartyScopeMatches: thirdPartyOrders.every(
      item => item.assignedThirdPartyId === thirdParty!.id
    ),
    customerScopeMatches: customerTickets.every(
      item => item.customerId === customer!.id
    ),
    customerWorkOrderScopeMatches: customerOrders.every(
      item => item.customerId === customer!.id
    ),
    customerEquipmentScopeMatches: customerEquipment.every(
      item => item.customerId === customer!.id
    ),
    fieldCannotCreateCustomer: fieldCannotCreate,
    equipmentLinked: installed?.customerId === customer!.id,
    statusCompleted: completed?.status === "concluida",
  };
  report.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
