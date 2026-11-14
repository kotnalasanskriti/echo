
// =====================================
// ECHO - INNOVATOR SETTINGS
// MongoDB + GridFS Connected Version
// =====================================

const API_URL = "http://localhost:5000/api/innovator";
const PHOTO_URL = `${API_URL}/profile/photo`;

const token = sessionStorage.getItem("echoToken");
const email = sessionStorage.getItem("innovatorEmail");

if (!token || !email) {

    window.location.href = "innovator-login.html";

} else {

    let profile = {};
    let profilePhoto = "";
    let profilePhotoObjectUrl = "";

    const userName =
        sessionStorage.getItem("innovatorName") || "Innovator";


    // =====================================
    // ELEMENTS
    // =====================================

    const profileForm = document.getElementById("profileForm");

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const locationInput = document.getElementById("location");
    const educationInput = document.getElementById("education");
    const introductionInput = document.getElementById("introduction");
    const skillsInput = document.getElementById("skills");

    const photoInput = document.getElementById("photoInput");
    const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
    const removePhotoBtn = document.getElementById("removePhotoBtn");

    const notificationMessage =
        document.getElementById("notificationMessage");

    const notificationKey = "echoNotifications_" + email;

    const defaultNotifications = {
        connectionNotifications: true,
        messageNotifications: true,
        communityNotifications: true,
        platformNotifications: true
    };


    // =====================================
    // API HELPER
    // =====================================

    async function apiRequest(method = "GET", data = null) {

        const options = {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(
            `${API_URL}/profile`,
            options
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Something went wrong."
            );
        }

        return result;
    }


    // =====================================
    // USER HEADER
    // =====================================

    function updateUserHeader(name) {

        const userNameElement = document.getElementById("userName");
        const userAvatar = document.getElementById("userAvatar");

        if (userNameElement) {
            userNameElement.textContent = name;
        }

        if (userAvatar) {
            userAvatar.textContent =
                name.charAt(0).toUpperCase();
        }
    }


    // =====================================
    // PROFILE PREVIEW
    // =====================================

    function updateProfilePreview() {

        const name =
            fullNameInput.value.trim() || "Your Name";

        const location =
            locationInput.value.trim() || "Your location";

        const introduction =
            introductionInput.value.trim() ||
            "Your introduction will appear here.";

        const skills = skillsInput.value
            .split(",")
            .map(skill => skill.trim())
            .filter(Boolean);

        document.getElementById("previewName").textContent = name;

        document.getElementById("previewLocation").textContent =
            location;

        document.getElementById("previewAbout").textContent =
            introduction;

        const previewSkills =
            document.getElementById("previewSkills");

        previewSkills.innerHTML = "";

        if (skills.length === 0) {

            previewSkills.textContent = "No skills added yet.";

        } else {

            skills.forEach(skill => {

                const span = document.createElement("span");

                span.textContent = skill;

                previewSkills.appendChild(span);

            });
        }

        updateUserHeader(name);
    }


    // =====================================
    // PROFILE PHOTO PREVIEW
    // =====================================

    function setPhoto(element, photo, fallback) {

        if (!element) return;

        if (element.tagName === "IMG") {

            if (photo) {

                element.src = photo;
                element.style.display = "block";

            } else {

                element.removeAttribute("src");
                element.style.display = "none";
            }

        } else {

            element.style.backgroundImage = photo
                ? `url("${photo}")`
                : "none";

            if (!photo) {

                element.textContent = fallback;

            } else {

                element.textContent = "";
            }
        }
    }


    function updatePhotoPreview() {

        const initial = (
            fullNameInput.value.trim() || "Y"
        ).charAt(0).toUpperCase();

        setPhoto(
            document.getElementById("photoPreview"),
            profilePhoto,
            initial
        );

        setPhoto(
            document.getElementById("previewAvatar"),
            profilePhoto,
            initial
        );
    }


    // =====================================
    // LOAD SAVED PHOTO FROM GRIDFS
    // =====================================

    async function loadSavedPhoto() {

        try {

            const response = await fetch(PHOTO_URL, {

                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }

            });

            if (response.status === 404) {

                profilePhoto = "";

                updatePhotoPreview();

                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Could not load saved profile photo."
                );
            }

            const imageBlob = await response.blob();

            if (profilePhotoObjectUrl) {

                URL.revokeObjectURL(profilePhotoObjectUrl);
            }

            profilePhotoObjectUrl =
                URL.createObjectURL(imageBlob);

            profilePhoto = profilePhotoObjectUrl;

            updatePhotoPreview();

        } catch (error) {

            console.error("Photo loading error:", error);
        }
    }


    // =====================================
    // LOAD PROFILE FROM MONGODB
    // =====================================

    async function loadProfile() {

        try {

            const result = await apiRequest("GET");

            profile = result.profile || {};

            fullNameInput.value =
                profile.name || userName;

            emailInput.value = email;

            locationInput.value =
                profile.location || "";

            educationInput.value =
                profile.education || "";

            introductionInput.value =
                profile.introduction || "";

            skillsInput.value =
                Array.isArray(profile.skills)
                    ? profile.skills.join(", ")
                    : "";

            updateProfilePreview();

            // Retrieve the saved image from GridFS
            await loadSavedPhoto();

            updateAccountDetails();

        } catch (error) {

            console.error("Profile loading error:", error);

            alert(
                "Unable to load your profile: " + error.message
            );
        }
    }


    // =====================================
    // ACCOUNT DETAILS
    // =====================================

    function updateAccountDetails() {

        document.getElementById("accountEmail").textContent =
            email;

        const accountStatus =
            document.getElementById("accountStatus");

        const hasBasicDetails = Boolean(
            fullNameInput.value.trim() &&
            locationInput.value.trim() &&
            introductionInput.value.trim()
        );

        accountStatus.textContent =
            hasBasicDetails
                ? "Profile active"
                : "Profile incomplete";
    }


    // =====================================
    // LIVE PREVIEW EVENTS
    // =====================================

    [
        fullNameInput,
        locationInput,
        introductionInput,
        skillsInput

    ].forEach(input => {

        input.addEventListener(
            "input",
            updateProfilePreview
        );

    });


    // =====================================
    // UPLOAD PROFILE PHOTO TO GRIDFS
    // =====================================

    if (uploadPhotoBtn && photoInput) {

        uploadPhotoBtn.addEventListener("click", function() {

            photoInput.click();

        });


        photoInput.addEventListener(
            "change",
            async function() {

                const file = photoInput.files[0];

                if (!file) return;


                // Validate image type
                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowedTypes.includes(file.type)) {

                    alert(
                        "Please select a JPG, PNG, or WebP image."
                    );

                    photoInput.value = "";

                    return;
                }


                // Validate image size
                if (file.size > 1 * 1024 * 1024) {

                    alert(
                        "Please choose an image smaller than 1 MB."
                    );

                    photoInput.value = "";

                    return;
                }


                // Prepare image for upload
                const formData = new FormData();

                formData.append("photo", file);


                try {

                    uploadPhotoBtn.disabled = true;

                    uploadPhotoBtn.textContent = "Uploading...";


                    const response = await fetch(PHOTO_URL, {

                        method: "POST",

                        headers: {
                            "Authorization": `Bearer ${token}`
                        },

                        body: formData

                    });


                    const result = await response.json();

                    if (!response.ok) {

                        throw new Error(
                            result.message || "Photo upload failed."
                        );
                    }


                    // Load the newly saved image
                    await loadSavedPhoto();


                    alert(
                        "Profile photo uploaded successfully!"
                    );


                } catch (error) {

                    console.error("Photo upload error:", error);

                    alert(error.message);


                } finally {

                    uploadPhotoBtn.disabled = false;

                    uploadPhotoBtn.textContent = "Upload Photo";

                    photoInput.value = "";
                }

            }
        );
    }


    // =====================================
    // REMOVE PROFILE PHOTO FROM GRIDFS
    // =====================================

    if (removePhotoBtn) {

        removePhotoBtn.addEventListener(
            "click",
            async function() {

                if (
                    !confirm(
                        "Are you sure you want to remove your profile photo?"
                    )
                ) {
                    return;
                }


                try {

                    removePhotoBtn.disabled = true;


                    const response = await fetch(PHOTO_URL, {

                        method: "DELETE",

                        headers: {
                            "Authorization": `Bearer ${token}`
                        }

                    });


                    const result = await response.json();

                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Could not remove photo."
                        );
                    }


                    // Clear the browser preview
                    if (profilePhotoObjectUrl) {

                        URL.revokeObjectURL(
                            profilePhotoObjectUrl
                        );

                        profilePhotoObjectUrl = "";
                    }

                    profilePhoto = "";

                    photoInput.value = "";

                    updatePhotoPreview();


                    alert(
                        "Profile photo removed successfully!"
                    );


                } catch (error) {

                    console.error(
                        "Photo removal error:",
                        error
                    );

                    alert(error.message);


                } finally {

                    removePhotoBtn.disabled = false;
                }

            }
        );
    }


    // =====================================
    // SAVE PROFILE TO MONGODB
    // =====================================

    profileForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name = fullNameInput.value.trim();

            if (!name) {

                alert("Please enter your name.");

                return;
            }


            const skills = skillsInput.value
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean);


            const updatedProfile = {

                name: name,

                location: locationInput.value.trim(),

                education: educationInput.value.trim(),

                introduction: introductionInput.value.trim(),

                skills: skills,

                currentStep: profile.currentStep || 1

            };


            const saveButton = profileForm.querySelector(
                'button[type="submit"]'
            );


            try {

                if (saveButton) {

                    saveButton.disabled = true;

                    saveButton.textContent = "Saving...";
                }


                const result = await apiRequest(
                    "PUT",
                    updatedProfile
                );


                profile = result.profile || updatedProfile;

                sessionStorage.setItem(
                    "innovatorName",
                    name
                );

                updateUserHeader(name);

                updateProfilePreview();

                updateAccountDetails();


                alert(
                    "Your profile has been saved successfully!"
                );


            } catch (error) {

                console.error("Profile save error:", error);

                alert(
                    "Unable to save your profile: " + error.message
                );


            } finally {

                if (saveButton) {

                    saveButton.disabled = false;

                    saveButton.textContent = "Save Changes";
                }
            }

        }
    );


    // =====================================
    // NOTIFICATION PREFERENCES
    // Stored locally for now
    // =====================================

    let notifications = {
        ...defaultNotifications
    };


    try {

        const savedNotifications = JSON.parse(
            localStorage.getItem(notificationKey) || "{}"
        );

        notifications = {
            ...defaultNotifications,
            ...savedNotifications
        };

    } catch (error) {

        console.error(
            "Notification preferences error:",
            error
        );
    }


    function loadNotifications() {

        Object.keys(notifications).forEach(key => {

            const checkbox = document.getElementById(key);

            if (checkbox) {

                checkbox.checked = notifications[key];
            }

        });
    }


    const saveNotifications =
        document.getElementById("saveNotifications");


    if (saveNotifications) {

        saveNotifications.addEventListener(
            "click",
            function() {

                Object.keys(notifications).forEach(key => {

                    const checkbox =
                        document.getElementById(key);

                    if (checkbox) {

                        notifications[key] = checkbox.checked;
                    }

                });


                localStorage.setItem(
                    notificationKey,
                    JSON.stringify(notifications)
                );


                if (notificationMessage) {

                    notificationMessage.textContent =
                        "Notification preferences saved.";
                }

            }
        );
    }


    // =====================================
    // LOGOUT
    // =====================================

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const confirmLogout = confirm(
                    "Are you sure you want to logout?"
                );


                if (confirmLogout) {

                    // Revoke temporary image URL
                    if (profilePhotoObjectUrl) {

                        URL.revokeObjectURL(
                            profilePhotoObjectUrl
                        );
                    }

                    sessionStorage.removeItem("echoToken");
                    sessionStorage.removeItem("echoUser");
                    sessionStorage.removeItem("innovatorLoggedIn");
                    sessionStorage.removeItem("innovatorEmail");
                    sessionStorage.removeItem("innovatorName");

                    window.location.href =
                        "innovator-login.html";
                }

            }
        );
    }


    // =====================================
    // INITIALIZE SETTINGS PAGE
    // =====================================

    loadNotifications();

    loadProfile();

}
