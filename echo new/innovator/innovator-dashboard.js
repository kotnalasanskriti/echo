
// =====================================
// ECHO - INNOVATOR DASHBOARD
// MongoDB Connected Version
// =====================================

const email = sessionStorage.getItem("innovatorEmail");
const token = sessionStorage.getItem("echoToken");

if (!email || !token) {
    window.location.href = "innovator-login.html";
} else {

    const API_URL = "http://localhost:5000";

    // API REQUEST HELPER

    async function apiRequest(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    }

    // DISPLAY CURRENT DATE

    const today = new Date();

    document.getElementById("currentDate").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    // GET CONNECTIONS
    // Temporary until Connections gets its own API.

    let connections = JSON.parse(
        localStorage.getItem("innovatorConnections_" + email) || "[]"
    );

    if (!Array.isArray(connections)) {
        connections = [];
    }

    // UPDATE USER IDENTITY

    function updateUserDetails(profile) {

        const name =
            profile?.name ||
            sessionStorage.getItem("innovatorName") ||
            "Innovator";

        document.getElementById("userName").textContent = name;

        document.getElementById("userAvatar").textContent =
            name.charAt(0).toUpperCase();

        sessionStorage.setItem("innovatorName", name);
    }

    // CALCULATE PROFILE COMPLETION

    function calculateProfileCompletion(profile) {

        if (!profile) {
            return 0;
        }

        const fields = [
            profile.name,
            profile.location,
            profile.introduction,
            profile.college || profile.education,
            profile.degree,
            profile.graduationYear,
            profile.skills?.length,
            profile.interests,
            profile.industry,
            profile.startupStage,
            profile.ideaDescription
        ];

        const completed = fields.filter(function(value) {
            return Array.isArray(value)
                ? value.length > 0
                : Boolean(value && String(value).trim());
        }).length;

        return Math.round((completed / fields.length) * 100);
    }

    // UPDATE STATISTICS

    function updateStatistics(ideas, profile) {

        document.getElementById("totalIdeas").textContent =
            ideas.length;

        const active = ideas.filter(function(idea) {
            return idea.status === "Active" ||
                   idea.status === "In Progress";
        });

        document.getElementById("activeProjects").textContent =
            active.length;

        document.getElementById("totalConnections").textContent =
            connections.length;

        const completion = calculateProfileCompletion(profile);

        document.getElementById("profileStatus").textContent =
            completion + "%";
    }

    // DISPLAY RECENT PROJECTS

    function displayRecentProjects(projects) {

        const container =
            document.getElementById("recentProjects");

        container.innerHTML = "";

        if (projects.length === 0) {

            const empty = document.createElement("div");
            empty.className = "empty-projects";

            const message = document.createElement("p");
            message.textContent = "No projects created yet.";

            const link = document.createElement("a");
            link.href = "innovator-workspace.html#ignite";
            link.textContent = "Create your first idea →";

            empty.append(message, link);
            container.appendChild(empty);

            return;
        }

        const recentProjects = projects.slice(0, 3);

        recentProjects.forEach(function(project) {

            const row = document.createElement("div");
            row.className = "project-row";

            const details = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = project.title || "Untitled Project";

            const category = document.createElement("p");

            category.textContent =
                (project.industry || "Uncategorised") +
                " • " +
                (project.stage || "Idea");

            details.append(title, category);

            const status = document.createElement("span");
            status.className = "project-status";

            if (project.status === "Active") {
                status.classList.add("completed");
            }

            status.textContent = project.status || "Draft";

            row.append(details, status);

            container.appendChild(row);
        });
    }

    // LOAD DASHBOARD DATA

    async function loadDashboard() {

        try {

            const profileResult = await apiRequest(
                "/api/innovator/profile"
            );

            const ideasResult = await apiRequest(
                "/api/ideas"
            );

           const profile = profileResult.profile;
let ideas = ideasResult.ideas || [];

// Show the startup details saved during onboarding
// if they are not already present in the Ideas collection.
if (profile && profile.startupName) {

    const alreadyExists = ideas.some(idea =>
        idea.title?.trim().toLowerCase() ===
        profile.startupName.trim().toLowerCase()
    );

    if (!alreadyExists) {
        ideas.unshift({
            _id: "onboarding-project",
            title: profile.startupName,
            industry: profile.industry || "Uncategorised",
            stage: profile.startupStage || "Idea",
            description: profile.ideaDescription || "",
            status: "In Progress"
        });
    }
}

updateUserDetails(profile);

updateStatistics(ideas, profile);

displayRecentProjects(ideas);

        } catch (error) {

            console.error("Dashboard loading error:", error);

            document.getElementById("recentProjects").textContent =
                "Unable to load your dashboard data. Please refresh.";

        }
    }

    // LOGOUT

    document.getElementById("logoutBtn").addEventListener(
        "click",
        function() {

            const confirmLogout = confirm(
                "Are you sure you want to logout?"
            );

            if (confirmLogout) {

                sessionStorage.removeItem("echoToken");
                sessionStorage.removeItem("innovatorLoggedIn");
                sessionStorage.removeItem("innovatorEmail");
                sessionStorage.removeItem("innovatorName");

                window.location.href = "innovator-login.html";
            }
        }
    );

    // START DASHBOARD

    loadDashboard();

}