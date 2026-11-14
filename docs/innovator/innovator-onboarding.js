
// =============================================
// ECHO - INNOVATOR FOUNDER JOURNEY
// COMPLETE JAVASCRIPT
// =============================================


// 1. CHECK USER LOGIN
const userEmail = sessionStorage.getItem("innovatorEmail");
const token = sessionStorage.getItem("echoToken");

if (!userEmail || !token) {
    window.location.href = "innovator-login.html";
} else {
const API_URL = "https://echo-5122.onrender.com/api/innovator";

async function apiRequest(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}
// =============================================
// 2. GET HTML ELEMENTS
// =============================================

const form = document.getElementById("onboardingForm");

const steps = document.querySelectorAll(".form-step");

const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
const completeButton = document.getElementById("completeButton");
const saveButton = document.getElementById("saveButton");

const progressFill = document.getElementById("progressFill");

const stepCounter = document.getElementById("stepCounter");
const stepTitle = document.getElementById("stepTitle");

const formError = document.getElementById("formError");

const skillButtons = document.querySelectorAll(".skill-option");
const stageButtons = document.querySelectorAll(".stage-option");


// =============================================
// 3. ONBOARDING VARIABLES
// =============================================

let currentStep = 1;

let selectedSkills = [];

let selectedStage = "";

let profilePhotoData = "";


const email = userEmail.trim().toLowerCase();

const draftKey = "innovatorOnboardingDraft_" + email;

const profileKey = "innovatorProfile_" + email;

const accountKey = "innovatorAccount_" + email;


// =============================================
// 4. GET INPUT ELEMENT
// =============================================

function getValue(id) {

    return document.getElementById(id).value.trim();

}


// =============================================
// 5. GET COMPLETE PROFILE DATA
// =============================================

function getProfileData() {

    return {

        name: getValue("founderName"),

        email: email,

        location: getValue("location"),

        introduction: getValue("introduction"),

        college: getValue("college"),

        degree: getValue("degree"),

        graduationYear: getValue("graduationYear"),

        experience: getValue("experience"),

        skills: [...selectedSkills],

        interests: getValue("interests"),

        startupName: getValue("startupName"),

        industry: getValue("industry"),

        startupStage: selectedStage,

        ideaDescription: getValue("ideaDescription"),

        profilePhoto: profilePhotoData

    };

}


// =============================================
// 6. SAVE ONBOARDING PROGRESS
// =============================================

async function saveDraft() {
    try {
        const profile = getProfileData();

        // Profile photos will be connected to cloud storage separately.
        delete profile.profilePhoto;

        profile.currentStep = currentStep;
        profile.isCompleted = false;

        await apiRequest("/profile", "PUT", profile);

        return true;

    } catch (error) {
        console.error("Profile save failed:", error);

        formError.textContent =
            "Unable to save your progress. Please try again.";

        return false;
    }
}


// =============================================
// 7. UPDATE LIVE FOUNDER CARD
// =============================================

function updateFounderCard() {

    const data = getProfileData();


    // UPDATE NAME

    document.getElementById("cardName").textContent =
        data.name || "Your Name";


    // UPDATE INITIAL

    document.getElementById("cardInitial").textContent =
        data.name ? data.name.charAt(0).toUpperCase() : "?";


    // UPDATE LOCATION

    document.getElementById("cardLocation").innerHTML =
        "<span>⌖</span> " + (data.location || "Your location");


    // UPDATE INTRODUCTION

    document.getElementById("cardIntroduction").textContent =
        data.introduction || "Your introduction will appear here.";


    // UPDATE STARTUP

    document.getElementById("cardStartup").textContent =
        data.startupName || "Your next big idea";


    // UPDATE INDUSTRY

    document.getElementById("cardIndustry").textContent =
        data.industry || "Industry not selected";


    // UPDATE STAGE

    document.getElementById("cardStage").textContent =
        selectedStage || "Not selected";


    // UPDATE SKILLS

    const cardSkills = document.getElementById("cardSkills");

    cardSkills.innerHTML = "";


    if (selectedSkills.length === 0) {

        const emptySkill = document.createElement("span");

        emptySkill.className = "empty-skill";

        emptySkill.textContent = "Your skills will appear here";

        cardSkills.appendChild(emptySkill);

    } else {

        selectedSkills.forEach(function (skill) {

            const skillElement = document.createElement("span");

            skillElement.textContent = skill;

            cardSkills.appendChild(skillElement);

        });

    }

}


// =============================================
// 8. UPDATE PROFILE PHOTO
// =============================================

function showProfilePhoto() {

    if (!profilePhotoData) {
        return;
    }


    const photoPreview = document.getElementById("photoPreview");

    const cardPhoto = document.getElementById("cardPhoto");


    const previewImage = document.createElement("img");

    previewImage.src = profilePhotoData;

    previewImage.alt = "Profile preview";


    const cardImage = document.createElement("img");

    cardImage.src = profilePhotoData;

    cardImage.alt = "Founder profile";


    photoPreview.replaceChildren(previewImage);

    cardPhoto.replaceChildren(cardImage);

}


// =============================================
// 9. PROFILE PHOTO UPLOAD
// =============================================

const profilePhotoInput =
    document.getElementById("profilePhoto");


profilePhotoInput.addEventListener("change", function () {

    const file = profilePhotoInput.files[0];

    if (!file) {
        return;
    }


    formError.textContent = "";


    // CHECK FILE TYPE

    if (!["image/jpeg", "image/png"].includes(file.type)) {

        formError.textContent =
            "Please upload a JPG or PNG image.";

        profilePhotoInput.value = "";

        return;

    }


    // CHECK FILE SIZE: 1 MB

    if (file.size > 1024 * 1024) {

        formError.textContent =
            "Please select an image smaller than 1 MB.";

        profilePhotoInput.value = "";

        return;

    }


    const reader = new FileReader();


    reader.onload = function (event) {

        profilePhotoData = event.target.result;

        showProfilePhoto();

        updateFounderCard();

        saveDraft();

    };


    reader.onerror = function () {

        formError.textContent =
            "Unable to read this image. Please try another.";

    };


    reader.readAsDataURL(file);

});


// =============================================
// 10. SKILL SELECTION
// =============================================

skillButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const skill = button.textContent.trim();


        if (selectedSkills.includes(skill)) {

            selectedSkills = selectedSkills.filter(
                function (item) {
                    return item !== skill;
                }
            );

            button.classList.remove("selected");

        } else {

            selectedSkills.push(skill);

            button.classList.add("selected");

        }


        updateFounderCard();

        saveDraft();

    });

});


