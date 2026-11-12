import { describe, expect, it, vi, afterEach } from "vitest";
import { META_STYLE_IDS, META_STYLE_INDEX, metaPhotoPrompt } from "@/lib/meta-photo-styles";
import { generateMetaPhoto } from "@/server/ai.server";
import { canGenerateOrder } from "@/lib/order-policy";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Meta Muse Christmas edits", () => {
  for (const style of META_STYLE_IDS) it(`preserves identity for ${style}`, () => {
    expect(metaPhotoPrompt(style)).toContain("keep the exact same person's face, identity, hairstyle and smile, photorealistic");
  });
  it("maps Snow to the existing order slot", () => { expect(META_STYLE_INDEX.snow).toBe(2); });
  it("requires verification before paid generation", () => { expect(canGenerateOrder("pending_verification", null)).toBe(false); expect(canGenerateOrder("payment_verified", "2026-11-12T04:36:00Z")).toBe(true); });
  it("sends the uploaded image with Muse PNG edit parameters", async () => {
    vi.stubEnv("MODEL_API_KEY", "test-only-key");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: "aGVsbG8=" }] })));
    vi.stubGlobal("fetch", request);
    expect(await generateMetaPhoto("data:image/jpeg;base64,aGVsbG8=", "snow")).toBe("aGVsbG8=");
    const [url, options] = request.mock.calls[0] ?? [];
    expect(url).toBe("https://api.meta.ai/v1/images/edits");
    const body = JSON.parse(options.body);
    expect(body.model).toBe("muse-image-1.0"); expect(body.output_format).toBe("png"); expect(body.n).toBe(1);
    expect(body.images).toEqual([{ image_url: "data:image/jpeg;base64,aGVsbG8=" }]);
  });
  it("does not expose provider response bodies on failure", async () => {
    vi.stubEnv("MODEL_API_KEY", "test-only-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive upstream body", { status: 402 })));
    await expect(generateMetaPhoto("data:image/jpeg;base64,aGVsbG8=", "snow")).rejects.toThrow("Check your Meta account billing");
  });
  it("identifies a missing Meta endpoint or model without exposing its response", async () => {
    vi.stubEnv("MODEL_API_KEY", "test-only-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive upstream body", { status: 404 })));
    await expect(generateMetaPhoto("data:image/png;base64,aGVsbG8=", "snow")).rejects.toThrow("Meta API endpoint / model not found");
  });
});
