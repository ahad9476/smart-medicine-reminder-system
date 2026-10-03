const express = require("express");

const router = express.Router();

const {
    createCompliance,
    markDose,
    checkAndMarkMissedDoses,
    getCompliance
} = require("../controllers/complianceController");

// The button-driven endpoint - "Mark Taken" / "Skip" on the dashboard.
router.post("/compliance/mark", markDose);

// Manual/advanced insert (e.g. backdating a record).
router.post("/compliance", createCompliance);

// Automatically marks doses as missed after the 15-minute grace period.
router.get("/compliance/check-missed", checkAndMarkMissedDoses);

router.get("/compliance", getCompliance);

module.exports = router;
