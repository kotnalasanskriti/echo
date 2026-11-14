
const mongoose = require("mongoose");
const Idea = require("../models/Idea");

// CREATE IDEA
const createIdea = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({
                message: "Only innovators can create ideas"
            });
        }

        const {
            title,
            category,
            industry,
            problem,
            solution,
            description,
            targetAudience,
            funding,
            stage,
            tags,
            status,
            visibility
        } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Idea title is required"
            });
        }

        const idea = await Idea.create({
            creator: req.user.id,
            title: title.trim(),
            category: category || "",
            industry: industry || category || "",
            problem: problem || "",
            solution: solution || "",
            description: description || "",
            targetAudience: targetAudience || "",
            funding: funding || "",
            stage: stage || "Idea",
            tags: Array.isArray(tags) ? tags : [],
            status: status || "In Progress",
            visibility: visibility || "Private"
        });

        res.status(201).json({
            message: "Idea created successfully!",
            idea
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL IDEAS BELONGING TO LOGGED-IN USER
const getMyIdeas = async (req, res) => {
    try {
        const ideas = await Idea.find({
            creator: req.user.id
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            count: ideas.length,
            ideas
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET PUBLIC IDEAS FOR INVESTORS
const getPublicIdeas = async (req, res) => {
    try {
        if (req.user.role !== "investor") {
            return res.status(403).json({
                message: "Only investors can explore public ideas"
            });
        }

        const filter = {
            visibility: "Public"
        };

        const search = req.query.search?.trim();

        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(safeSearch, "i");

            filter.$or = [
                { title: regex },
                { category: regex },
                { industry: regex },
                { description: regex },
                { tags: regex }
            ];
        }

        const ideas = await Idea.find(filter)
            .populate("creator", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: ideas.length,
            ideas
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ONE IDEA
const getIdeaById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid idea ID"
            });
        }

        const idea = await Idea.findOne({
            _id: req.params.id,
            creator: req.user.id
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        res.status(200).json({ idea });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE IDEA
const updateIdea = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid idea ID"
            });
        }

        const allowedFields = [
            "title",
            "category",
            "industry",
            "problem",
            "solution",
            "description",
            "targetAudience",
            "funding",
            "stage",
            "tags",
            "status",
            "visibility"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.title !== undefined) {
            if (
                typeof updates.title !== "string" ||
                !updates.title.trim()
            ) {
                return res.status(400).json({
                    message: "Idea title cannot be empty"
                });
            }

            updates.title = updates.title.trim();
        }

        const idea = await Idea.findOneAndUpdate(
            {
                _id: req.params.id,
                creator: req.user.id
            },
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        res.status(200).json({
            message: "Idea updated successfully!",
            idea
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE IDEA
const deleteIdea = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid idea ID"
            });
        }

        const idea = await Idea.findOneAndDelete({
            _id: req.params.id,
            creator: req.user.id
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        res.status(200).json({
            message: "Idea deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createIdea,
    getMyIdeas,
    getPublicIdeas,
    getIdeaById,
    updateIdea,
    deleteIdea
};
