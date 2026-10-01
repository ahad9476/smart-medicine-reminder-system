
const db = require("../db/connection");

// Get patients assigned to a caregiver account
const getAssignedPatients = (req, res) => {
    const caregiverUserId = Number(req.query.caregiver_user_id);

    if (!Number.isInteger(caregiverUserId) || caregiverUserId <= 0) {
        return res.status(400).json({
            message: "Valid caregiver_user_id is required"
        });
    }

    const sql = `
        SELECT
            u.user_id AS patient_id,
            u.name AS patient_name,
            u.email AS patient_email,
            ca.relationship,
            ca.assignment_id
        FROM caregiver_assignments ca
        JOIN Users u ON u.user_id = ca.user_id
        WHERE ca.caregiver_user_id = ?
          AND u.role = 'patient'
        ORDER BY u.name
    `;

    db.query(sql, [caregiverUserId], (err, rows) => {
        if (err) {
            console.error("ASSIGNED PATIENTS ERROR:", err);
            return res.status(500).json({
                message: "Failed to fetch assigned patients"
            });
        }

        res.json(rows);
    });
};


// Verify that a patient is assigned to this caregiver
const verifyAssignment = (caregiverUserId, patientId, callback) => {
    const sql = `
        SELECT assignment_id
        FROM caregiver_assignments
        WHERE caregiver_user_id = ?
          AND user_id = ?
    `;

    db.query(sql, [caregiverUserId, patientId], (err, rows) => {
        if (err) return callback(err);

        if (!rows.length) {
            return callback(null, false);
        }

        callback(null, true);
    });
};


// Get patient dashboard information
const getPatientOverview = (req, res) => {
    const caregiverId = Number(req.query.caregiver_user_id);
    const patientId = Number(req.params.patientId);

    if (!caregiverId || !patientId) {
        return res.status(400).json({
            message: "Caregiver and patient IDs are required"
        });
    }

    verifyAssignment(caregiverId, patientId, (err, allowed) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to verify assignment"
            });
        }

        if (!allowed) {
            return res.status(403).json({
                message: "You are not assigned to this patient"
            });
        }

        const sql = `
            SELECT
                s.schedule_id,
                s.medicine_id,
                m.name AS medicine_name,
                m.dosage,
                s.schedule_time,
                s.frequency,
                s.dosage_amount,
                s.instructions,
                COALESCE(mc.status, 'pending') AS status,
                mc.taken_at
            FROM schedules s
            JOIN medicines m
                ON m.medicine_id = s.medicine_id
            LEFT JOIN medication_compliance mc
                ON mc.schedule_id = s.schedule_id
                AND mc.scheduled_date = CURDATE()
            WHERE s.user_id = ?
            ORDER BY s.schedule_time
        `;

        db.query(sql, [patientId], (err, schedules) => {
            if (err) {
                console.error("PATIENT SCHEDULE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to fetch patient schedule"
                });
            }

            const inventorySql = `
                SELECT
                    m.name AS medicine_name,
                    mi.quantity,
                    mi.expiry_date
                FROM medicine_inventory mi
                JOIN medicines m
                    ON m.medicine_id = mi.medicine_id
                WHERE m.user_id = ?
                ORDER BY m.name
            `;

            db.query(inventorySql, [patientId], (err, inventory) => {
                if (err) {
                    console.error("PATIENT INVENTORY ERROR:", err);

                    return res.status(500).json({
                        message: "Failed to fetch patient inventory"
                    });
                }

                res.json({
                    schedules,
                    inventory
                });
            });
        });
    });
};

module.exports = {
    getAssignedPatients,
    getPatientOverview
};