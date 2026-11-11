# Pasko Photo Magic migration

- [x] Recreate the uploaded storefront, checkout, customer order/payment/tracking routes, and legal/help pages in the current app.
- [x] Recreate the role-protected staff dashboard and authentication flows using Lovable Cloud; keep roles in a separate server-checked table.
- [x] Apply the migrated orders/settings/samples/payments schema and private photo storage; omit the archive's placeholder recipient account details.
- [ ] Configure cleanup caller configuration; retain the cleanup endpoint and note external schedule setup if unavailable.
- [ ] Verify preview routes, build logs, tests, and safe order/payment/admin flows.
- [ ] Handoff missing customer/user/file exports and any provider setup required for production; do not cut over the published site before verification.
- [x] Photo creation now uses the built-in AI (Replicate removed).
