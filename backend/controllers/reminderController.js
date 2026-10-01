const db = require("../db/connection");

// Reminder history, e.g. GET /api/reminders?user_id=1
const getReminders = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required"
        });
    }

    const sql = `
        SELECT
            rl.reminder_id,
            rl.schedule_id,
            rl.reminder_date,
            rl.status,
            s.schedule_time,
            m.name AS medicine_name
        FROM reminder_log rl
        JOIN schedules s ON s.schedule_id = rl.schedule_id
        JOIN medicines m ON m.medicine_id = s.medicine_id
        WHERE s.user_id = ?
        ORDER BY rl.reminder_date DESC, s.schedule_time DESC
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error("GET REMINDERS ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch reminders"
            });
        }

        res.status(200).json(results);
    });
};

module.exports = {
    getReminders
};
