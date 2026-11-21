import { getVerifiedPaylinkPackage, PAYLINK_BASE } from "@/lib/paylinks";

export async function readPaylink(requestId: string) {
  const fallback = {
    paid: false,
    packageId: null,
    amountCentavos: null,
    customerName: "PayLinks customer",
  } as const;

  // Reject invalid request IDs before making an API request.
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(requestId)) {
    return fallback;
  }

  try {
    const response = await fetch(`${PAYLINK_BASE}/api/requests/${encodeURIComponent(requestId)}`, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fallback;
    }

    const payload: unknown = await response.json();

    // The server determines the package from the verified payment amount.
    const packageId = getVerifiedPaylinkPackage(payload, requestId);

    // Read customer name from either the outer response or nested request.
    let customerName = "";

    if (payload && typeof payload === "object") {
      const outer = payload as Record<string, unknown>;

      const request =
        outer["request"] && typeof outer["request"] === "object"
          ? (outer["request"] as Record<string, unknown>)
          : outer;

      const name =
        request["customerName"] ?? request["customer_name"] ?? outer["customerName"] ?? outer["customer_name"];

      if (typeof name === "string") {
        customerName = name.trim().slice(0, 60);
      }
    }

    if (!packageId) {
      return {
        ...fallback,
        customerName: customerName.length >= 2 ? customerName : "PayLinks customer",
      };
    }

    return {
      paid: true,
      packageId,
      amountCentavos: packageId === "premium" ? 14900 : 9900,
      customerName: customerName.length >= 2 ? customerName : "PayLinks customer",
    };
  } catch {
    // Network errors, timeouts, and invalid JSON never unlock payment.
    return fallback;
  }
}
