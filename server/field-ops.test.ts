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
});
