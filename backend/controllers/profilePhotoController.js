
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { ObjectId } = require("mongodb");

const InnovatorProfile = require("../models/InnovatorProfile");
const { getGridFSBucket } = require("../config/gridfs");

// UPLOAD PROFILE PHOTO
const uploadProfilePhoto = async (req, res) => {
    let uploadedFileId;

    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({ message: "Access denied." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Please select an image." });
        }

        const bucket = getGridFSBucket();

        const profile = await InnovatorProfile.findOne({
            user: req.user.id
        });

        const oldFileId = profile?.profilePhoto;

        const uploadStream = bucket.openUploadStream(
            req.file.originalname,
            {
                contentType: req.file.mimetype,
                metadata: {
                    userId: req.user.id
                }
            }
        );

        uploadedFileId = uploadStream.id;

        await pipeline(
            Readable.from(req.file.buffer),
            uploadStream
        );

        const updatedProfile = await InnovatorProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $set: {
                    profilePhoto: uploadedFileId.toString()
                },
                $setOnInsert: {
                    user: req.user.id
                }
            },
            {
                upsert: true,
                returnDocument: "after",
                setDefaultsOnInsert: true
            }
        );

        // Delete the previous photo after saving the new one.
        if (oldFileId && ObjectId.isValid(oldFileId)) {
            await bucket.delete(new ObjectId(oldFileId)).catch(() => {});
        }

        res.status(200).json({
            message: "Profile photo uploaded successfully!",
            profilePhoto: updatedProfile.profilePhoto
        });

    } catch (error) {
        console.error("Photo upload error:", error);

        if (uploadedFileId) {
            await getGridFSBucket()
                .delete(uploadedFileId)
                .catch(() => {});
        }

        res.status(500).json({
            message: "Profile photo upload failed."
        });
    }
};

// GET PROFILE PHOTO
const getProfilePhoto = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({ message: "Access denied." });
        }

        const profile = await InnovatorProfile.findOne({
            user: req.user.id
        });

        if (
            !profile?.profilePhoto ||
            !ObjectId.isValid(profile.profilePhoto)
        ) {
            return res.status(404).json({
                message: "Profile photo not found."
            });
        }

        const bucket = getGridFSBucket();
        const fileId = new ObjectId(profile.profilePhoto);

        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files.length) {
            return res.status(404).json({
                message: "Profile photo not found."
            });
        }

        res.set("Content-Type", files[0].contentType || "image/jpeg");
        res.set("Cache-Control", "private, max-age=3600");

        bucket.openDownloadStream(fileId).pipe(res);

    } catch (error) {
        console.error("Photo retrieval error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                message: "Could not retrieve profile photo."
            });
        }
    }
};

// DELETE PROFILE PHOTO
const deleteProfilePhoto = async (req, res) => {
    try {
        if (req.user.role !== "innovator") {
            return res.status(403).json({ message: "Access denied." });
        }

        const profile = await InnovatorProfile.findOne({
            user: req.user.id
        });

        if (profile?.profilePhoto) {
            if (ObjectId.isValid(profile.profilePhoto)) {
                await getGridFSBucket().delete(
                    new ObjectId(profile.profilePhoto)
                );
            }

            profile.profilePhoto = "";
            await profile.save();
        }

        res.status(200).json({
            message: "Profile photo removed."
        });

    } catch (error) {
        console.error("Photo deletion error:", error);

        res.status(500).json({
            message: "Could not remove profile photo."
        });
    }
};

module.exports = {
    uploadProfilePhoto,
    getProfilePhoto,
    deleteProfilePhoto
};