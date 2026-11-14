
// =====================================
// ECHO - INNOVATOR GROWTH
// MongoDB + Gemini AI Integration
// =====================================

const API_URL = "http://localhost:5000/api/ideas";

const email = sessionStorage.getItem("innovatorEmail");
const token = sessionStorage.getItem("echoToken");

if (!email || !token) {
    window.location.href = "innovator-login.html";
}

// =====================================
// 1. USER DETAILS
// =====================================

const account = JSON.parse(
    localStorage.getItem("innovatorAccount_" + email) || "{}"
);

const profile = JSON.parse(
    localStorage.getItem("innovatorProfile_" + email) || "{}"
);

const userName =
    sessionStorage.getItem("innovatorName") ||
    profile.name ||
    account.name ||
    "Innovator";

document.getElementById("userName").textContent = userName;
document.getElementById("userAvatar").textContent =
    userName.charAt(0).toUpperCase();

// =====================================
// 2. ELEMENTS AND STATE
// =====================================

const projectList = document.getElementById("projectList");
const goalProject = document.getElementById("goalProject");
const analysisIdeaSelect = document.getElementById("analysisIdeaSelect");
const analyzeIdeaBtn = document.getElementById("analyzeIdeaBtn");
const analysisStatus = document.getElementById("analysisStatus");
const ideaAnalysisResult = document.getElementById("ideaAnalysisResult");

const chatArea = document.getElementById("chatArea");
const assistantForm = document.getElementById("assistantForm");
const assistantInput = document.getElementById("assistantInput");

let projects = [];
let chatMessages = [];

// =====================================
// 3. API HELPER
// =====================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("echoToken")}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

// =====================================
// 4. LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        if (!confirm("Are you sure you want to logout?")) return;

        sessionStorage.removeItem("innovatorLoggedIn");
        sessionStorage.removeItem("innovatorEmail");
        sessionStorage.removeItem("innovatorName");
        sessionStorage.removeItem("echoToken");
        sessionStorage.removeItem("echoUser");

        window.location.href = "index.html";
    });
}

// =====================================
// 5. GROWTH GOALS
// Kept in localStorage
// =====================================

const growthKey = "innovatorGrowth_" + email;

let goals = JSON.parse(
    localStorage.getItem(growthKey) || "[]"
);

function saveGoals() {
    localStorage.setItem(growthKey, JSON.stringify(goals));
}

function updateStats() {
    const completed = goals.filter(goal => goal.completed).length;

    const progress = goals.length
        ? Math.round((completed / goals.length) * 100)
        : 0;

    document.getElementById("totalProjects").textContent =
        projects.length;

    document.getElementById("totalGoals").textContent =
        goals.length - completed;

    document.getElementById("completedGoals").textContent =
        completed;

    document.getElementById("overallProgress").textContent =
        progress + "%";
}

// =====================================
// 6. LOAD PROJECTS FROM MONGODB
// =====================================

async function loadProjects() {
    projectList.textContent = "Loading your projects...";

    try {
        const data = await apiRequest("/");

        projects = (data.ideas || []).map(idea => ({
            id: idea._id,
            title: idea.title || "Untitled Project",
            stage: idea.stage || "Not specified"
        }));

        displayProjects();
        updateStats();

    } catch (error) {
        console.error("Project loading error:", error);

        projectList.textContent =
            "Unable to load projects: " + error.message;

        projects = [];
        updateStats();
    }
}

// =====================================
// 7. DISPLAY PROJECTS
// =====================================

