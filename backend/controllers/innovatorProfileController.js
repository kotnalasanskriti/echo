const User = require("../models/User");
const InnovatorProfile = require("../models/InnovatorProfile");

const getInnovatorProfile = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const profile = await InnovatorProfile.findOne({
            user: req.user.id
        });

        res.status(200).json({
            profile,
            isCompleted: profile ? profile.isCompleted : false
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const saveInnovatorProfile = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

   const allowedFields = [
    "name",
    "location",
    "introduction",
    "college",
    "education",
    "degree",
    "graduationYear",
    "experience",
    "skills",
    "interests",
    "startupName",
    "industry",
    "startupStage",
    "ideaDescription",
    "currentStep"
];
        const profileData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                profileData[field] = req.body[field];
            }
        });

        if (req.body.isCompleted !== undefined) {
    profileData.isCompleted = req.body.isCompleted === true;
}

        const profile = await InnovatorProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $set: profileData,
                $setOnInsert: { user: req.user.id }
            },
           {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
}
        );
        // Keep account name synchronized with founder profile

if (profileData.name) {
    await User.findByIdAndUpdate(req.user.id, {
        name: profileData.name
    });
}

        res.status(200).json({
            message: "Profile saved successfully!",
            profile
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getInnovatorProfile,
    saveInnovatorProfile
};