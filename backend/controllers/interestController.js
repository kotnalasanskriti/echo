const Interest = require("../models/Interest");
const Idea = require("../models/Idea");

// Save an idea to investor's interests
const saveInterest = async (req, res) => {
    try {
        if (req.user.role !== "investor") {
            return res.status(403).json({
                message: "Only investors can save interests."
            });
        }

        const idea = await Idea.findById(req.params.ideaId);

        if (!idea || idea.visibility !== "Public") {
            return res.status(404).json({
                message: "Public idea not found."
            });
        }

        const existingInterest = await Interest.findOne({
            investor: req.user.id,
            idea: idea._id
        });

        if (existingInterest) {
            return res.status(200).json({
                message: "Idea is already saved."
            });
        }

        const interest = await Interest.create({
            investor: req.user.id,
            idea: idea._id
        });

        res.status(201).json({
            message: "Interest saved successfully.",
            interest
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Remove an idea from investor's interests
const removeInterest = async (req, res) => {
    try {
        if (req.user.role !== "investor") {
            return res.status(403).json({
                message: "Only investors can remove interests."
            });
        }

        const interest = await Interest.findOneAndDelete({
            investor: req.user.id,
            idea: req.params.ideaId
        });

        if (!interest) {
            return res.status(404).json({
                message: "Saved interest not found."
            });
        }

        res.status(200).json({
            message: "Interest removed successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Get all saved interests of the logged-in investor
const getMyInterests = async (req, res) => {
    try {
        if (req.user.role !== "investor") {
            return res.status(403).json({
                message: "Only investors can view saved interests."
            });
        }

        const interests = await Interest.find({
            investor: req.user.id
        })
            .populate({
                path: "idea",
                populate: {
                    path: "creator",
                    select: "name"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: interests.length,
            interests
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    saveInterest,
    removeInterest,
    getMyInterests
};