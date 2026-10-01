const db = require("../db/connection");

// How often to check for schedules that just became due.
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// How wide a window counts as "just became due" - wide enough that a dose
// is never missed between ticks, since the job only runs every 5 minutes.
const DUE_WINDOW = "00:10:00";

// Logs today's due schedules into reminder_log. INSERT IGNORE + the
// UNIQUE KEY on (schedule_id, reminder_date) means this is safe to re-run
// every tick without logging the same reminder twice.
function logDueReminders(callback) {
    const sql = `
        INSERT IGNORE INTO reminder_log (schedule_id, reminder_date, status)
        SELECT s.schedule_id, CURDATE(), 'sent'
        FROM schedules s
        WHERE s.schedule_time <= CURTIME()
          AND s.schedule_time >= SUBTIME(CURTIME(), ?)
    `;

    db.query(sql, [DUE_WINDOW], (err) => {
        if (err) {
            console.error("DUE REMINDER JOB - INSERT ERROR:", err);
            return callback(err);
        }

        callback(null);
    });
}

// Sends a "Medicine Reminder" notification (type_id 1) for any reminder_log
// row from today that hasn't been notified yet, then flags it so it's never
// sent twice.
function notifyDueReminders() {
    const sql = `
        SELECT rl.reminder_id, s.user_id, s.schedule_time, m.name AS medicine_name
        FROM reminder_log rl
        JOIN schedules s ON s.schedule_id = rl.schedule_id
        JOIN medicines m ON m.medicine_id = s.medicine_id
        WHERE rl.reminder_date = CURDATE()
          AND rl.notified = 0
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("DUE REMINDER JOB - LOOKUP ERROR:", err);
            return;
        }

        rows.forEach((row) => {
            const message = `Time to take your ${row.medicine_name} (${row.schedule_time}).`;

            db.query(
                "INSERT INTO notifications (user_id, type_id, message) VALUES (?, 1, ?)",
                [row.user_id, message],
                (err) => {
                    if (err) {
                        console.error("DUE REMINDER JOB - NOTIFICATION ERROR:", err);
                        return;
                    }

                    db.query(
                        "UPDATE reminder_log SET notified = 1 WHERE reminder_id = ?",
                        [row.reminder_id]
                    );
                }
            );
        });
    });
}

function runDueReminderCheck() {
    logDueReminders((err) => {
        if (err) return;
        notifyDueReminders();
    });
}

// Starts the job: runs once shortly after boot, then on a fixed interval.
// Same plain-setInterval approach as missedDoseJob.js - no new dependency.
function startDueReminderJob() {
    setTimeout(runDueReminderCheck, 7000);
    setInterval(runDueReminderCheck, CHECK_INTERVAL_MS);

    console.log("Due-reminder background job started (checking every 5 minutes).");
}

module.exports = {
    startDueReminderJob,
    runDueReminderCheck
};
