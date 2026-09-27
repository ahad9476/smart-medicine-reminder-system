# What changed (v2)

## Database

Run **one** of these (not both):

- **Existing DB, keep your data:** `database/migration_v2_schedules_compliance.sql`
- **Fresh install:** import `database/smart_medicine.sql` (already updated)

Then, optionally, for a working demo tonight/tomorrow:

- `database/seed_demo_data.sql` — adds 3 schedules for today (user 1) and
  starting inventory, with Ace deliberately set to 3 left so a single
  "Mark Taken" click drops it to 2 and fires the low-stock notification live.

Schema changes:
- `dosages` table dropped (nothing in the code used it).
- `schedules` gained `dosage_amount`, `instructions`.
- New `medication_compliance` table: one row per schedule per day
  (`taken` / `missed` / `skipped`), with a `UNIQUE KEY (schedule_id, scheduled_date)`
  so both the button and the background job can safely upsert/insert-ignore it.
- `medicine_inventory` gained `low_stock_notified` (prevents repeat alerts) and
  a `UNIQUE KEY` on `medicine_id` (one inventory row per medicine, upsertable).

## Backend (all new files, nothing existing was removed)

- `controllers/scheduleController.js` + `routes/schedule.js`
  - `GET /api/schedules/today?user_id=1` — powers the dashboard's "Today's Schedule"
  - `POST /api/schedules`, `GET /api/schedules`, `PUT /api/schedules/:id`, `DELETE /api/schedules/:id`
- `controllers/complianceController.js` + `routes/compliance.js`
  - `POST /api/compliance/mark` — body `{ schedule_id, user_id, medicine_id, status }`,
    `status` is `"taken"` or `"skipped"`. This is what the dashboard buttons call.
    Safe to click more than once (upsert).
  - `POST /api/compliance` — your original manual insert, kept as-is.
  - `GET /api/compliance?user_id=1&from=...&to=...` — history.
- `controllers/inventoryController.js` + `routes/inventory.js`
  - `GET /api/inventory?medicine_id=...`
  - `POST /api/inventory` — manual set/restock, body `{ medicine_id, quantity, expiry_date }`
  - `decrementInventoryAndNotify()` — internal helper, called automatically
    from `markDose` whenever a dose is marked `taken`. Decrements by 1,
    checks the threshold (quantity ≤ 3), inserts a "Low Stock" notification
    (`type_id = 3`) the first time it crosses that line, and won't repeat
    until stock is refilled back above it.
- `controllers/notificationController.js` + `routes/notification.js`
  - `GET /api/notifications?user_id=1`
- `jobs/missedDoseJob.js`
  - Runs every 15 minutes (plus once ~5s after boot). Scans today's
    schedules for anything more than 2 hours past its time with no
    compliance row yet, marks it `missed`, and sends a "Missed Dose"
    notification (`type_id = 2`) — once per dose, tracked via a `notified` flag.
  - Uses a plain `setInterval`, not a cron package — zero new npm dependencies.
- `server.js` — wires up the four new route files and starts the background job on boot.

## Frontend

- `js/dashboard.js` — "Today's Schedule" now shows **Mark Taken** / **Skip**
  buttons on any pending dose. Clicking either calls `/api/compliance/mark`
  and refreshes the list; a low-stock heads-up toast appears if that click
  just triggered one.
- **`schedules.html` + `js/schedules.js` (new page)** — full CRUD screen for
  schedules: medicine dropdown, time, frequency, dosage amount, instructions.
  This is what you use to actually create real schedules instead of relying
  on seed data or the raw API.
- **`inventory.html` + `js/inventory.js` (new page)** — stock levels per
  medicine with a status badge (OK / Low stock / Out of stock) and a
  "Set / Restock" modal to manually update quantity.
- **`notifications.html` + `js/notifications.js` (new page)** — read-only
  feed of "Missed Dose" / "Low Stock" notifications, newest first.
- Sidebar nav on every page now links Schedules/Notifications/Inventory to
  these real pages instead of `#` placeholders.
- `controllers/inventoryController.js` → `getInventory` now joins `medicines`
  for a display name and supports `?user_id=` filtering (needed by the new
  Inventory page).

## Not built yet (next parts, whenever you're ready)

- Caregivers, Reminders (still placeholder nav links, no backend yet).
- Refill flow (`medicine_refills` table exists but has no controller yet;
  "Set / Restock" on the Inventory page overwrites quantity directly rather
  than logging a refill history).

## Before you present

1. Apply the migration (or fresh import) + seed data above.
2. `cd backend && npm install && npm run dev` (or `npm start`).
3. Register a fresh account (the seeded test user's password isn't a real
   hash, so it won't log in) — note the `user_id` you get.
4. Go to **Schedules**, add 2–3 real schedules for today under your account.
5. Go to **Inventory**, set a low starting quantity (e.g. 3) for one of them.
6. Go to **Dashboard**, click "Mark Taken" on that low-stock medicine — watch
   the status change and a low-stock toast appear.
7. Go to **Notifications** to show the resulting alert logged there.
