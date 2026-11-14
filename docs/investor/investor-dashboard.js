// =====================================
// 1. INVESTOR LOGIN CHECK
// =====================================

if (sessionStorage.getItem("investorLoggedIn") !== "true") {
    window.location.href = "investor-login.html";
}

// =====================================
// 2. API CONFIGURATION
// =====================================

const API_URL = "https://echo-5122.onrender.com/api";
const token = sessionStorage.getItem("echoToken");

if (!token) {
    window.location.href = "investor-login.html";
}

let projects = [];
let savedProjects = [];
let investorProfile = {};

let connections = [];
let receivedRequests = [];
let sentRequests = [];

let selectedUserId = null;
let selectedConversationId = null;
let chatMessages = [];

// =====================================
// 3. API HELPER
// =====================================

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

// =====================================
// 4. HTML ESCAPE HELPER
// =====================================

function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

}

// =====================================
// 5. FETCH PUBLIC PROJECTS
// =====================================

async function fetchPublicProjects() {

    try {

        const data = await apiRequest("/ideas/explore");

        projects = (data.ideas || []).map(idea => ({
            id: idea._id,
            name: idea.title,
            category: idea.category || idea.industry || "Other",
            description:
                idea.description ||
                idea.solution ||
                "No description available.",
            creator: idea.creator?.name || "ECHO Innovator",
            featured: false
        }));

        showAllProjects();
        showFeaturedProjects();
        showDashboardProjects();
        updateDashboard();

    } catch (error) {

        console.error("Project loading error:", error);

        document.getElementById("allProjects").innerHTML =
            `<p class="empty-message">${escapeHTML(error.message)}</p>`;

    }

}

// =====================================
// 6. FETCH SAVED PROJECTS
// =====================================

async function fetchSavedProjects() {

    try {

        const data = await apiRequest("/interests");

        savedProjects = (data.interests || [])
            .filter(item => item.idea)
            .map(item => item.idea._id);

        showAllProjects();
        showFeaturedProjects();
        showDashboardProjects();
        showSavedProjects();
        updateDashboard();

    } catch (error) {

        console.error("Saved interests loading error:", error);

    }

}

// =====================================
// 7. PROJECT CARDS
// =====================================

function createProjectCard(project) {

    const isSaved = savedProjects.includes(project.id);

    return `
        <div class="project-card">

            <span class="category">
                ${escapeHTML(project.category)}
            </span>

            <h3>${escapeHTML(project.name)}</h3>

            <p>${escapeHTML(project.description)}</p>

            <small>
                Created by ${escapeHTML(project.creator)}
            </small>

            <div class="project-actions">

                <button
                    type="button"
                    onclick="showProjectDetails('${project.id}')">
                    View details
                </button>

                <button
                    type="button"
                    class="save-btn"
                    onclick="saveProject('${project.id}')">
                    ${isSaved ? "Remove saved" : "Save interest"}
                </button>

            </div>

        </div>
    `;
}

// =====================================
// 8. SHOW ALL PROJECTS
// =====================================

function showAllProjects(projectList = projects) {

    const container = document.getElementById("allProjects");

    if (!container) return;

    if (projectList.length === 0) {

        container.innerHTML =
            '<p class="empty-message">No projects available.</p>';

        return;

    }

    container.innerHTML = projectList
        .map(createProjectCard)
        .join("");

}

// =====================================
// 9. SHOW FEATURED PROJECTS
// =====================================

function showFeaturedProjects() {

    const container = document.getElementById("featuredProjects");

    if (!container) return;

    const featured = projects.filter(project => project.featured);

    container.innerHTML = featured.length
        ? featured.map(createProjectCard).join("")
        : '<p class="empty-message">No featured projects available yet.</p>';

}

// =====================================
// 10. SHOW DASHBOARD PROJECTS
// =====================================

function showDashboardProjects() {

    const container = document.getElementById("dashboardProjects");

    if (!container) return;

    container.innerHTML = projects
        .slice(0, 2)
        .map(createProjectCard)
        .join("");

}

// =====================================
// 11. SAVE / REMOVE PROJECT INTEREST
// =====================================

async function saveProject(id) {

    try {

        const isSaved = savedProjects.includes(id);

        await apiRequest(`/interests/${id}`, {
            method: isSaved ? "DELETE" : "POST"
        });

        await fetchSavedProjects();

    } catch (error) {

        console.error("Save interest error:", error);
        alert(error.message);

    }

}

// =====================================
// 12. SHOW SAVED PROJECTS
// =====================================

function showSavedProjects() {

    const container = document.getElementById("savedProjects");

    if (!container) return;

    const saved = projects.filter(project =>
        savedProjects.includes(project.id)
    );

    container.innerHTML = saved.length
        ? saved.map(createProjectCard).join("")
        : '<p class="empty-message">You have not saved any projects yet.</p>';

}

