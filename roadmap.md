# Pasko Photo Magic migration

- [x] Automatically assemble the premium five-photo video with Christmas bells; shared-player download verified as 720×1280, 15 seconds, with audio and all five photos in the ZIP. No customer orders exist for a paid-order end-to-end check.

- [x] Include slideshow with music in both public photo tests, without an app-imposed repeat-test quota; real playback and 15-second video export verified.
- [x] Check the reported Meta creation failure from checkout: all five styles succeeded with the sample portrait; the reported 404 was not reproduced live.
- [x] Verify the exact Meta JSON edit request, clarify 404 errors safely, and test Snow before another five-style batch.

- [x] Attach the uploaded flag with a rope, animate wind ripples, and verify Santa sound/mute behavior.

- [x] Recreate the uploaded storefront, checkout, customer order/payment/tracking routes, and legal/help pages in the current app.
- [x] Recreate the role-protected staff dashboard and authentication flows using Lovable Cloud; keep roles in a separate server-checked table.
- [x] Apply the migrated orders/settings/samples/payments schema and private photo storage; omit the archive's placeholder recipient account details.
- [ ] Configure cleanup caller configuration; retain the cleanup endpoint and note external schedule setup if unavailable.
- [ ] Verify preview routes, build logs, tests, and safe order/payment/admin flows.
- [ ] Handoff missing customer/user/file exports and any provider setup required for production; do not cut over the published site before verification.
- [x] Photo creation now uses the built-in AI (Replicate removed).
- [x] Staff "Test photo" and "Test Santa" buttons; restored premium slideshow and download tools from the backup.
- [ ] Premium slideshow music: needs a song file from the owner.
- [x] Manual payment verification system (Maya + GoTyme QR uploaded by owner): pending_verification status, reference number + optional screenshot, waiting screen.
- [x] PIN-only staff login (owner-chosen PIN, stored hashed server-side) gating the /staff dashboard.
- [x] Staff verification dashboard: pending/approved/rejected views, approve/reject buttons, new-payment alerts (15s poll + toast + browser notification).
- [x] Mock Payment test mode (development only) verified end-to-end in the preview.
- [x] Order records tagged with company label "JIS Company".
- [ ] GCash QR: owner sent Maya + GoTyme only; swap in a GCash QR if provided.
- [x] Replace Santa's Eyeberry flag with a "MALIGAYANG PASKO 2026" banner.
- [ ] Replace Mock Payment button with real Maya/GoTyme payment links — waiting on the owner's payment link URLs.
- [ ] Add Meta (Llama) model support on the server using the MODEL_API_KEY secret — owner adds the key in Cloud Secrets.
- [ ] Staff Image Generator page using Meta image model (muse-image-1.0) via server function.

- [x] Connect Meta Muse photo edits, homepage snow demo, and payment-verified parallel five-style gallery with downloads/retries.
- [x] Verify real Meta renders in homepage and checkout tests: Snow and all five styles succeeded.
- [ ] Verify paid gallery end-to-end — requires a payment-verified customer order; public demos do not verify this private flow.
