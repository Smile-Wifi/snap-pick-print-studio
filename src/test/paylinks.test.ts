import { describe, expect, it, vi, afterEach } from "vitest";
import { confirmedPaylink, FIXED_PAY_LINKS, PAYLINK_MERCHANT } from "@/lib/paylinks";
import { readPaylink } from "@/lib/paylinks.server";

const paid = { id: "request123", status: "paid", merchantId: PAYLINK_MERCHANT, amountCentavos: 9900 };
afterEach(() => vi.unstubAllGlobals());
describe("fixed PayLinks payments", () => {
  it("uses the exact P99 link", () => expect(FIXED_PAY_LINKS.basic).toBe("https://paylinks-philippines.vercel.app/m/cmwog39w40000l307jxiecno9?package=99"));
  it("uses the exact P149 link", () => expect(FIXED_PAY_LINKS.premium).toBe("https://paylinks-philippines.vercel.app/m/cmwog39w40000l307jxiecno9?package=149"));
  it("unlocks paid P99 requests", () => expect(confirmedPaylink(paid, "basic", "request123")).toBe(true));
  it("unlocks paid P149 requests", () => expect(confirmedPaylink({ ...paid, amountCentavos: 14900 }, "premium", "request123")).toBe(true));
  it("does not unlock pending requests", () => expect(confirmedPaylink({ ...paid, status: "pending" }, "basic", "request123")).toBe(false));
  it("does not upgrade P99 payments to P149", () => expect(confirmedPaylink(paid, "premium", "request123")).toBe(false));
  it("rejects another merchant", () => expect(confirmedPaylink({ ...paid, merchantId: "another" }, "basic", "request123")).toBe(false));
  it("rejects a different request", () => expect(confirmedPaylink(paid, "basic", "another")).toBe(false));
  it("only calls provider GET with no caching", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(paid)));
    vi.stubGlobal("fetch", fetcher);
    expect((await readPaylink("request123", "basic")).paid).toBe(true);
    expect(fetcher).toHaveBeenCalledWith("https://paylinks-philippines.vercel.app/api/requests/request123", expect.objectContaining({ method: "GET", cache: "no-store" }));
  });
  it("does not unlock failed provider checks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    expect((await readPaylink("request123", "basic")).paid).toBe(false);
  });
});