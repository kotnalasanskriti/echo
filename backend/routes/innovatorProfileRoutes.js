
const express = require("express");
const multer = require("multer");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getInnovatorProfile,
    saveInnovatorProfile
} = require("../controllers/innovatorProfileController");

const {
    uploadProfilePhoto,
    getProfilePhoto,
    deleteProfilePhoto
} = require("../controllers/profilePhotoController");

// Profile routes
router.get("/profile", protect, getInnovatorProfile);
router.put("/profile", protect, saveInnovatorProfile);

// Image upload configuration
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 1 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG, PNG, and WebP images are allowed.")
            );
        }

        cb(null, true);
    }
});

// Convert Multer errors into readable JSON responses
const handlePhotoUpload = (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        next();
    });
};

// Profile photo routes
router.post(
    "/profile/photo",
    protect,
    handlePhotoUpload,
    uploadProfilePhoto
);

router.get(
    "/profile/photo",
    protect,
    getProfilePhoto
);

router.delete(
    "/profile/photo",
    protect,
    deleteProfilePhoto
);

module.exports = router;