import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const sampleUser: AuthenticatedUser = {
  id: 7,
  openId: "inovadoor-test-user",
  email: "beatriz@inovadoor.com.br",
  name: "Beatriz Inovadoor",
  loginMethod: "manus",
  role: "admin",
  accessProfile: "gestao",
  organizationId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const fieldUser: AuthenticatedUser = {
  ...sampleUser,
  id: 8,
  openId: "inovadoor-field-user",
  role: "user",
  accessProfile: "campo",
};

const customerUser: AuthenticatedUser = {
  ...sampleUser,
  id: 9,
  openId: "inovadoor-customer-user",
  role: "user",
  accessProfile: "cliente",
  customerId: 21,
};

describe("Inovadoor Field Ops", () => {
  it("requires authentication for operational data", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.dashboard.summary()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns a typed dashboard summary for an authenticated manager", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    const summary = await caller.dashboard.summary();
    expect(summary).toEqual(expect.objectContaining({
      workOrdersOpen: expect.any(Number),
      inField: expect.any(Number),
      technicians: expect.any(Number),
      techniciansTotal: expect.any(Number),
      slaPercent: expect.any(Number),
      critical: expect.any(Number),
    }));
  });

  it("lists work orders without exposing another organization", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    const orders = await caller.workOrders.list();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.every(order => order.organizationId === 1)).toBe(true);
  });

  it("lists the new portal ticket and form resources", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    const [tickets, forms] = await Promise.all([
      caller.customerTickets.list(),
      caller.forms.list(),
    ]);
    expect(Array.isArray(tickets)).toBe(true);
    expect(Array.isArray(forms)).toBe(true);
  });

  it("protects customer, equipment, third-party and form creation for managers", async () => {
    const caller = appRouter.createCaller(createContext(fieldUser));
    await expect(caller.customers.create({ name: "Cliente não permitido" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.equipment.create({ code: "EQ-TEST", name: "Equipamento não permitido" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.thirdParties.create({ name: "Terceiro não permitido" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.forms.create({ name: "Formulário não permitido", category: "atendimento", fields: ["Campo"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates a customer ticket before persistence", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.customerTickets.create({
      customerId: 1,
      externalId: "CH-TEST-001",
      title: "x",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("prevents a customer user from opening tickets for another customer", async () => {
    const caller = appRouter.createCaller(createContext(customerUser));
    await expect(caller.customerTickets.create({
      customerId: 22,
      externalId: "CH-ISOLATION-001",
      title: "Falha no sensor",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates evidence payloads before attempting an upload", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.evidence.add({
      workOrderExternalId: "OS-2026-0842",
      type: "foto",
      fileName: "evidencia.jpg",
      mimeType: "image/jpeg",
      dataUrl: "not-a-data-url",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a customer or third-party scope for scoped users", async () => {
    const caller = appRouter.createCaller(createContext(sampleUser));
    await expect(caller.users.assignScope({ userId: 12, accessProfile: "cliente" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.users.assignScope({ userId: 12, accessProfile: "terceiros" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