// =============================================
// 11. STARTUP STAGE SELECTION
// =============================================

stageButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        selectedStage = button.dataset.value;

        document.getElementById("startupStage").value =
            selectedStage;


        stageButtons.forEach(function (item) {

            item.classList.remove("selected");

        });


        button.classList.add("selected");


        updateFounderCard();

        saveDraft();

    });

});


// =============================================
// 12. UPDATE PROGRESS BAR
// =============================================

function updateProgress() {

    const percentage = currentStep * 20;

    progressFill.style.width = percentage + "%";


    stepCounter.textContent =
        "STEP 0" + currentStep + " / 05";


    const titles = [
        "YOUR IDENTITY",
        "YOUR BACKGROUND",
        "YOUR CAPABILITIES",
        "YOUR AMBITION",
        "FINAL REVIEW"
    ];

    stepTitle.textContent = titles[currentStep - 1];


    // UPDATE STEP NAVIGATION

    const navigationItems =
        document.querySelectorAll(".step-item");


    navigationItems.forEach(function (item, index) {

        item.classList.remove("active", "completed");


        if (index + 1 < currentStep) {

            item.classList.add("completed");

        } else if (index + 1 === currentStep) {

            item.classList.add("active");

        }

    });

}


// =============================================
// 13. SHOW CURRENT STEP
// =============================================