// =====================================
// 13. VIEW PROJECT DETAILS
// =====================================

function showProjectDetails(id) {

    const project = projects.find(item => item.id === id);

    if (!project) return;

    alert(
        "Project: " + project.name +
        "\nCategory: " + project.category +
        "\nCreator: " + project.creator +
        "\n\n" + project.description
    );

}

// =====================================
// 14. SEARCH PROJECTS
// =====================================

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchText = this.value.toLowerCase();

        const filteredProjects = projects.filter(project =>
            project.name.toLowerCase().includes(searchText) ||
            project.category.toLowerCase().includes(searchText) ||
            project.description.toLowerCase().includes(searchText)
        );

        showAllProjects(filteredProjects);

    });

}

// =====================================
// 15. PROFILE: LOAD FROM DATABASE
// =====================================

async function loadProfile() {

    try {

        const data = await apiRequest("/users/profile");

        investorProfile = data.user || {};

        document.getElementById("investorName").value =
            investorProfile.name || "";

        document.getElementById("investorEmail").value =
            investorProfile.email || "";

        document.getElementById("investorInterest").value =
            investorProfile.interest || "";

        document.getElementById("investorAbout").value =
            investorProfile.about || "";

    } catch (error) {

        console.error("Profile loading error:", error);

        document.getElementById("profileMessage").textContent =
            error.message;

    }

}

// =====================================
// 16. PROFILE: SAVE TO DATABASE
// =====================================

const profileForm = document.getElementById("profileForm");

if (profileForm) {

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const profileData = {
            name: document.getElementById("investorName").value.trim(),
            email: document.getElementById("investorEmail").value.trim(),
            interest: document.getElementById("investorInterest").value.trim(),
            about: document.getElementById("investorAbout").value.trim()
        };

        try {

            const data = await apiRequest("/users/profile", {
                method: "PUT",
                body: JSON.stringify(profileData)
            });

            investorProfile = data.user;

            document.getElementById("profileMessage").textContent =
                "Your profile has been saved.";

            const heading = document.getElementById("welcomeHeading");

            if (heading) {
                heading.textContent = "Welcome, " + investorProfile.name;
            }

        } catch (error) {

            console.error("Profile update error:", error);

            document.getElementById("profileMessage").textContent =
                error.message;

        }

    });

}

// =====================================
// 17. FETCH CONNECTIONS AND REQUESTS
// =====================================

async function refreshNetwork() {

    try {

        const networkData = await apiRequest("/connections");

        const currentUserId = sessionStorage.getItem("echoUserId");

        connections = (networkData.connections || []).map(item => {

            const person =
                String(item.requester._id) === String(currentUserId)
                    ? item.recipient
                    : item.requester;

            return {
                ...item,
                person
            };

        });

        receivedRequests = networkData.receivedRequests || [];
        sentRequests = networkData.sentRequests || [];

        // Newest requests first
        receivedRequests.sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        sentRequests.sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        renderNotifications();

        updateDashboard();

    } catch (error) {

        console.error("Network loading error:", error);

        const container = document.getElementById("notificationList");

        if (container) {
            container.innerHTML = `
                <p class="empty-message">
                    Unable to load connection requests:
                    ${escapeHTML(error.message)}
                </p>
            `;
        }

    }

}

// =====================================
// 18. ACCEPT / DECLINE CONNECTION REQUEST
// =====================================

