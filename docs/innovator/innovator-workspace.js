
// =====================================
// ECHO - INNOVATOR WORKSPACE
// MongoDB + Express Integration
// =====================================

const API_URL = "https://echo-5122.onrender.com/api/ideas";

let projects = [];
let isLoading = false;

// =====================================
// 1. AUTHENTICATION
// =====================================

const email = sessionStorage.getItem("innovatorEmail");
const token = sessionStorage.getItem("echoToken");

if (!email || !token) {
    window.location.href = "innovator-login.html";
}

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
// 2. API HELPER
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
// 3. LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem("innovatorLoggedIn");
            sessionStorage.removeItem("innovatorEmail");
            sessionStorage.removeItem("innovatorName");
            sessionStorage.removeItem("echoToken");
            sessionStorage.removeItem("echoUser");

            window.location.href = "index.html";
        }
    });
}


// =====================================
// 4. LOCAL PROJECT MIGRATION
// =====================================

async function migrateOldProjects() {
    const storageKey = "innovatorProjects_" + email;
    const migrationKey = "innovatorProjectsMigrated_" + email;

    const oldProjects = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
    );

    const migratedIds = JSON.parse(
        localStorage.getItem(migrationKey) || "[]"
    );

    if (!oldProjects.length) return;

    let migratedCount = 0;

    for (const oldProject of oldProjects) {
        if (migratedIds.includes(String(oldProject.id))) {
            continue;
        }

        try {
            await apiRequest("/", {
                method: "POST",
                body: JSON.stringify({
                    title: oldProject.title,
                    category: oldProject.category || "",
                    industry: oldProject.industry || oldProject.category || "",
                    description: oldProject.description || "",
                    problem: oldProject.problem || "",
                    solution: oldProject.solution || "",
                    targetAudience: oldProject.targetAudience || "",
                    funding: oldProject.funding || "",
                    stage: oldProject.stage || "Idea",
                    status: ["In Progress", "Completed", "On Hold"].includes(
                        oldProject.status
                    ) ? oldProject.status : "In Progress",
                    visibility: oldProject.visibility || "Private",
                    tags: oldProject.tags || []
                })
            });

            migratedIds.push(String(oldProject.id));

            localStorage.setItem(
                migrationKey,
                JSON.stringify(migratedIds)
            );

            migratedCount++;

        } catch (error) {
            console.error("Project migration failed:", error);

            alert(
                "Some older projects could not be migrated. " +
                "Your original local projects are still محفوظ in localStorage. " +
                "Please check the backend and reload the page to retry."
            );

            break;
        }
    }

    if (migratedCount > 0) {
        console.log(`${migratedCount} old project(s) migrated to MongoDB.`);
    }
}


// =====================================
// 5. FETCH PROJECTS FROM MONGODB
// =====================================

async function loadProjects() {
    try {
        isLoading = true;

        const data = await apiRequest("/");

        projects = data.ideas.map(function (idea) {
            return {
                id: idea._id,
                title: idea.title || "",
                category: idea.category || idea.industry || "",
                industry: idea.industry || idea.category || "",
                description: idea.description || "",
                problem: idea.problem || "",
                solution: idea.solution || "",
                targetAudience: idea.targetAudience || "",
                funding: idea.funding || "",
                stage: idea.stage || "Idea",
                status: idea.status || "In Progress",
                visibility: idea.visibility || "Private",
                tags: idea.tags || [],
                createdAt: idea.createdAt
            };
        });

        displayProjects();
        updateDnaProjects();

    } catch (error) {
        console.error("Unable to load projects:", error);

        alert(
            "Unable to load your projects. " +
            error.message
        );

    } finally {
        isLoading = false;
    }
}


// =====================================
// 6. CREATE NEW IDEA
// =====================================

const ideaForm = document.getElementById("ideaForm");

if (ideaForm) {
    ideaForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("ideaTitle").value.trim();
        const category = document.getElementById("ideaCategory").value;
        const stage = document.getElementById("ideaStage").value;
        const funding = document.getElementById("ideaFunding").value.trim();
        const description = document.getElementById("ideaDescription").value.trim();
        const problem = document.getElementById("ideaProblem").value.trim();
        const solution = document.getElementById("ideaSolution").value.trim();
        const audience = document.getElementById("ideaAudience").value.trim();

        const visibilityInput = document.querySelector(
            'input[name="visibility"]:checked'
        );

        const visibility = visibilityInput
            ? visibilityInput.value
            : "Private";

        const formMessage = document.getElementById("formMessage");
        const submitButton = ideaForm.querySelector('button[type="submit"]');

        if (!title || !category || !stage || !description || !problem || !solution) {
            formMessage.textContent = "Please complete all required fields.";
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";

            await apiRequest("/", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    category,
                    industry: category,
                    stage,
                    funding,
                    description,
                    problem,
                    solution,
                    targetAudience: audience,
                    visibility,
                    status: "In Progress",
                    tags: []
                })
            });

            ideaForm.reset();

            formMessage.textContent =
                "Your idea has been saved successfully!";

            await loadProjects();

            formMessage.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {
            formMessage.textContent =
                "Unable to save idea: " + error.message;

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Save Idea";
        }
    });
}


