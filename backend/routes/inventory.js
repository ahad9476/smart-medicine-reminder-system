const express = require("express");

const router = express.Router();

const { getInventory, setInventory } = require("../controllers/inventoryController");

router.get("/inventory", getInventory);

router.post("/inventory", setInventory);

module.exports = router;
