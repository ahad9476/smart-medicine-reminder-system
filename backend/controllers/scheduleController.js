const db = require("../db/connection");

const createSchedule = (req, res) => {
const {
    user_id,
    medicine_id,
    schedule_time,
    frequency,
    weekly_days,
    dosage_amount,
    instructions
} = req.body;

    if (!user_id || !medicine_id || !schedule_time) {
        return res.status(400).json({
            message: "user_id, medicine_id and schedule_time are required"
        });
    }

const sql = `
    INSERT INTO schedules
        (
            user_id,
            medicine_id,
            schedule_time,
            frequency,
            weekly_days,
            dosage_amount,
            instructions
        )
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;

    db.query(
        sql,
       [
    user_id,
    medicine_id,
    schedule_time,
    frequency || null,
    weekly_days && weekly_days.length
        ? JSON.stringify(weekly_days)
        : null,
    dosage_amount || null,
    instructions || null
],
        (err, result) => {
            if (err) {
                console.error("CREATE SCHEDULE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to create schedule"
                });
            }

            res.status(201).json({
                message: "Schedule created successfully",
                schedule_id: result.insertId
            });
        }
    );
};

const getSchedules = (req, res) => {
    const { user_id } = req.query;

    let sql = "SELECT * FROM schedules";
    const params = [];

    if (user_id) {
        sql += " WHERE user_id = ?";
        params.push(user_id);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("GET SCHEDULES ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch schedules"
            });
        }

        res.status(200).json(results);
    });
};

// Powers the dashboard's "Today's Schedule" panel: every schedule for this
// user, joined with today's compliance row (if one exists yet) so the
// frontend knows whether to show pending / taken / missed / skipped.
const getTodaySchedules = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required"
        });
    }

    const sql = `
        SELECT
            s.schedule_id,
            s.medicine_id,
            m.name AS medicine_name,
            s.schedule_time AS time,
            s.dosage_amount,
            s.instructions,
            COALESCE(mc.status, 'pending') AS status
        FROM schedules s
        JOIN medicines m ON m.medicine_id = s.medicine_id
        LEFT JOIN medication_compliance mc
            ON mc.schedule_id = s.schedule_id
            AND mc.scheduled_date = CURDATE()
        WHERE s.user_id = ?
        ORDER BY s.schedule_time ASC
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error("GET TODAY SCHEDULES ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch today's schedule"
            });
        }

        res.status(200).json(results);
    });
};

const updateSchedule = (req, res) => {
    const scheduleId = req.params.id;
    const {
    schedule_time,
    frequency,
    weekly_days,
    dosage_amount,
    instructions,
    user_id
} = req.body;

    if (!schedule_time || !user_id) {
        return res.status(400).json({
            message: "schedule_time and user_id are required"
        });
    }

    // Scoped to user_id too, so one account can't edit another's schedule
    // just by guessing a schedule_id.
const sql = `
    UPDATE schedules
    SET
        schedule_time = ?,
        frequency = ?,
        weekly_days = ?,
        dosage_amount = ?,
        instructions = ?
    WHERE schedule_id = ? AND user_id = ?
`;

    db.query(
        sql,
       [
    schedule_time,
    frequency || null,
    weekly_days && weekly_days.length
        ? JSON.stringify(weekly_days)
        : null,
    dosage_amount || null,
    instructions || null,
    scheduleId,
    user_id
],
        (err, result) => {
            if (err) {
                console.error("UPDATE SCHEDULE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to update schedule"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Schedule not found"
                });
            }

            res.status(200).json({
                message: "Schedule updated successfully"
            });
        }
    );
};

const deleteSchedule = (req, res) => {
    const scheduleId = req.params.id;
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required"
        });
    }

    db.query(
        "DELETE FROM schedules WHERE schedule_id = ? AND user_id = ?",
        [scheduleId, user_id],
        (err, result) => {
            if (err) {
                console.error("DELETE SCHEDULE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to delete schedule"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Schedule not found"
                });
            }

            res.status(200).json({
                message: "Schedule deleted successfully"
            });
        }
    );
};

module.exports = {
    createSchedule,
    getSchedules,
    getTodaySchedules,
    updateSchedule,
    deleteSchedule
};
