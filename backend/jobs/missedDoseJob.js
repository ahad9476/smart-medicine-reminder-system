const db = require("../db/connection");

// How long to wait past the scheduled time before a dose counts as "missed".
const GRACE_PERIOD = "02:00:00";

// How often to check for missed doses.
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// Finds today's schedules that are past their grace period with no
// compliance row yet, and inserts them as 'missed'. INSERT IGNORE + the
// UNIQUE KEY on (schedule_id, scheduled_date) means this is safe to re-run
// on every tick without creating duplicates, even if a "Mark Taken" click
// happens at the same moment.
function insertMissedDoses(callback) {
    const sql = `
        INSERT IGNORE INTO medication_compliance
            (schedule_id, user_id, medicine_id, scheduled_date, scheduled_time, status)
        SELECT
            s.schedule_id, s.user_id, s.medicine_id, CURDATE(), s.schedule_time, 'missed'
        FROM schedules s
        LEFT JOIN medication_compliance mc
            ON mc.schedule_id = s.schedule_id AND mc.scheduled_date = CURDATE()
        WHERE mc.compliance_id IS NULL
          AND ADDTIME(CONCAT(CURDATE(), ' ', s.schedule_time), ?) < NOW()
    `;

    db.query(sql, [GRACE_PERIOD], (err) => {
        if (err) {
            console.error("MISSED DOSE JOB - INSERT ERROR:", err);
            return callback(err);
        }

        callback(null);
    });
}

// Sends a "Missed Dose" notification (type_id 2) for any missed row that
// hasn't been notified yet, then flags it so it's never sent twice.
function notifyMissedDoses() {
    const sql = `
        SELECT mc.compliance_id, mc.user_id, mc.scheduled_time, m.name AS medicine_name
        FROM medication_compliance mc
        JOIN medicines m ON m.medicine_id = mc.medicine_id
        WHERE mc.status = 'missed'
          AND mc.notified = 0
          AND mc.scheduled_date = CURDATE()
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("MISSED DOSE JOB - LOOKUP ERROR:", err);
            return;
        }

        rows.forEach((row) => {
            const message = `You missed your ${row.medicine_name} dose scheduled at ${row.scheduled_time}.`;

            db.query(
                "INSERT INTO notifications (user_id, type_id, message) VALUES (?, 2, ?)",
                [row.user_id, message],
                (err) => {
                    if (err) {
                        console.error("MISSED DOSE JOB - NOTIFICATION ERROR:", err);
                        return;
                    }

                    db.query(
                        "UPDATE medication_compliance SET notified = 1 WHERE compliance_id = ?",
                        [row.compliance_id]
                    );
                }
            );
        });
    });
}

function runMissedDoseCheck() {
    insertMissedDoses((err) => {
        if (err) return;
        notifyMissedDoses();
    });
}

// Starts the job: runs once shortly after boot, then on a fixed interval.
// Uses a plain interval timer rather than a cron package - this environment
// has no dependency to add for it, and a 15-minute setInterval is all this
// needs at this scale.
function startMissedDoseJob() {
    setTimeout(runMissedDoseCheck, 5000);
    setInterval(runMissedDoseCheck, CHECK_INTERVAL_MS);

    console.log("Missed-dose background job started (checking every 15 minutes).");
}

module.exports = {
    startMissedDoseJob,
    runMissedDoseCheck
};
