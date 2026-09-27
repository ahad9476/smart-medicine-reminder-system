const express = require("express");

const router = express.Router();

const {
    createSchedule,
    getSchedules,
    getTodaySchedules,
    updateSchedule,
    deleteSchedule
} = require("../controllers/scheduleController");

// /schedules/today must be registered before nothing here conflicts with it,
// but keeping it first is good practice in case a /:id route is added later.
router.get("/schedules/today", getTodaySchedules);

router.post("/schedules", createSchedule);

router.get("/schedules", getSchedules);

router.put("/schedules/:id", updateSchedule);

router.delete("/schedules/:id", deleteSchedule);

module.exports = router;
