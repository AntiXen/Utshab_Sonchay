# Puja Fund — mobile-first PWA starter

A Bengali-first React + TypeScript + Tailwind PWA for community Durga Puja fund management. This initial deliverable is a **working demo UI** with sample Bengali data and local in-memory interactions. It is not yet a production financial system: do not enter real member information or treat demo totals as actual accounts.

## Included
- Responsive phone-first UI, five-item bottom navigation, contextual add menu
- Home dashboard with computed demo totals; income, Pronami quick entry, contribution list, bill requests and approval simulation, members, festival calendar, notifications, language toggle
- PWA manifest and service-worker generation via Vite PWA
- Firebase initialization module with Firestore persistent local cache (opt-in once configured)
- Initial Firestore security rules, indexes, Cloud Functions for first-admin bootstrap, manual contribution submissions, demo payment record creation, sandbox-only callback, admin income decision, and daily reminder jobs
- .env.example and setup guide

## Run locally
Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```
Open the local URL Vite prints. To verify the production bundle:

```bash
npm run build
npm run preview
```

Demo Mode is the default. The UI uses seeded demo data and does not need Firebase to preview.

## Firebase setup
1. Create a Firebase project and register a Web App. Enable Authentication → Phone. Phone authentication can incur SMS charges and requires Firebase's allowed-domain configuration. Add test phone numbers during development to avoid repeated real SMS.
2. Create Firestore Database and Storage. Create a Cloud Storage bucket for bill photos. Set up authorized domains for the deployment domain.
3. Create `.env` from `.env.example`. Set the `VITE_FIREBASE_*` web configuration values. Set `VITE_DEMO_MODE=false` only when you have implemented and verified the Firebase-backed data repositories and auth flow. **The UI in this starter does not yet replace demo state with Firebase reads/writes.**
4. Install Firebase CLI (`npm i -g firebase-tools`), run `firebase login`, `firebase use --add`, then `firebase deploy --only firestore:rules,firestore:indexes,functions,hosting` after reviewing rules and function code.
5. Deploying Cloud Functions and scheduled functions requires the Firebase project to be on the **Blaze (pay-as-you-go) plan**. Budget alerts are strongly recommended. Cloud Storage billing may also apply depending on plan and current Firebase terms.
6. First-admin bootstrap: add the intended first admin's verified E.164 phone number as a document under `allowedPhones/+8801XXXXXXXXX` using a trusted admin SDK script or Firebase Console. Give it fields such as `{ "name": "প্রধান অ্যাডমিন", "enabled": true }`. Then call `bootstrapFirstAdmin` after sign-in. The callable intentionally does not allow a random first visitor to become admin.
7. Add allowed phone documents for members from a trusted admin-only workflow. A production app must implement server-side invite/allowlist checks before allowing profile creation. Never let a client create their own role.
8. Review Firestore rules against your exact schema and add automated emulator tests before handling real funds. Admin SDK Cloud Functions bypass Firestore rules, so every callable must check roles and validate input.

## bKash / Phase 2
- `Manual` means a pending record is created; an admin must verify the sender number and TrxID against the merchant statement before confirming it.
- `Sandbox` currently creates a mock payment record and a mock callback handler. No real bKash request is made and no real money moves. Do not expose the mock callback as a payment success route in production.
- `Live` is deliberately fail-closed. It will not report a successful checkout until the committee's merchant credentials, approved Tokenized Checkout contract, response signatures/fields, callback domain, Execute Payment and Query Payment behavior have been verified and implemented. This avoids pretending that mock responses are real payments.
- Store credentials only as Cloud Functions secrets, never in `VITE_*` variables or client code. Configure with:

```bash
firebase functions:secrets:set BKASH_APP_KEY
firebase functions:secrets:set BKASH_APP_SECRET
firebase functions:secrets:set BKASH_USERNAME
firebase functions:secrets:set BKASH_PASSWORD
firebase functions:secrets:set BKASH_BASE_URL
firebase functions:secrets:set BKASH_CALLBACK_BASE_URL
```

  Use sandbox credentials and the official sandbox base URL supplied by bKash for testing. Live access requires a committee-owned merchant account, Tokenized Checkout enablement and credentials from bKash. Confirm current onboarding, fee, settlement, and callback requirements directly with bKash; these are not granted automatically by Firebase. Set the callback base URL to the deployed HTTPS Cloud Function/domain. Never accept a client-provided `success` flag as proof of payment. A live callback must perform server-side Execute Payment then Query Payment, compare the verified amount to the expected amount, and process repeated callbacks idempotently with a unique provider TrxID.

## Important gaps before production
This is the initial front-end/demo foundation, not the complete requested production platform. Remaining work includes real phone OTP sign-in and allowlisted invite UX, Firebase-backed repository/data subscriptions, server-side role-gated member/vendor/festival management, complete bills and bill-payment approvals/reversals, secure photo uploads, collection closing, audit log integration for every mutation, robust offline write queue/conflict handling, full ICS dates, all countdown/thank-you reminders, public Pronami checkout links/QR, reconciliation against imported merchant statements, notification unread state, emulator security tests, and a fully implemented live bKash API integration. The initial security rules are a baseline to review, not a substitute for tests; in particular, use Cloud Functions for any multi-record financial invariants and do not trust UI-only restrictions.

## Notes
- Money is represented as integer taka in the data model.
- Festival dates must be entered by the admin; no lunar-calendar calculations are performed.
- Closed festival archives should be immutable in application services; financial corrections should use reversing entries with reasons.
- For iPhone PWA installation, use Safari → Share → Add to Home Screen. On Android, use the browser's Install app/Add to Home Screen prompt. HTTPS is required for service workers outside localhost.
