const db = require("../db/connection");


// Get logged-in user's profile
const getProfile = (req, res) => {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid user_id is required"
        });
    }

    const sql = `
        SELECT
            user_id,
            name,
            email,
            phone,
            role
        FROM Users
        WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("GET PROFILE ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch profile"
            });
        }

        if (!rows.length) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(rows[0]);
    });
};


// Update phone number
// Update user's profile
const updateProfile = (req, res) => {
    const userId = Number(req.body.user_id);

    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim();
    const phone = (req.body.phone || "").trim();

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid user_id is required"
        });
    }

    if (!name) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (phone.length > 20) {
        return res.status(400).json({
            message: "Phone number cannot exceed 20 characters"
        });
    }

    const sql = `
        UPDATE Users
        SET
            name = ?,
            email = ?,
            phone = ?
        WHERE user_id = ?
    `;

    db.query(
        sql,
        [name, email, phone || null, userId],
        (err, result) => {
            if (err) {
                console.error("UPDATE PROFILE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to update profile"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.json({
                message: "Profile updated successfully"
            });
        }
    );
};


module.exports = {
    getProfile,
    updateProfile
};