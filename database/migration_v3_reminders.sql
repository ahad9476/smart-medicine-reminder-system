-- ============================================================================
-- Migration v3: prep reminder_log for the automated reminder job.
-- Run this once against your existing database (after migration_v2).
-- ============================================================================

-- One reminder logged per schedule per day - lets the background job safely
-- INSERT IGNORE on every tick without creating duplicate "sent" rows.
-- `notified` tracks whether the matching "Medicine Reminder" notification
-- has already been sent for this row, so it's never sent twice.
ALTER TABLE `reminder_log`
  MODIFY `status` varchar(30) NOT NULL DEFAULT 'sent',
  ADD COLUMN `notified` tinyint(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `schedule_reminder_date_unique` (`schedule_id`, `reminder_date`);
