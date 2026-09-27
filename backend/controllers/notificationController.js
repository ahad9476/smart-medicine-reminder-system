const db = require("../db/connection");

const getNotifications = (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({
            message: "user_id is required"
        });
    }

    const sql = `
        SELECT n.*, nt.type_name
        FROM notifications n
        JOIN notification_types nt ON nt.type_id = n.type_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error("GET NOTIFICATIONS ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch notifications"
            });
        }

        res.status(200).json(results);
    });
};

module.exports = {
    getNotifications
};
