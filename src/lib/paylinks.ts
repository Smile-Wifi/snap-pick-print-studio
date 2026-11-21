export const PAYLINK_MERCHANT = "cmwog39w40000l307jxiecno9";

export const PAYLINK_BASE = "https://paylinks-philippines.vercel.app";

export const FIXED_PAY_LINKS = {
  basic: `${PAYLINK_BASE}/m/${PAYLINK_MERCHANT}?package=99`,
  premium: `${PAYLINK_BASE}/m/${PAYLINK_MERCHANT}?package=149`,
} as const;

export type PaylinkPackage = keyof typeof FIXED_PAY_LINKS;

/**
 * Determines the package exclusively from a verified PayLinks response.
 *
 * Returns null unless:
 * - The request ID matches.
 * - The merchant ID matches.
 * - The payment status is paid.
 * - The payment amount matches a supported package.
 */
export function getVerifiedPaylinkPackage(payload: unknown, requestId: string): PaylinkPackage | null {
  if (!payload || typeof payload !== "object") return null;

  const outer = payload as Record<string, unknown>;

  const row =
    outer["request"] && typeof outer["request"] === "object" ? (outer["request"] as Record<string, unknown>) : outer;

  const merchant =
    row["merchant"] && typeof row["merchant"] === "object" ? (row["merchant"] as Record<string, unknown>) : {};

  const returnedMerchantId = row["merchantId"] ?? merchant["id"];

  if (row["id"] !== requestId) return null;
  if (returnedMerchantId !== PAYLINK_MERCHANT) return null;
  if (row["status"] !== "paid") return null;

  if (row["amountCentavos"] === 9900) return "basic";
  if (row["amountCentavos"] === 14900) return "premium";

  return null;
}

/**
 * Compatibility helper for existing code.
 * New server authorization should use getVerifiedPaylinkPackage().
 */
export function confirmedPaylink(payload: unknown, packageId: PaylinkPackage, requestId: string): boolean {
  return getVerifiedPaylinkPackage(payload, requestId) === packageId;
}

export async function checkPaylinkPayment(requestId: string, packageId: PaylinkPackage): Promise<boolean> {
  try {
    const res = await fetch(`${PAYLINK_BASE}/api/requests/${encodeURIComponent(requestId)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return false;

    const data: unknown = await res.json();

    return confirmedPaylink(data, packageId, requestId);
  } catch {
    return false;
  }
}