async function respondToRequest(requestId, status) {

    try {

        await apiRequest(`/connections/request/${requestId}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        // Refresh from MongoDB after responding
        await refreshNetwork();

        if (status === "accepted") {
            alert("Connection accepted. You can now message this person.");
        }

    } catch (error) {

        console.error("Connection response error:", error);
        alert(error.message);

    }

}

// =====================================
// 19. NOTIFICATIONS
// =====================================

let generalNotifications = [
    {
        id: "welcome",
        title: "Welcome to ECHO",
        message: "Start exploring projects and discover the people behind new ideas.",
        read: false,
        createdAt: new Date()
    },
    {
        id: "projects",
        title: "Explore new projects",
        message: "Take a look at the latest ideas shared by the ECHO community.",
        read: false,
        createdAt: new Date()
    }
];

function renderNotifications() {

    const container = document.getElementById("notificationList");

    if (!container) return;

    const generalHTML = generalNotifications.map(note => `
        <div class="notification-card">

            <h3>${escapeHTML(note.title)}</h3>

            <p>${escapeHTML(note.message)}</p>

            <small>
                ${note.read ? "Read" : "Unread"}
            </small>

            ${
                note.read
                    ? ""
                    : `<button type="button"
                        data-action="read-notification"
                        data-id="${note.id}">
                        Mark as read
                    </button>`
            }

        </div>
    `).join("");

    const requestHTML = receivedRequests.length
        ? receivedRequests.map(request => {

            const person = request.requester || {};
            const date = request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : "";

            return `
                <div class="notification-card connection-request-card">

                    <h3>New connection request</h3>

                    <p>
                        <strong>${escapeHTML(person.name || "ECHO member")}</strong>
                        wants to connect with you.
                    </p>

                    <small>${escapeHTML(date)}</small>

                    <div class="notification-actions">

                        <button
                            type="button"
                            data-action="accept-request"
                            data-id="${request._id}">
                            Accept
                        </button>

                        <button
                            type="button"
                            data-action="decline-request"
                            data-id="${request._id}">
                            Decline
                        </button>

                    </div>

                </div>
            `;

        }).join("")
        : '<p class="empty-message">No new connection requests.</p>';

    const sentHTML = sentRequests.length
        ? `
            <h3>Sent requests</h3>
            ${sentRequests.map(request => `
                <div class="notification-card">
                    <p>
                        Connection request sent to
                        <strong>
                            ${escapeHTML(request.recipient?.name || "ECHO member")}
                        </strong>
                    </p>
                    <small>Waiting for response</small>
                </div>
            `).join("")}
        `
        : "";

    const connectionsHTML = connections.length
        ? `
            <h3>Your connections</h3>

            ${connections.map(connection => {

                const person = connection.person || {};

                return `
                    <div class="notification-card connection-card">

                        <h3>${escapeHTML(person.name || "ECHO member")}</h3>

                        <p>${escapeHTML(person.role || "Member")}</p>

                        <button
                            type="button"
                            data-action="open-chat"
                            data-id="${person._id}">
                            Message
                        </button>

                    </div>
                `;

            }).join("")}
        `
        : `
            <h3>Your connections</h3>
            <p class="empty-message">
                Accepted connections will appear here.
            </p>
        `;

    container.innerHTML = `
        <section class="general-notifications">
            <h3>Updates</h3>
            ${generalHTML}
        </section>

        <section class="connection-notifications">
            <h3>Connection requests</h3>
            ${requestHTML}
        </section>

        <section class="sent-connection-requests">
            ${sentHTML}
        </section>

        <section class="accepted-connections">
            ${connectionsHTML}
        </section>

        <section id="investorChatPanel" class="investor-chat-panel">

            <h3 id="chatName">Messages</h3>

            <p id="chatStatus">
                Select an accepted connection to start messaging.
            </p>

            <div id="chatMessages" class="chat-messages">
                <p class="empty-message">
                    Your conversation will appear here.
                </p>
            </div>

            <form id="investorMessageForm">

                <input
                    type="text"
                    id="investorMessageInput"
                    placeholder="Write a message..."
                    disabled
                    required
                >

                <button
                    type="submit"
                    id="investorSendMessageBtn"
                    disabled>
                    Send
                </button>

            </form>

        </section>
    `;

}

// =====================================
// 20. NOTIFICATION BUTTON HANDLING
// =====================================

const notificationList = document.getElementById("notificationList");

if (notificationList) {

    notificationList.addEventListener("click", async function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action === "accept-request") {
            await respondToRequest(id, "accepted");
        }

        if (action === "decline-request") {
            await respondToRequest(id, "rejected");
        }

        if (action === "read-notification") {

            generalNotifications = generalNotifications.map(note => {

                if (String(note.id) === String(id)) {
                    note.read = true;
                }

                return note;

            });

            renderNotifications();
            updateDashboard();

        }

        if (action === "open-chat") {
            await openChat(id);
        }

    });

}

// =====================================
// 21. OPEN CHAT
// =====================================

async function openChat(userId) {

    // Only accepted connections can open a chat
    const connection = connections.find(item =>
        String(item.person?._id) === String(userId)
    );

    if (!connection) {
        alert("You can message this person after accepting the connection request.");
        return;
    }

    try {

        selectedUserId = userId;

        const conversation = await apiRequest(
            `/messages/conversations/${userId}`,
            { method: "POST" }
        );

        selectedConversationId = conversation._id;

        const person = connection.person;

        document.getElementById("chatName").textContent =
            person.name || "Conversation";

        document.getElementById("chatStatus").textContent =
            "Connected";

        document.getElementById("investorMessageInput").disabled = false;
        document.getElementById("investorSendMessageBtn").disabled = false;

        await loadMessages();

        document.getElementById("investorChatPanel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        console.error("Opening chat failed:", error);
        alert(error.message);

    }

}

// =====================================
// 22. LOAD MESSAGES
// =====================================

async function loadMessages() {

    if (!selectedConversationId) return;

    try {

        chatMessages = await apiRequest(
            `/messages/${selectedConversationId}`
        );

        await apiRequest(
            `/messages/${selectedConversationId}/read`,
            { method: "PATCH" }
        );

        displayMessages();

    } catch (error) {

        console.error("Unable to load messages:", error);

    }

}

// =====================================
// 23. DISPLAY MESSAGES
// =====================================

function displayMessages() {

    const container = document.getElementById("chatMessages");

    if (!container) return;

    container.replaceChildren();

    if (!selectedConversationId) {

        container.innerHTML =
            '<p class="empty-message">Select a connection to start chatting.</p>';

        return;

    }

    if (!chatMessages || chatMessages.length === 0) {

        container.innerHTML =
            '<p class="empty-message">No messages yet. Start the conversation!</p>';

        return;

    }

    const currentUserId = sessionStorage.getItem("echoUserId");

    chatMessages.forEach(message => {

        const senderId = message.sender?._id || message.sender;

        const bubble = document.createElement("div");

        bubble.className =
            String(senderId) === String(currentUserId)
                ? "message-bubble sent"
                : "message-bubble received";

        const messageText = document.createElement("span");
        messageText.textContent = message.content || "";

        const time = document.createElement("small");
        time.className = "message-time";

        time.textContent = message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "";

        bubble.append(messageText, time);
        container.appendChild(bubble);

    });

    container.scrollTop = container.scrollHeight;

}

// =====================================
// 24. SEND MESSAGE
// =====================================

if (notificationList) {

    notificationList.addEventListener("submit", async function (event) {

        if (event.target.id !== "investorMessageForm") return;

        event.preventDefault();

        if (!selectedConversationId || !selectedUserId) return;

        // Extra frontend check: conversation must belong to an accepted connection
        const isConnected = connections.some(item =>
            String(item.person?._id) === String(selectedUserId)
        );

        if (!isConnected) {
            alert("You can only message accepted connections.");
            return;
        }

        const input = document.getElementById("investorMessageInput");
        const content = input.value.trim();

        if (!content) return;

        try {

            const result = await apiRequest(
                `/messages/${selectedConversationId}`,
                {
                    method: "POST",
                    body: JSON.stringify({ content })
                }
            );

            if (result.data) {
                chatMessages.push(result.data);
            }

            input.value = "";

            displayMessages();

        } catch (error) {

            console.error("Sending message failed:", error);
            alert(error.message);

        }

    });

}

// =====================================
// 25. UPDATE DASHBOARD COUNTS
// =====================================

function updateDashboard() {

    const projectCount = document.getElementById("projectCount");
    const interestCount = document.getElementById("interestCount");
    const notificationCount = document.getElementById("notificationCount");

    if (projectCount) {
        projectCount.textContent = projects.length;
    }

    if (interestCount) {
        interestCount.textContent = savedProjects.length;
    }

    const unreadGeneral = generalNotifications.filter(note =>
        !note.read
    ).length;

    const unreadRequests = receivedRequests.length;

    if (notificationCount) {
        notificationCount.textContent =
            unreadGeneral + unreadRequests;
    }

}

// =====================================
// 26. SIDEBAR NAVIGATION
// =====================================

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

function showPage(pageId) {

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    const selectedPage = document.getElementById(pageId);

    if (!selectedPage) return;

    selectedPage.classList.add("active-page");

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("data-page") === pageId) {
            link.classList.add("active");
        }

    });

    if (pageId === "interests") {
        showSavedProjects();
    }

    if (pageId === "notifications") {
        renderNotifications();
        updateDashboard();
    }

    if (pageId === "profile") {
        loadProfile();
    }

}

navLinks.forEach(link => {

    link.addEventListener("click", function () {

        showPage(this.getAttribute("data-page"));

    });

});

document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", function () {

        showPage(this.getAttribute("data-go"));

    });

});

// =====================================
// 27. WELCOME HEADING
// =====================================

const welcomeHeading = document.getElementById("welcomeHeading");

if (welcomeHeading) {

    const storedName = sessionStorage.getItem("investorAccount");

    if (storedName) {
        welcomeHeading.textContent = "Welcome, " + storedName;
    }

}

// =====================================
// 28. LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        if (!confirm("Are you sure you want to logout?")) return;

        sessionStorage.removeItem("investorLoggedIn");
        sessionStorage.removeItem("investorAccount");
        sessionStorage.removeItem("echoToken");
        sessionStorage.removeItem("echoUser");
        sessionStorage.removeItem("echoUserId");

        window.location.href = "investor-login.html";

    });

}

// =====================================
// 29. INITIALIZE DASHBOARD
// =====================================

async function initializeDashboard() {

    await Promise.all([
        fetchPublicProjects(),
        fetchSavedProjects(),
        refreshNetwork()
    ]);

    renderNotifications();
    updateDashboard();

}

initializeDashboard();