// =====================================
// 7. DISPLAY PROJECTS
// =====================================

const projectList = document.getElementById("projectList");
const emptyProjects = document.getElementById("emptyProjects");

function displayProjects() {
    if (!projectList || !emptyProjects) return;

    projectList.replaceChildren();

    const searchText =
        (document.getElementById("projectSearch")?.value || "")
            .toLowerCase();

    const category =
        document.getElementById("categoryFilter")?.value || "All";

    const status =
        document.getElementById("statusFilter")?.value || "All";

    const filteredProjects = projects.filter(function (project) {
        const matchesSearch =
            project.title.toLowerCase().includes(searchText) ||
            project.description.toLowerCase().includes(searchText);

        const matchesCategory =
            category === "All" || project.category === category;

        const matchesStatus =
            status === "All" || project.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (filteredProjects.length === 0) {
        emptyProjects.classList.remove("hidden");

        const heading = emptyProjects.querySelector("h3");
        const paragraph = emptyProjects.querySelector("p");

        if (projects.length > 0) {
            heading.textContent = "No matching projects found.";
            paragraph.textContent =
                "Try changing your search or filters.";
        } else {
            heading.textContent = "Your workspace is waiting.";
            paragraph.textContent =
                "You haven't added any ideas yet. Start with the idea you can't stop thinking about.";
        }

        return;
    }

    emptyProjects.classList.add("hidden");

    filteredProjects.forEach(function (project) {
        const card = document.createElement("div");
        card.className = "project-card";

        const top = document.createElement("div");
        top.className = "project-top";

        const categoryText = document.createElement("span");
        categoryText.className = "project-category";
        categoryText.textContent = project.category;

        const statusText = document.createElement("span");
        statusText.className = "project-status";
        statusText.textContent = project.status;

        top.append(categoryText, statusText);

        const title = document.createElement("h3");
        title.textContent = project.title;

        const description = document.createElement("p");
        description.className = "project-description";
        description.textContent = project.description;

        const meta = document.createElement("div");
        meta.className = "project-meta";

        const stage = document.createElement("span");
        stage.textContent = "Stage: " + project.stage;

        const visibility = document.createElement("span");
        visibility.textContent = project.visibility;

        meta.append(stage, visibility);

        const actions = document.createElement("div");
        actions.className = "project-actions";

        const viewButton = document.createElement("button");
        viewButton.className = "small-btn";
        viewButton.textContent = "View Details";
        viewButton.addEventListener("click", function () {
            showProjectDetails(project.id);
        });

        const editButton = document.createElement("button");
        editButton.className = "small-btn";
        editButton.textContent = "Edit Status";
        editButton.addEventListener("click", function () {
            editProjectStatus(project.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "small-btn danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteProject(project.id);
        });

        actions.append(viewButton, editButton, deleteButton);
        card.append(top, title, description, meta, actions);

        projectList.appendChild(card);
    });
}


// =====================================
// 8. VIEW PROJECT DETAILS
// =====================================

function showProjectDetails(id) {
    const project = projects.find(function (item) {
        return item.id === id;
    });

    if (!project) return;

    const details = document.getElementById("detailsContent");
    details.replaceChildren();

    const category = document.createElement("p");
    category.className = "project-category";
    category.textContent = project.category + " / " + project.status;

    const title = document.createElement("h3");
    title.className = "details-title";
    title.textContent = project.title;

    details.append(category, title);

    addDetailBlock(details, "Overview", project.description);
    addDetailBlock(details, "Problem", project.problem);
    addDetailBlock(details, "Proposed Solution", project.solution);
    addDetailBlock(details, "Target Audience", project.targetAudience || "Not added yet");
    addDetailBlock(details, "Current Stage", project.stage);
    addDetailBlock(details, "Funding Requirement", project.funding || "Not specified");
    addDetailBlock(details, "Visibility", project.visibility);

    document.getElementById("projectDetails").scrollIntoView({
        behavior: "smooth"
    });
}

function addDetailBlock(parent, heading, content) {
    const block = document.createElement("div");
    block.className = "details-block";

    const title = document.createElement("h4");
    title.textContent = heading;

    const paragraph = document.createElement("p");
    paragraph.textContent = content || "Not provided";

    block.append(title, paragraph);
    parent.appendChild(block);
}


// =====================================
// 9. EDIT PROJECT STATUS
// =====================================

async function editProjectStatus(id) {
    const project = projects.find(function (item) {
        return item.id === id;
    });

    if (!project) return;

    const newStatus = prompt(
        "Enter project status:\nIn Progress\nCompleted\nOn Hold",
        project.status
    );

    if (newStatus === null) return;

    const allowedStatuses = [
        "In Progress",
        "Completed",
        "On Hold"
    ];

    const cleanedStatus = newStatus.trim();

    if (!allowedStatuses.includes(cleanedStatus)) {
        alert("Please enter: In Progress, Completed, or On Hold.");
        return;
    }

    try {
        await apiRequest("/" + id, {
            method: "PUT",
            body: JSON.stringify({
                status: cleanedStatus
            })
        });

        await loadProjects();

    } catch (error) {
        alert("Unable to update project: " + error.message);
    }
}


// =====================================
// 10. DELETE PROJECT
// =====================================

async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) {
        return;
    }

    try {
        await apiRequest("/" + id, {
            method: "DELETE"
        });

        await loadProjects();

        const details = document.getElementById("detailsContent");

        if (details) {
            details.replaceChildren();

            const message = document.createElement("p");
            message.className = "details-placeholder";
            message.textContent =
                "Select a project from My Projects to see its details here.";

            details.appendChild(message);
        }

    } catch (error) {
        alert("Unable to delete project: " + error.message);
    }
}


// =====================================
// 11. SEARCH AND FILTERS
// =====================================

document.getElementById("projectSearch")?.addEventListener(
    "input",
    displayProjects
);

document.getElementById("categoryFilter")?.addEventListener(
    "change",
    displayProjects
);

document.getElementById("statusFilter")?.addEventListener(
    "change",
    displayProjects
);


// =====================================
// 12. IDEA DNA PROJECT DROPDOWN
// =====================================

function updateDnaProjects() {
    const dropdown = document.getElementById("dnaProject");

    if (!dropdown) return;

    const previousValue = dropdown.value;

    dropdown.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a project";

    dropdown.appendChild(defaultOption);

    projects.forEach(function (project) {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.title;

        dropdown.appendChild(option);
    });

    if (projects.some(function (project) {
        return project.id === previousValue;
    })) {
        dropdown.value = previousValue;
    }
}


// =====================================
// 13. IDEA DNA CHECKLIST
// =====================================

const dnaQuestions = [
    "Have you clearly identified the problem?",
    "Have you explained how your solution works?",
    "Have you identified your target audience?",
    "Have you researched similar products or competitors?",
    "Have you thought about how your idea can generate value?"
];

const dnaChecklist = document.getElementById("dnaChecklist");
const dnaProject = document.getElementById("dnaProject");

if (dnaProject && dnaChecklist) {
    dnaProject.addEventListener("change", function () {
        dnaChecklist.replaceChildren();

        if (!this.value) {
            const message = document.createElement("p");
            message.className = "details-placeholder";
            message.textContent =
                "Select a project to begin your Idea DNA check.";

            dnaChecklist.appendChild(message);
            document.getElementById("dnaResult").textContent = "";

            return;
        }

        dnaQuestions.forEach(function (question) {
            const label = document.createElement("label");
            label.className = "dna-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "dna-answer";

            const text = document.createElement("span");
            text.textContent = question;

            label.append(checkbox, text);
            dnaChecklist.appendChild(label);
        });

        document.getElementById("dnaResult").textContent = "";
    });
}


// =====================================
// 14. CHECK IDEA DNA SCORE
// =====================================

const checkDnaBtn = document.getElementById("checkDnaBtn");

if (checkDnaBtn) {
    checkDnaBtn.addEventListener("click", function () {
        const selectedProject = document.getElementById("dnaProject").value;

        if (!selectedProject) {
            alert("Please select a project first.");
            return;
        }

        const answers = document.querySelectorAll(".dna-answer");

        let completed = 0;

        answers.forEach(function (answer) {
            if (answer.checked) completed++;
        });

        const score = Math.round(
            (completed / dnaQuestions.length) * 100
        );

        let message = "";

        if (score === 100) {
            message =
                "Excellent! You have reviewed all five important areas of your idea.";
        } else if (score >= 60) {
            message =
                "Good progress! Work on the remaining areas to make your idea clearer.";
        } else {
            message =
                "Your idea is at an early stage. Keep researching and developing it.";
        }

        document.getElementById("dnaResult").textContent =
            "Idea DNA Checklist: " + score + "% completed. " + message;
    });
}


// =====================================
// 15. INITIAL PAGE LOAD
// =====================================

async function initializeWorkspace() {
    try {
        // First fetch existing MongoDB projects.
        await loadProjects();

        // Then migrate any old localStorage projects.
        await migrateOldProjects();

        // Fetch again to include successfully migrated projects.
        await loadProjects();

    } catch (error) {
        console.error("Workspace initialization failed:", error);
    }
}

initializeWorkspace();
