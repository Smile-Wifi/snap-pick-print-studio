# Pasko Photo Magic migration

- [ ] Recreate the uploaded storefront, checkout, customer order/payment/tracking routes, and legal/help pages in the current app.
- [ ] Recreate the role-protected staff dashboard and authentication flows using Lovable Cloud; keep roles in a separate server-checked table.
- [ ] Apply the migrated orders/settings/samples/payments schema and private photo storage; omit the archive's placeholder recipient account details.
- [ ] Preserve photo generation, cleanup, PWA, gallery artwork, and all other source behavior; mark provider credentials and external schedule verification pending when unavailable.
- [ ] Verify preview routes, build logs, tests, and safe order/payment/admin flows.
- [ ] Handoff missing customer/user/file exports and any provider setup required for production; do not cut over the published site before verification.
