
const mongoose = require("mongoose");

const ideaAnalysisSchema = new mongoose.Schema(
    {
        idea: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Idea",
            required: true,
            index: true
        },

        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        analysis: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

   model: {
    type: String,
    default: "gemini-3.5-flash-lite"
}
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("IdeaAnalysis", ideaAnalysisSchema);
