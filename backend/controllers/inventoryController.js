const db = require("../db/connection");

// Fires a "Low Stock" notification once quantity drops to this many doses
// left or below (so at 3, at 2, at 1, at 0 - but only once per low stretch,
// see low_stock_notified below).
const LOW_STOCK_THRESHOLD = 3;

const getInventory = (req, res) => {
    const { medicine_id, user_id } = req.query;

    // Joined with medicines so the frontend can show a name, not just an id.
    // Optionally scoped to a user's own medicines via user_id.
    let sql = `
        SELECT mi.*, m.name AS medicine_name
        FROM medicine_inventory mi
        JOIN medicines m ON m.medicine_id = mi.medicine_id
    `;
    const conditions = [];
    const params = [];

    if (medicine_id) {
        conditions.push("mi.medicine_id = ?");
        params.push(medicine_id);
    }

    if (user_id) {
        conditions.push("m.user_id = ?");
        params.push(user_id);
    }

    if (conditions.length) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY m.name ASC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("GET INVENTORY ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch inventory"
            });
        }

        res.status(200).json(results);
    });
};

// Manual set/restock endpoint - upserts the quantity for a medicine.
// Also resets low_stock_notified so a refill can trigger a fresh alert
// the next time stock runs low again.
const setInventory = (req, res) => {
    const { medicine_id, quantity, expiry_date } = req.body;

    if (!medicine_id || quantity === undefined) {
        return res.status(400).json({
            message: "medicine_id and quantity are required"
        });
    }

    const sql = `
        INSERT INTO medicine_inventory
            (medicine_id, quantity, expiry_date, low_stock_notified)
        VALUES (?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE
            quantity = VALUES(quantity),
            expiry_date = VALUES(expiry_date),
            low_stock_notified = IF(VALUES(quantity) > ?, 0, low_stock_notified)
    `;

    db.query(
        sql,
        [medicine_id, quantity, expiry_date || null, LOW_STOCK_THRESHOLD],
        (err) => {
            if (err) {
                console.error("SET INVENTORY ERROR:", err);

                return res.status(500).json({
                    message: "Failed to update inventory"
                });
            }

            res.status(200).json({
                message: "Inventory updated successfully"
            });
        }
    );
};

// Internal helper (not a route): decrements stock by 1 unit for a medicine,
// then checks whether it just crossed into low-stock territory and, if so,
// inserts a "Low Stock" notification (type_id 3) exactly once per low
// stretch - low_stock_notified is only cleared again once stock is refilled
// back above the threshold.
const decrementInventoryAndNotify = (medicine_id, user_id, callback) => {
    const decrementSql = `
        UPDATE medicine_inventory
        SET quantity = quantity - 1
        WHERE medicine_id = ? AND quantity > 0
    `;

    db.query(decrementSql, [medicine_id], (err) => {
        if (err) {
            console.error("DECREMENT INVENTORY ERROR:", err);
            return callback(err);
        }

        db.query(
            "SELECT quantity, low_stock_notified FROM medicine_inventory WHERE medicine_id = ?",
            [medicine_id],
            (err, rows) => {
                if (err) {
                    console.error("READ INVENTORY ERROR:", err);
                    return callback(err);
                }

                if (!rows.length) {
                    // No inventory record for this medicine yet - nothing to check.
                    return callback(null, { quantity: null, notified: false });
                }

                const { quantity, low_stock_notified } = rows[0];

                if (quantity > LOW_STOCK_THRESHOLD) {
                    if (low_stock_notified) {
                        // Stock is healthy again (e.g. after a refill) - reset the flag
                        // so the next low stretch can notify again.
                        db.query(
                            "UPDATE medicine_inventory SET low_stock_notified = 0 WHERE medicine_id = ?",
                            [medicine_id]
                        );
                    }
                    return callback(null, { quantity, notified: false });
                }

                if (low_stock_notified) {
                    // Already alerted for this low stretch - don't spam on every dose.
                    return callback(null, { quantity, notified: false });
                }

                const message =
                    quantity <= 0
                        ? "You are out of stock for this medicine. Please refill soon."
                        : `Only ${quantity} dose${quantity === 1 ? "" : "s"} left. Time to refill soon.`;

                db.query(
                    "INSERT INTO notifications (user_id, type_id, message) VALUES (?, 3, ?)",
                    [user_id, message],
                    (err) => {
                        if (err) {
                            console.error("LOW STOCK NOTIFICATION ERROR:", err);
                            return callback(err);
                        }

                        db.query(
                            "UPDATE medicine_inventory SET low_stock_notified = 1 WHERE medicine_id = ?",
                            [medicine_id]
                        );

                        callback(null, { quantity, notified: true });
                    }
                );
            }
        );
    });
};

module.exports = {
    getInventory,
    setInventory,
    decrementInventoryAndNotify
};