function displayProjects() {
    projectList.replaceChildren();

    goalProject.innerHTML =
        '<option value="">General Growth Goal</option>';

    analysisIdeaSelect.innerHTML =
        '<option value="">Select an idea to analyze</option>';

    if (projects.length === 0) {
        projectList.innerHTML = `
            <div class="empty-state">
                <h3>No projects found</h3>
                <p>Create your first idea in My Workspace to start tracking growth.</p>
                <a href="innovator-workspace.html" class="primary-btn">
                    Create an Idea
                </a>
            </div>
        `;

        return;
    }

    projects.forEach(project => {
        // Growth goal dropdown
        const goalOption = document.createElement("option");
        goalOption.value = project.id;
        goalOption.textContent = project.title;
        goalProject.appendChild(goalOption);

        // AI analysis dropdown
        const analysisOption = document.createElement("option");
        analysisOption.value = project.id;
        analysisOption.textContent = project.title;
        analysisIdeaSelect.appendChild(analysisOption);

        // Project card
        const projectCard = document.createElement("div");
        projectCard.className = "project-item";

        const title = document.createElement("h3");
        title.textContent = project.title;

        const stage = document.createElement("p");
        stage.className = "project-stage";
        stage.textContent = "Stage: " + project.stage;

        const projectGoals = goals.filter(goal =>
            String(goal.projectId) === String(project.id)
        );

        const completedGoals = projectGoals.filter(
            goal => goal.completed
        ).length;

        const progress = projectGoals.length
            ? Math.round(
                (completedGoals / projectGoals.length) * 100
            )
            : 0;

        const track = document.createElement("div");
        track.className = "progress-track";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = progress + "%";

        track.appendChild(fill);

        const label = document.createElement("div");
        label.className = "progress-label";

        const labelText = document.createElement("span");
        labelText.textContent = "Goal completion";

        const percentage = document.createElement("span");
        percentage.textContent = progress + "%";

        label.append(labelText, percentage);

        const top = document.createElement("div");
        top.className = "project-top";

        const info = document.createElement("div");
        info.append(title, stage);

        top.appendChild(info);
        projectCard.append(top, track, label);
        projectList.appendChild(projectCard);
    });
}

// =====================================
// 8. DISPLAY GROWTH GOALS
// =====================================

function displayGoals() {
    const goalList = document.getElementById("goalList");

    goalList.replaceChildren();

    if (goals.length === 0) {
        goalList.innerHTML =
            '<p class="empty-message">Your goals will appear here.</p>';

        updateStats();
        return;
    }

    goals.forEach(goal => {
        const goalItem = document.createElement("div");
        goalItem.className = "goal-item";

        if (goal.completed) {
            goalItem.classList.add("completed");
        }

        const left = document.createElement("div");
        left.className = "goal-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "goal-check";
        checkbox.checked = goal.completed;

        checkbox.addEventListener("change", function () {
            goal.completed = checkbox.checked;

            saveGoals();
            displayGoals();
            displayProjects();
        });

        const details = document.createElement("div");

        const title = document.createElement("h4");
        title.textContent = goal.title;

        const description = document.createElement("p");

        const project = projects.find(item =>
            String(item.id) === String(goal.projectId)
        );

        description.textContent = project
            ? project.title
            : "General Growth Goal";

        details.append(title, description);
        left.append(checkbox, details);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-goal";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            goals = goals.filter(item => item.id !== goal.id);

            saveGoals();
            displayGoals();
            displayProjects();
        });

        goalItem.append(left, deleteButton);
        goalList.appendChild(goalItem);
    });

    updateStats();
}

// =====================================
// 9. ADD NEW GOAL
// =====================================

document.getElementById("goalForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const title = document.getElementById("goalTitle")
            .value.trim();

        const projectId = goalProject.value;

        if (!title) return;

        goals.push({
            id: Date.now(),
            title,
            projectId,
            completed: false
        });

        saveGoals();

        document.getElementById("goalTitle").value = "";

        displayGoals();
        displayProjects();
    }
);

// =====================================
// 10. AI IDEA ANALYSIS
// =====================================

function addAnalysisSection(parent, heading, content) {
    const section = document.createElement("div");
    section.className = "analysis-section";

    const title = document.createElement("h3");
    title.textContent = heading;

    section.appendChild(title);

    if (Array.isArray(content)) {
        const list = document.createElement("ul");

        content.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
        });

        section.appendChild(list);

    } else {
        const paragraph = document.createElement("p");
        paragraph.textContent = content || "Not provided";
        section.appendChild(paragraph);
    }

    parent.appendChild(section);
}

function renderAnalysis(analysis) {
    ideaAnalysisResult.replaceChildren();

    if (!analysis || typeof analysis !== "object") {
        ideaAnalysisResult.textContent =
            "No analysis data is available.";
        return;
    }

    const sections = [
        ["Idea Assessment", "ideaAssessment"],
        ["Strengths", "strengths"],
        ["Weaknesses", "weaknesses"],
        ["Missing Information", "missingInformation"],
        ["Target Audience", "targetAudience"],
        ["Feature Suggestions", "featureSuggestions"],
        ["Revenue Models", "revenueModels"],
        ["Risks", "risks"],
        ["Next Steps", "nextSteps"],
        ["Research Questions", "researchQuestions"],
        ["Overall Feedback", "overallFeedback"]
    ];

    sections.forEach(([heading, key]) => {
        addAnalysisSection(
            ideaAnalysisResult,
            heading,
            analysis[key]
        );
    });
}

