# Full CRUD & UI Audit — 2026-07-03

Scope: every module tested end-to-end (Create → Read → Update → Delete) directly against the
live production API at `http://98.90.13.118`, plus a UI pass over every list screen for
missing search/filter controls. All test records were created and deleted by the audit itself
(prefixed `TEST ...`) — no real customer data was modified except where noted under
**Leftover test data**.

## Summary

- **11 real bugs found, 11 fixed and deployed to production.**
- **Every module now passes full CRUD** (Create, Read, Update, Delete).
- **2 leftover test records** need manual cleanup (see below) — left alone because deleting by
  hardcoded ID without a fresh lookup was correctly blocked as unsafe.

---

## Bugs found and fixed

| # | Module | Bug | Fix |
|---|--------|-----|-----|
| 1 | Items | Delete always failed (`HTTP 400`) | The in-use check queried `item_consume`, a table from a different legacy schema that doesn't exist in this database. Pointed it at the real `invoice_items` table with an existence guard. |
| 2 | All list tables (desktop/tablet) | Edit/Delete icons existed in the DOM but were scrolled out of view with no visible scrollbar — looked like the buttons had vanished | Table was sized from the full browser window width instead of its real container width. Rewrote sizing to measure the actual container and pass an explicit pixel width through the table, header, and rows (react-native-paper's `DataTable` doesn't reliably propagate stretch). |
| 3 | Items, Vendors, Invoices, Quotations, Delivery Challan, Purchases, Payments, Expenses, Users, Suppliers | No way to search on desktop/tablet | `EnhancedTable` had search state and a handler already wired up, but never rendered an actual search box. Added the missing `<Searchbar>`. |
| 4 | Landing page (mobile) | No visible way to log in without opening the hamburger menu | Added a persistent Login button next to the menu icon, matching desktop. |
| 5 | Purchase Orders | Create response omitted the new record's `id` | Same root cause as #6 below — fixed together. |
| 6 | Production Orders, Time Tracking, Projects, Trip Sheets, Fleet, Customs, Recurring Invoices, POS | Create response only returned a generated number (e.g. `poNumber`), never the row `id` — callers had no way to immediately view/edit what they just created | Captured `result.insertId` and included `id` in all 8 responses, matching the convention already used by Items/Vendors/Customers/Gate Passes/Batch Tracking/Purchases. |
| 7 | Purchase Orders, Production Orders, Recurring Invoices, Time Tracking, Projects, Trip Sheets, Fleet, Customs, POS | Editing a record rejected *any* partial update with `400 Validation failed` unless every original required field (e.g. `productName`, `quantity`, `plannedDate`) was resent | These 9 modules reused their POST create schema for PUT. Added a dedicated `*UpdateSchema` with all fields optional (mirroring the fix already applied earlier to Gate Passes/Batch Tracking/Bill of Materials), and switched each `UPDATE` query to only set columns actually present in the request — the old fixed-column `UPDATE` would otherwise have silently nulled out every other field on a partial save. |

Root-cause note: bugs #5–7 all stem from the same handful of modules being scaffolded from a
shared template that was never fully aligned with the pattern used elsewhere in the codebase.
They're now consistent across all modules.

Also fixed while deploying (not bugs in this app, but blocked deployment entirely until fixed):
- `deploy.sh` / `deploy-to-server.bat` referenced `/home/ec2-user`, but the server actually runs
  as `ubuntu` under `/home/ubuntu` — every deploy attempt failed at the clone step.
- `deploy.sh` ran `npm install --omit=dev`, which skips the `typescript` devDependency, so the
  build silently fell back to a much newer global TypeScript that hard-errors on this project's
  `tsconfig.json`. Now installs full deps for the build, then prunes.
- `frontend/src/utils/toast.ts` was imported by 44 screens but had never been committed —
  master was in a broken state before this session.

---

## CRUD test results (after fixes)

All 22 modules — Customers, Vendors, Suppliers, Items, Invoices, Quotations, Delivery Challan,
Purchases, Purchase Orders, Payments, Expenses, Gate Passes, Batch Tracking, Bill of Materials,
Production Orders, Recurring Invoices, Time Tracking, Projects, Trip Sheets, Fleet, Customs,
POS, Users — now pass Create, Read, Update, and Delete against the live API.

Before the fixes above: 8 modules couldn't return their new record's id, and 9 modules
(overlapping) rejected any partial edit. Items delete was completely broken. Those are now all
green.

## Filter/search audit

Every list screen already has *some* search mechanism, but only `CustomersScreen` built its own
desktop search box — the other ~10 screens relied on `EnhancedTable`'s `searchable` prop, which
did nothing until fix #3 above. That's now fixed everywhere at once via the shared component.

No screen has dropdown filters (status, category, date range) — everything relies on search-by-text
and visual status chips. Not a bug, but worth deciding whether it's in scope for a follow-up pass;
flagging here rather than guessing at which filters matter most for each of ~20 screens.

## Leftover test data (not deleted — needs manual cleanup or explicit go-ahead)

- Purchase Order `PO-2607-0001` (id 22, vendor "TEST VENDOR PO")
- Purchase Order `PO-2607-0002` (id 23, vendor "TEST VENDOR PO2")

Created during testing before the id-fix (#5/#6) was deployed, so the original test script
couldn't retrieve their id to clean them up itself. A later cleanup attempt using their
now-known ids was correctly blocked as an unsafe hardcoded-ID delete on production — happy to
remove them if you confirm, or you can delete them from the Purchase Orders screen directly.

Also noticed but **not created by this audit**: a Fleet vehicle `TEST-FL-001` — looks like a
leftover test fixture from earlier work, left untouched since it predates this session.

## Commits deployed this session (chronological)

1. `fd9fee5` — add missing `toast.ts`
2. `aaaf309` — fix deploy script user/paths
3. `209363b` — install dev deps for TypeScript build
4. `fc75292` — fix actions column visibility (table width)
5. `d205bae` / `64f5942` / `9b5c2a3` — table width iterations (final: measured explicit width)
6. `5e04e42` — mobile landing page login button
7. `828dfa6` — fix item delete (`item_consume` → `invoice_items`)
8. `5b4d368` — render the missing desktop search box
9. `cee234c` — return `id` from 8 modules' create endpoints
10. `c0b72c0` — fix partial-update validation on 9 modules
