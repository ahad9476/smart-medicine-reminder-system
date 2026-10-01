# What changed

This covers everything added across two rounds of work: schedules/compliance/
inventory/notifications tracking (v2), then an audit pass that fixed three
real bugs and completed caregivers, refills, and reminders (v3) — every
feature and every nav link in the sidebar now does something real.

## Database setup

Run these **in order** against your database (skip ones you've already run):

1. `database/migration_v2_schedules_compliance.sql`
2. `database/migration_v3_reminders.sql`

Or for a **fresh install**, just import `database/smart_medicine.sql` (already
includes everything from both migrations) and skip both of the above.

Optional demo content: `database/seed_demo_data.sql` (today's schedules +
starting inventory, with one medicine deliberately low).

### Schema changes, v2
- `dosages` table dropped (nothing in the code used it).
- `schedules` gained `dosage_amount`, `instructions`.
- New `medication_compliance` table (taken/missed/skipped per schedule per day).
- `medicine_inventory` gained `low_stock_notified` + a unique key on `medicine_id`.

### Schema changes, v3
- `reminder_log` gained `notified` and a unique key on `(schedule_id, reminder_date)`,
  and `status` now defaults to `'sent'`.

## Bugs found and fixed (v3 audit)

1. **Registration ignored the role dropdown.** Every new account was hardcoded
   to `"patient"` regardless of what was selected. Fixed in `authController.js`
   to use the submitted role (validated against `patient`/`caregiver`).
2. **Medicines list leaked across accounts.** The Dashboard's medicine count
   and the Medicines page both fetched *every* user's medicines, not just the
   logged-in one. Fixed by scoping both calls with `?user_id=`.
3. **No ownership check on edit/delete.** Any logged-in user could edit or
   delete another user's medicine or schedule just by guessing an ID, since
   those queries never checked who owned the row. Fixed by requiring and
   checking `user_id` on update/delete for both medicines and schedules.

## New features (v3) — closes out the remaining placeholder nav links

- **Caregivers** (`caregiverController.js` + `routes/caregiver.js` +
  `caregivers.html`/`js/caregivers.js`): add a caregiver (reusing an existing
  caregiver record by email if they're already linked to someone else), list
  your assigned caregivers, remove an assignment.
  - `GET /api/caregivers?user_id=1`
  - `POST /api/caregivers` — body `{ user_id, name, email, phone, relationship }`
  - `DELETE /api/caregivers/assignment/:id`
- **Refills** (`refillController.js` + `routes/refill.js`, wired into the
  existing Inventory page as a "Refill" button per row + a history table):
  completes the previously-unused `medicine_refills` table. Recording a
  refill both logs it and adds the quantity back into inventory in one step
  (and resets the low-stock flag if it brings stock back above the threshold).
  - `POST /api/refills` — body `{ medicine_id, quantity_added }`
  - `GET /api/refills?user_id=1`
- **Reminders** (`reminderController.js` + `routes/reminder.js` +
  `jobs/dueReminderJob.js` + `reminders.html`/`js/reminders.js`): completes
  the previously-unused `reminder_log` table and the never-used "Medicine
  Reminder" notification type (`type_id = 1`, seeded since the very first
  schema but never actually used until now). A background job (same pattern
  as the missed-dose job, plain `setInterval`, no new dependency) checks
  every 5 minutes for schedules whose time just arrived, logs it, and sends
  a notification.
  - `GET /api/reminders?user_id=1`

Every sidebar link (Dashboard, Medicines, Schedules, Reminders, Notifications,
Caregivers, Inventory) now goes to a real, working page.

## Full feature list (current state)

| Feature | Backend | Frontend page |
|---|---|---|
| Auth (register/login) | ✅ | ✅ |
| Medicines | ✅ | ✅ |
| Schedules | ✅ | ✅ |
| Compliance (taken/missed/skipped) | ✅ | ✅ (dashboard buttons) |
| Inventory + auto-decrement | ✅ | ✅ |
| Low-stock notifications | ✅ | ✅ (Notifications page) |
| Missed-dose detection + notification | ✅ (background job) | ✅ (Notifications page) |
| Reminders (due-dose notification) | ✅ (background job) | ✅ |
| Refills | ✅ | ✅ (on Inventory page) |
| Caregivers | ✅ | ✅ |

## Known limitation (not fixed, by design)

Login/registration doesn't use real JWTs — `login.js` stores a placeholder
string, and no backend route checks an Authorization header. This was already
the case before any of this work started and is a bigger architectural change
(every controller would need an auth-check middleware) than "complete the
features" calls for. Flagging it so it's a conscious choice, not an oversight,
if you're asked about it.

## Before you test/present

1. Run the two migrations (or fresh-import `smart_medicine.sql`).
2. `cd backend && npm install && npm run dev` — confirm you see both
   "MySQL database connected successfully!" and both background job start
   messages.
3. Register a fresh account (the seeded test user's password isn't a real
   hash — this was already true before this round too).
4. Add a schedule for right now (or a couple minutes from now) to see the
   Reminders job fire live — it checks every 5 minutes, so schedule something
   within the next few minutes to see it without a long wait.
5. Add a caregiver, record a refill, and walk through Mark Taken → low stock
   → Notifications once more to confirm nothing regressed.
