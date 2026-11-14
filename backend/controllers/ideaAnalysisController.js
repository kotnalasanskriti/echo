
const mongoose = require("mongoose");
const Idea = require("../models/Idea");
const IdeaAnalysis = require("../models/IdeaAnalysis");
const analyzeIdea = require("../services/ideaAnalyzer");

// GENERATE AI ANALYSIS
const generateIdeaAnalysis = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({
                message: "Only innovators can analyze ideas."
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid idea ID."
            });
        }

        const idea = await Idea.findOne({
            _id: id,
            creator: req.user.id
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found."
            });
        }

        if (!idea.title || !idea.title.trim()) {
            return res.status(400).json({
                message: "An idea title is required."
            });
        }

        // Check Gemini configuration
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message: "Gemini AI service is not configured."
            });
        }

        // Generate analysis using Gemini
        const analysis = await analyzeIdea(idea);

        // Save analysis in MongoDB
        const savedAnalysis = await IdeaAnalysis.create({
            idea: idea._id,
            creator: req.user.id,
            analysis,
            model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
        });

        return res.status(201).json({
            message: "Idea analyzed successfully!",
            result: savedAnalysis
        });

    } catch (error) {
        console.error("Idea analysis error:", error);

        return res.status(500).json({
            message: "Unable to analyze idea right now.",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined
        });
    }
};


// GET LATEST AI ANALYSIS
const getIdeaAnalysis = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({
                message: "Only innovators can access idea analysis."
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid idea ID."
            });
        }

        const idea = await Idea.findOne({
            _id: id,
            creator: req.user.id
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found."
            });
        }

        const analysis = await IdeaAnalysis.findOne({
            idea: id,
            creator: req.user.id
        }).sort({ createdAt: -1 });

        if (!analysis) {
            return res.status(404).json({
                message: "No AI analysis found for this idea."
            });
        }

        return res.status(200).json({
            analysis
        });

    } catch (error) {
        console.error("Get idea analysis error:", error);

        return res.status(500).json({
            message: "Unable to retrieve idea analysis."
        });
    }
};


module.exports = {
    generateIdeaAnalysis,
    getIdeaAnalysis
};
