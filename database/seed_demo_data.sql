-- ============================================================================
-- OPTIONAL demo seed data - run this AFTER migration_v2_schedules_compliance.sql
-- (or after a fresh import of the updated smart_medicine.sql).
--
-- This gives you something to actually click through in the demo:
--   - a few schedules for today, for the existing test medicines
--   - starting inventory counts, including one medicine already low
--     (quantity 3) so you can show the low-stock notification firing
--     live by clicking "Mark Taken" once.
--
-- Assumes the existing seed data: user_id 1, medicine_id 1-4
-- (Napa, Seclo, Ace, Napa Extra).
-- ============================================================================

-- Today's schedule for user 1
INSERT INTO `schedules`
  (`user_id`, `medicine_id`, `schedule_time`, `frequency`, `dosage_amount`, `instructions`)
VALUES
  (1, 1, '09:00:00', 'daily', '1 tablet', 'Take after breakfast'),
  (1, 2, '13:00:00', 'daily', '1 tablet', 'Take before lunch'),
  (1, 3, '21:00:00', 'daily', '1 tablet', 'Take after dinner');

-- Starting inventory - Ace (medicine_id 3) is deliberately set to 3
-- so a single "Mark Taken" click during the demo drops it to 2 and
-- fires the low-stock notification live.
INSERT INTO `medicine_inventory`
  (`medicine_id`, `quantity`, `expiry_date`, `low_stock_notified`)
VALUES
  (1, 20, '2027-06-30', 0),
  (2, 15, '2027-04-15', 0),
  (3, 3,  '2027-01-20', 0),
  (4, 10, '2027-08-10', 0);
