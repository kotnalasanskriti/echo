const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    saveInterest,
    removeInterest,
    getMyInterests
} = require("../controllers/interestController");

router.get("/", protect, getMyInterests);
router.post("/:ideaId", protect, saveInterest);
router.delete("/:ideaId", protect, removeInterest);

module.exports = router;