function showStep() {

    steps.forEach(function (step) {

        step.classList.remove("active");

    });


    const activeStep = document.querySelector(
        '.form-step[data-step="' + currentStep + '"]'
    );

    activeStep.classList.add("active");


    // PREVIOUS BUTTON

    previousButton.style.display =
        currentStep === 1 ? "none" : "inline-flex";


    // LAST STEP BUTTONS

    if (currentStep === 5) {

        nextButton.style.display = "none";

        completeButton.style.display = "inline-flex";

        saveButton.style.display = "none";

        showReview();

    } else {

        nextButton.style.display = "inline-flex";

        completeButton.style.display = "none";

        saveButton.style.display = "block";

    }


    formError.textContent = "";

    updateProgress();

    updateFounderCard();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =============================================
// 14. VALIDATE CURRENT STEP
// =============================================

function validateStep() {

    formError.textContent = "";


    // STEP 1: IDENTITY

    if (currentStep === 1) {

        const name = getValue("founderName");

        const location = getValue("location");

        const introduction = getValue("introduction");


        if (name.length < 2) {

            formError.textContent =
                "Please enter your full name.";

            return false;

        }


        if (!location) {

            formError.textContent =
                "Please enter your location.";

            return false;

        }


        if (!introduction) {

            formError.textContent =
                "Please introduce yourself.";

            return false;

        }

    }


    // STEP 2: BACKGROUND

    if (currentStep === 2) {

        const college = getValue("college");

        const degree = getValue("degree");

        const year = getValue("graduationYear");


        if (!college || !degree || !year) {

            formError.textContent =
                "Please complete all required education details.";

            return false;

        }

    }


    // STEP 3: SKILLS

    if (currentStep === 3) {

        if (selectedSkills.length === 0) {

            formError.textContent =
                "Please select at least one skill.";

            return false;

        }

    }


    // STEP 4: AMBITION

    if (currentStep === 4) {

        const industry = getValue("industry");


        if (!industry || !selectedStage) {

            formError.textContent =
                "Please select your industry and development stage.";

            return false;

        }

    }


    return true;

}


// =============================================
// 15. CONTINUE BUTTON
// =============================================

nextButton.addEventListener("click", async function () {
    if (!validateStep()) {
        return;
    }

    currentStep++;

    showStep();

    await saveDraft();
});


// =============================================
// 16. PREVIOUS BUTTON
// =============================================

previousButton.addEventListener("click", function () {

    if (currentStep > 1) {

        currentStep--;

        showStep();

    }

});


// =============================================
// 17. BUILD FINAL PROFILE REVIEW
// =============================================

function showReview() {

    const data = getProfileData();

    const reviewContent =
        document.getElementById("reviewContent");


    const reviewItems = [

        ["FULL NAME", data.name],

        ["EMAIL ADDRESS", data.email],

        ["LOCATION", data.location],

        ["INTRODUCTION", data.introduction],

        ["COLLEGE / UNIVERSITY", data.college],

        ["DEGREE", data.degree],

        ["GRADUATION YEAR", data.graduationYear],

        ["EXPERIENCE", data.experience || "Not provided"],

        ["SKILLS", data.skills.join(", ")],

        ["AREA OF INTEREST", data.interests || "Not provided"],

        ["STARTUP / IDEA", data.startupName || "Not provided"],

        ["INDUSTRY", data.industry],

        ["DEVELOPMENT STAGE", data.startupStage],

        ["IDEA DESCRIPTION", data.ideaDescription || "Not provided"]

    ];


    reviewContent.innerHTML = "";


    reviewItems.forEach(function (item) {

        const reviewBox = document.createElement("div");

        reviewBox.className = "review-item";


        const heading = document.createElement("span");

        heading.textContent = item[0];


        const value = document.createElement("p");

        value.textContent = item[1] || "Not provided";


        reviewBox.appendChild(heading);

        reviewBox.appendChild(value);

        reviewContent.appendChild(reviewBox);

    });

}


// =============================================
// 18. RESTORE PREVIOUSLY SAVED PROGRESS
// =============================================

async function loadDraft() {
    try {
        const result = await apiRequest("/profile");

        const data = result.profile;

        if (!data) {
            document.getElementById("founderName").value =
                sessionStorage.getItem("innovatorName") || "";

            return;
        }

        document.getElementById("founderName").value =
            data.name || "";

        document.getElementById("location").value =
            data.location || "";

        document.getElementById("introduction").value =
            data.introduction || "";

        document.getElementById("college").value =
            data.college || "";

        document.getElementById("degree").value =
            data.degree || "";

        document.getElementById("graduationYear").value =
            data.graduationYear || "";

        document.getElementById("experience").value =
            data.experience || "";

        document.getElementById("interests").value =
            data.interests || "";

        document.getElementById("startupName").value =
            data.startupName || "";

        document.getElementById("industry").value =
            data.industry || "";

        document.getElementById("ideaDescription").value =
            data.ideaDescription || "";

        selectedSkills = Array.isArray(data.skills)
            ? data.skills
            : [];

        skillButtons.forEach(function (button) {
            button.classList.toggle(
                "selected",
                selectedSkills.includes(button.textContent.trim())
            );
        });

        selectedStage = data.startupStage || "";

        document.getElementById("startupStage").value =
            selectedStage;

        stageButtons.forEach(function (button) {
            button.classList.toggle(
                "selected",
                button.dataset.value === selectedStage
            );
        });

        currentStep = Math.min(
            Math.max(Number(data.currentStep) || 1, 1),
            5
        );

    } catch (error) {
        console.error("Unable to load profile:", error);

        formError.textContent =
            "Unable to load your saved profile. Please refresh the page.";
    }
}


// =============================================
// 19. AUTO UPDATE LIVE CARD AND SAVE
// =============================================
let saveTimer;

function scheduleSaveDraft() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(function () {
        saveDraft();
    }, 800);
}

