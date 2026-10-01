const express = require("express");

const router = express.Router();

const { getReminders } = require("../controllers/reminderController");

router.get("/reminders", getReminders);

module.exports = router;
