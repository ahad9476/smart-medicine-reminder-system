-- ============================================================================
-- Migration v2: schedules + medication_compliance + inventory tracking
-- Run this ONCE against your existing `smart_medicine` database.
-- (DDL statements auto-commit in MySQL/MariaDB, so this is not wrapped in a
-- transaction - if a statement fails partway, check what already applied
-- before re-running.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop the old, unused per-medicine `dosages` table.
--    Nothing in the application code (controllers/routes/frontend) references
--    it - dosage/instructions move onto `schedules` instead (step 2), since a
--    dose's amount and instructions can now vary per scheduled time, not just
--    per medicine.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `dosages`;

-- ----------------------------------------------------------------------------
-- 2. Add dosage_amount + instructions directly onto schedules.
-- ----------------------------------------------------------------------------
ALTER TABLE `schedules`
  ADD COLUMN `dosage_amount` varchar(50) DEFAULT NULL AFTER `frequency`,
  ADD COLUMN `instructions` varchar(255) DEFAULT NULL AFTER `dosage_amount`;

-- ----------------------------------------------------------------------------
-- 3. New table: one row per scheduled dose per calendar day, recording what
--    actually happened (taken / missed / skipped).
--
--    UNIQUE KEY (schedule_id, scheduled_date) means:
--      - the "mark as taken/skipped" button can safely upsert this row
--      - the missed-dose background job can safely INSERT IGNORE without
--        creating duplicates if it overlaps with a user action
--
--    `notified` tracks whether a "Missed Dose" notification has already been
--    sent for this row, so the background job never sends it twice.
-- ----------------------------------------------------------------------------
CREATE TABLE `medication_compliance` (
  `compliance_id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `status` enum('taken','missed','skipped') NOT NULL DEFAULT 'missed',
  `taken_at` timestamp NULL DEFAULT NULL,
  `notified` tinyint(1) NOT NULL DEFAULT 0,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`compliance_id`),
  UNIQUE KEY `schedule_date_unique` (`schedule_id`, `scheduled_date`),
  KEY `user_id` (`user_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `medication_compliance_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`schedule_id`),
  CONSTRAINT `medication_compliance_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `medication_compliance_ibfk_3` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 4. Prep medicine_inventory for automatic decrement + low-stock alerts:
--      - UNIQUE key on medicine_id so we can have exactly one inventory row
--        per medicine and safely upsert it.
--      - low_stock_notified flag so the "low stock" notification fires once
--        per low stretch (e.g. at 3 left), not on every single dose taken
--        while stock stays low.
-- ----------------------------------------------------------------------------
ALTER TABLE `medicine_inventory`
  ADD COLUMN `low_stock_notified` tinyint(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `medicine_id_unique` (`medicine_id`);
