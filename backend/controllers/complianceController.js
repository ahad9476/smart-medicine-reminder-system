const db = require("../db/connection");
const { decrementInventoryAndNotify } = require("./inventoryController");

// Original manual insert - kept for direct/advanced use (e.g. backdating a
// record). Prefer markDose below for the normal "Mark Taken" / "Skip" buttons,
// since that one also updates inventory and is safe to call more than once
// for the same dose (upsert instead of insert).
const createCompliance = (req, res) => {
    const {
        schedule_id,
        user_id,
        medicine_id,
        scheduled_date,
        scheduled_time,
        status,
        taken_at,
        notes
    } = req.body;

    if (!schedule_id || !user_id || !medicine_id ||
        !scheduled_date || !scheduled_time) {

        return res.status(400).json({
            message: "Required fields are missing"
        });
    }

    const sql = `
        INSERT INTO medication_compliance
        (schedule_id, user_id, medicine_id, scheduled_date,
         scheduled_time, status, taken_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            taken_at = VALUES(taken_at),
            notes = VALUES(notes)
    `;

    db.query(
        sql,
        [
            schedule_id,
            user_id,
            medicine_id,
            scheduled_date,
            scheduled_time,
            status || "missed",
            taken_at || null,
            notes || null
        ],
        (err, result) => {
            if (err) {
                console.error("CREATE COMPLIANCE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to create compliance"
                });
            }

            res.status(201).json({
                message: "Compliance created successfully",
                compliance_id: result.insertId
            });
        }
    );
};

// The endpoint the "Mark Taken" / "Skip" buttons call. Looks up today's
// scheduled time for this schedule_id, upserts the compliance row for today
// (safe to click more than once - it just updates the same row thanks to the
// UNIQUE KEY on schedule_id + scheduled_date), and on "taken" also
// decrements inventory and checks for a low-stock notification.
const markDose = (req, res) => {
    const { schedule_id, user_id, medicine_id, status } = req.body;

    if (!schedule_id || !user_id || !medicine_id || !status) {
        return res.status(400).json({
            message: "schedule_id, user_id, medicine_id and status are required"
        });
    }

    if (!["taken", "skipped"].includes(status)) {
        return res.status(400).json({
            message: "status must be 'taken' or 'skipped'"
        });
    }

    db.query(
        "SELECT schedule_time FROM schedules WHERE schedule_id = ?",
        [schedule_id],
        (err, scheduleRows) => {
            if (err) {
                console.error("MARK DOSE - SCHEDULE LOOKUP ERROR:", err);

                return res.status(500).json({
                    message: "Failed to look up schedule"
                });
            }

            if (!scheduleRows.length) {
                return res.status(404).json({
                    message: "Schedule not found"
                });
            }

            const { schedule_time } = scheduleRows[0];
            const takenAt = status === "taken" ? new Date() : null;

            const sql = `
                INSERT INTO medication_compliance
                    (schedule_id, user_id, medicine_id, scheduled_date,
                     scheduled_time, status, taken_at)
                VALUES (?, ?, ?, CURDATE(), ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    taken_at = VALUES(taken_at)
            `;

            db.query(
                sql,
                [schedule_id, user_id, medicine_id, schedule_time, status, takenAt],
                (err) => {
                    if (err) {
                        console.error("MARK DOSE ERROR:", err);

                        return res.status(500).json({
                            message: "Failed to record dose status"
                        });
                    }

                    if (status !== "taken") {
                        return res.status(200).json({
                            message: "Dose marked as skipped"
                        });
                    }

                    decrementInventoryAndNotify(medicine_id, user_id, (invErr, invResult) => {
                        if (invErr) {
                            // Compliance was already recorded - an inventory hiccup
                            // shouldn't fail the whole request.
                            return res.status(200).json({
                                message: "Dose marked as taken, but inventory could not be updated",
                                inventory: null
                            });
                        }

                        res.status(200).json({
                            message: "Dose marked as taken",
                            inventory: invResult
                        });
                    });
                }
            );
        }
    );
};

// History lookup, e.g. GET /api/compliance?user_id=1&from=2026-09-01&to=2026-09-30
const getCompliance = (req, res) => {
    const { user_id, from, to } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required"
        });
    }

    let sql = `
        SELECT mc.*, m.name AS medicine_name
        FROM medication_compliance mc
        JOIN medicines m ON m.medicine_id = mc.medicine_id
        WHERE mc.user_id = ?
    `;
    const params = [user_id];

    if (from) {
        sql += " AND mc.scheduled_date >= ?";
        params.push(from);
    }

    if (to) {
        sql += " AND mc.scheduled_date <= ?";
        params.push(to);
    }

    sql += " ORDER BY mc.scheduled_date DESC, mc.scheduled_time DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("GET COMPLIANCE ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch compliance history"
            });
        }

        res.status(200).json(results);
    });
};

module.exports = {
    createCompliance,
    markDose,
    getCompliance
};
