const db = require("../db/connection");

// Records a refill: logs it in medicine_refills AND adds the quantity to
// medicine_inventory (creating the inventory row if one doesn't exist yet).
// Also resets low_stock_notified if the refill brings stock back up, so a
// fresh low-stock alert can fire again the next time it runs low.
const addRefill = (req, res) => {
    const { medicine_id, quantity_added } = req.body;

    if (!medicine_id || !quantity_added || quantity_added <= 0) {
        return res.status(400).json({
            message: "medicine_id and a positive quantity_added are required"
        });
    }

    const logSql = `
        INSERT INTO medicine_refills (medicine_id, quantity_added, refill_date)
        VALUES (?, ?, CURDATE())
    `;

    db.query(logSql, [medicine_id, quantity_added], (err) => {
        if (err) {
            console.error("ADD REFILL - LOG ERROR:", err);

            return res.status(500).json({
                message: "Failed to record refill"
            });
        }

        const upsertSql = `
            INSERT INTO medicine_inventory (medicine_id, quantity, low_stock_notified)
            VALUES (?, ?, 0)
            ON DUPLICATE KEY UPDATE
                quantity = quantity + VALUES(quantity),
                low_stock_notified = IF(quantity + VALUES(quantity) > 3, 0, low_stock_notified)
        `;

        db.query(upsertSql, [medicine_id, quantity_added], (err) => {
            if (err) {
                console.error("ADD REFILL - INVENTORY ERROR:", err);

                // The refill was already logged - inventory hiccup shouldn't
                // fail the whole request, but flag it clearly.
                return res.status(200).json({
                    message: "Refill logged, but inventory could not be updated"
                });
            }

            res.status(201).json({
                message: "Refill recorded successfully"
            });
        });
    });
};

// Refill history, e.g. GET /api/refills?user_id=1 or ?medicine_id=3
const getRefills = (req, res) => {
    const { medicine_id, user_id } = req.query;

    let sql = `
        SELECT r.*, m.name AS medicine_name
        FROM medicine_refills r
        JOIN medicines m ON m.medicine_id = r.medicine_id
    `;
    const conditions = [];
    const params = [];

    if (medicine_id) {
        conditions.push("r.medicine_id = ?");
        params.push(medicine_id);
    }

    if (user_id) {
        conditions.push("m.user_id = ?");
        params.push(user_id);
    }

    if (conditions.length) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY r.refill_date DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("GET REFILLS ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch refill history"
            });
        }

        res.status(200).json(results);
    });
};

module.exports = {
    addRefill,
    getRefills
};
