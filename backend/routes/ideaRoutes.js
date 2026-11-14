
const express = require("express");
const router = express.Router();
const { chatWithAssistant } =
    require("../controllers/assistantController");
const protect = require("../middleware/authMiddleware");

const {
    createIdea,
    getMyIdeas,
    getPublicIdeas,
    getIdeaById,
    updateIdea,
    deleteIdea
} = require("../controllers/ideaController");

const {
    generateIdeaAnalysis,
    getIdeaAnalysis
} = require("../controllers/ideaAnalysisController");

/// Existing idea routes
router.post("/", protect, createIdea);
router.get("/", protect, getMyIdeas);

// Investor: explore public ideas
router.get("/explore", protect, getPublicIdeas);

// AI analysis routes
router.post("/:id/analyze", protect, generateIdeaAnalysis);
router.get("/:id/analysis", protect, getIdeaAnalysis);

// Existing individual idea routes
router.get("/:id", protect, getIdeaById);
router.put("/:id", protect, updateIdea);
router.delete("/:id", protect, deleteIdea);

router.post("/assistant/chat", protect, chatWithAssistant);

module.exports = router;