form.addEventListener("input", function () {
    updateFounderCard();
    scheduleSaveDraft();
});

form.addEventListener("change", function () {
    updateFounderCard();
    scheduleSaveDraft();
});
// =============================================
// 20. SAVE PROGRESS BUTTON
// =============================================

saveButton.addEventListener("click", async function () {
    const saved = await saveDraft();

    if (saved) {
        alert("Your progress has been saved successfully.");
    }
});

// =============================================
// 21. COMPLETE PROFILE
// =============================================

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (currentStep !== 5) {
        return;
    }

    const profile = getProfileData();

    delete profile.profilePhoto;

    profile.currentStep = 5;
    profile.isCompleted = true;
try {
    // 1. Save founder profile
    await apiRequest("/profile", "PUT", profile);

    // 2. Create initial project in Ideas
    if (profile.startupName && profile.startupName.trim()) {

        const ideasURL = "https://echo-5122.onrender.com/api/ideas/";

        // Fetch existing projects to prevent duplicates
        const existingResponse = await fetch(ideasURL, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const existingData = await existingResponse.json();

        if (!existingResponse.ok) {
            throw new Error(
                existingData.message || "Unable to check existing projects."
            );
        }

        const existingIdeas = existingData.ideas || [];

        const alreadyExists = existingIdeas.some(idea =>
            idea.title?.trim().toLowerCase() ===
                profile.startupName.trim().toLowerCase()
        );

        // Create project only if it does not already exist
        if (!alreadyExists) {

            const projectResponse = await fetch(ideasURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: profile.startupName,
                    category: profile.industry,
                    industry: profile.industry,
                    stage: profile.startupStage,
                    description: profile.ideaDescription,
                    visibility: "Private"
                })
            });

            const projectData = await projectResponse.json();

            if (!projectResponse.ok) {
                throw new Error(
                    projectData.message || "Unable to create your project."
                );
            }
        }
    }

    sessionStorage.setItem("innovatorName", profile.name);

    alert("Welcome to ECHO! Your founder profile and project are ready.");

    window.location.href = "innovator-dashboard.html";

    } catch (error) {
        console.error("Profile completion failed:", error);

        formError.textContent =
            "Unable to complete your profile. Please try again.";
    }
});

// =============================================
// 22. START THE ONBOARDING PAGE
// =============================================
async function initializeOnboarding() {
    document.getElementById("founderEmail").value = email;

    await loadDraft();

    updateFounderCard();
    showStep();

    if (typeof result !== "undefined" && result?.isCompleted) {
        console.log("This founder has already completed onboarding.");
    }
}

initializeOnboarding();

loadDraft();

updateFounderCard();

showStep();

}