// Load previously saved analysis when an idea is selected
async function loadPreviousAnalysis(ideaId) {
    ideaAnalysisResult.replaceChildren();

    if (!ideaId) {
        analysisStatus.textContent =
            "Select an idea to view its AI analysis.";
        return;
    }

    analysisStatus.textContent = "Checking previous analysis...";

    try {
        const data = await apiRequest(`/${ideaId}/analysis`);

        renderAnalysis(data.analysis.analysis);

        analysisStatus.textContent =
            "Showing your latest saved AI analysis.";

    } catch (error) {
        ideaAnalysisResult.replaceChildren();

        if (error.message.toLowerCase().includes("no ai analysis")) {
            analysisStatus.textContent =
                "No previous analysis found. Click Analyze Idea to begin.";
        } else {
            analysisStatus.textContent = error.message;
        }
    }
}

analysisIdeaSelect.addEventListener("change", function () {
    loadPreviousAnalysis(this.value);
});

// Generate a fresh analysis
analyzeIdeaBtn.addEventListener("click", async function () {
    const ideaId = analysisIdeaSelect.value;

    if (!ideaId) {
        analysisStatus.textContent =
            "Please select an idea first.";
        return;
    }

    analyzeIdeaBtn.disabled = true;
    analyzeIdeaBtn.textContent = "Analyzing...";
    analysisStatus.textContent =
        "Gemini is analyzing your startup idea. Please wait...";

    ideaAnalysisResult.replaceChildren();

    try {
        const data = await apiRequest(`/${ideaId}/analyze`, {
            method: "POST"
        });

        renderAnalysis(data.result.analysis);

        analysisStatus.textContent =
            "Analysis generated and saved successfully.";

    } catch (error) {
        console.error("Idea analysis error:", error);

        analysisStatus.textContent =
            "Unable to analyze idea: " + error.message;

    } finally {
        analyzeIdeaBtn.disabled = false;
        analyzeIdeaBtn.textContent = "Analyze Idea";
    }
});

// =====================================
// 11. ECHO AI ASSISTANT
// =====================================

function addMessage(message, type) {
    const messageBox = document.createElement("div");

    messageBox.className =
        type === "user" ? "user-message" : "assistant-message";

    messageBox.textContent = message;

    chatArea.appendChild(messageBox);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendAssistantMessage(question) {
    if (!question.trim()) return;

    addMessage(question, "user");

    chatMessages.push({
        role: "user",
        content: question
    });

    const loadingMessage = document.createElement("div");
    loadingMessage.className = "assistant-message";
    loadingMessage.textContent = "ECHO is thinking...";

    chatArea.appendChild(loadingMessage);
    chatArea.scrollTop = chatArea.scrollHeight;

    const submitButton = assistantForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        const data = await apiRequest("/assistant/chat", {
            method: "POST",
            body: JSON.stringify({
                messages: chatMessages
            })
        });

        loadingMessage.remove();

        addMessage(data.reply, "assistant");

        chatMessages.push({
            role: "assistant",
            content: data.reply
        });

    } catch (error) {
        loadingMessage.remove();

        addMessage(
            "I'm unable to respond right now. " + error.message,
            "assistant"
        );

        chatMessages.pop();

    } finally {
        if (submitButton) submitButton.disabled = false;
        assistantInput.focus();
    }
}

// Chat form
assistantForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const question = assistantInput.value.trim();

    if (!question) return;

    assistantInput.value = "";

    sendAssistantMessage(question);
});

// Quick suggestion buttons
document.querySelectorAll(".suggestion-btn").forEach(button => {
    button.addEventListener("click", function () {
        const question = button.dataset.question;

        if (question) {
            sendAssistantMessage(question);
        }
    });
});

// =====================================
// 12. INITIAL PAGE LOAD
// =====================================

async function initializeGrowthPage() {
    await loadProjects();

    displayGoals();
    updateStats();

    analysisStatus.textContent =
        "Select an idea to view or generate its AI analysis.";
}

initializeGrowthPage();
