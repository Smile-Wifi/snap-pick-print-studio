# Read-only scan report: Pasko Photo Magic (21 Nov 2026)

Nothing was changed. The fix list at the end is for you to approve.

## Checks I ran
- Type check (`tsgo -b --noEmit`): **FAILED** with 15 errors in 3 files.
- Tests (`vitest run`): **3 of 53 failed**, 50 passed. 2 of 11 test files failed.
- Read the source of the payment, checkout, order-claim and photo-generation code.
- Build and runtime log files: none were present in /tmp/observability, so I have no current preview build result.

## Checks I could not run
- A production build, because the harness runs builds itself.
- A real PayLinks payment, a real paid-order render, or Meta/AI provider calls. These cost money or credits, or need a real payment.
- A storage policy review and a live RLS row test. I did not run these in this scan.
- Testing on a real phone or in the Messenger browser.

## P0: blocks the app from building or customers from finishing
1. **`src/components/checkout-photo-test.tsx` has been overwritten with an old copy of the PayLinks module.**
   - Evidence: the file starts with `// src/lib/paylinks.ts` and has `/pay/cmwojz…` links. It no longer exports `CheckoutPhotoTest`. That causes TS2305 in `src/test/checkout-photo-test.test.tsx` and TS4111 errors such as `r.status`.
   - Symptom: type check fails and the preview or publish may break. No app page imports this file now, so the damage is in the build and tests.
   - Smallest fix: restore the original component, or delete the file and its test if the test button is meant to stay removed (it was removed earlier).
2. **`src/lib/paylinks.server.ts` (`readPaylink`) fails strict typing.**
   - Evidence: lines 41–43 use dot access on records (`outer.request`, `request.customerName`).
   - Symptom: type check fails.
   - Smallest fix: switch to bracket access (`outer["request"]`).
3. **The PayLinks merchant ID changed, but the tests and project memory still use the old one.**
   - Evidence: `PAYLINK_MERCHANT = "cmwog39w40000l307jxiecno9"`, while `src/test/paylinks.test.ts` expects `cmwoeefv40000kx07p36xolzq`. Both link tests fail.
   - Risk: if the new ID is wrong, every real payment fails the merchant check and shows "Not confirmed yet."
   - Smallest fix: confirm which ID is correct, then update either the test or the constant.
4. **Not confirmed: PayLinks response format.**
   - `confirmedPaylink` needs `status === "paid"`, `id`, `merchantId` (or `merchant.id`) and `amountCentavos` of exactly 9900 or 14900.
   - I have not seen a real PayLinks response, so I can't confirm these field names match.
   - Fix: call one real request ID and compare the fields.

## P1: major reliability or security problems
5. **Paid-order rendering runs inside one server request (`renderPayOrderById`, `src/lib/pay.functions.ts`).**
   - It renders five AI images in one request on the hosting runtime, so it can hit time and CPU limits. The order would then stay stuck at "queued" or "processing."
   - There is no lease or automatic retry; only manual or customer re-render exists. This is the durable-worker design already planned.
6. **AI calls have no timeout.**
   - `src/server/ai.server.ts` (Meta edit around line 51, fallback around line 95) and `meta-model.server.ts` call `fetch` with no `AbortSignal.timeout`.
   - A hung provider can hold the request open until the runtime kills it.
   - Fix: add a 60–90 second timeout for each attempt.
7. **The claim flow sends the whole portrait as base64 (`claimPaylinkOrder`, up to 14 MB).**
   - Large phone photos may fail on mobile data or hit request size limits.
   - Fix: shrink the image in the browser before sending, or upload it first.
8. **A failed claim insert gives a vague error.** The duplicate-payment message is generic, so customers can't tell a network failure from an already-used payment.
9. **The Premium video is still recorded in the browser** (`src/lib/slideshow-video.ts`, MediaRecorder).
   - Videos can come out short or black when the phone screen locks or the app goes to the background.
   - The PayLinks `/status/$code` page has no slideshow, so ₱149 buyers on the new flow get no video.

## P2: later hardening
10. Leftover legacy flows still exist: `orders`, `payments`, `manual-payment.tsx`, `order.$reference.tsx` and `image-generator.tsx`. These are a confusing second path; decide whether to keep or remove them.
11. The staff dashboard pulls up to 5,000 rows to build sales stats, and stats are calculated in the app. Move this to a database query later.
12. Music licensing for the Suno tracks on the paid ₱149 package is still unconfirmed.
13. Amount units are handled correctly: the database stores whole pesos (99 or 149) and the PayLinks check uses centavos (9900 or 14900). Keep it this way.

## Server/client boundaries and secrets
- Secrets are read only on the server: `process.env` is used only in server files, and the admin database client is loaded lazily inside handlers. I found no secret exposed in the browser.

## Proposed fixes, if approved (smallest safe set)
1. Restore or remove `checkout-photo-test.tsx` and its test.
2. Switch `paylinks.server.ts` to bracket access.
3. After you confirm the correct PayLinks merchant ID, align the code, the tests and project memory.
4. Add timeouts to the AI provider calls.
5. Re-run the type check and tests, and report results.
