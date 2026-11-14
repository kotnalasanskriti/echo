
// =============================================
// ECHO - INNOVATOR NETWORK
// MongoDB + Express + JWT Integration
// =============================================


// 1. AUTHENTICATION

const email = sessionStorage.getItem("innovatorEmail");
const token = sessionStorage.getItem("echoToken");

if (!email || !token) {
    window.location.href = "innovator-login.html";
}

let currentUser = null;


// 2. API CONFIGURATION

const API_URL = "http://localhost:5000/api";

let investors = [];
let connections = [];
let receivedRequests = [];
let sentRequests = [];

let selectedInvestorId = null;
let selectedConversationId = null;
let chatMessages = [];


// 3. API HELPER

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}


// 4. CURRENT USER PROFILE

async function loadCurrentUser() {

    const data = await apiRequest("/users/profile");

    currentUser = data.user;

    document.getElementById("userName").textContent =
        currentUser.name;

    document.getElementById("userAvatar").textContent =
        currentUser.name.charAt(0).toUpperCase();
}


// 5. LOGOUT

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


// 6. EXISTING PITCH STORAGE

const pitchKey = "innovatorPitch_" + email;
const projectKey = "innovatorProjects_" + email;

let projects = JSON.parse(
    localStorage.getItem(projectKey) || "[]"
);

let savedPitch = JSON.parse(
    localStorage.getItem(pitchKey) || "{}"
);


// =============================================
// NETWORK
// =============================================


// 7. UPDATE STATISTICS

function updateStats() {

    document.getElementById("investorCount").textContent =
        investors.length;

    document.getElementById("connectionCount").textContent =
        connections.length;

    document.getElementById("pendingCount").textContent =
        receivedRequests.length + sentRequests.length;

}


// 8. FIND INVESTORS

function displayInvestors() {

    const grid = document.getElementById("investorGrid");

    grid.replaceChildren();

    const search = document.getElementById("investorSearch")
        .value.trim().toLowerCase();

    const filtered = investors.filter(person => {

        const name = (person.name || "").toLowerCase();
        const personEmail = (person.email || "").toLowerCase();

        return name.includes(search) ||
            personEmail.includes(search);

    });

    const empty = document.getElementById("investorEmpty");

    empty.classList.toggle("hidden", filtered.length !== 0);

    if (filtered.length === 0) {
        empty.textContent = search
            ? "No matching members found."
            : "No investors available yet.";
    }

    filtered.forEach(person => {

        const card = document.createElement("article");
        card.className = "investor-card";

        const top = document.createElement("div");
        top.className = "investor-card-top";

        const avatar = document.createElement("div");
        avatar.className = "investor-avatar";
        avatar.textContent =
            (person.name || "?").charAt(0).toUpperCase();

        const info = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = person.name;

        const role = document.createElement("small");
        role.textContent = person.role;

        info.append(name, role);
        top.append(avatar, info);

        const description = document.createElement("p");
        description.textContent = person.email;

        const category = document.createElement("span");
        category.className = "investor-industry";
        category.textContent = "ECHO Member";

        const button = document.createElement("button");

        const isConnected = connections.some(
            item => item.person._id === person._id
        );

        const isSent = sentRequests.some(
            item => item.recipient._id === person._id
        );

        const isReceived = receivedRequests.some(
            item => item.requester._id === person._id
        );

        if (isConnected) {

            button.textContent = "Connected ✓";
            button.className = "secondary-btn";
            button.disabled = true;

        } else if (isSent) {

            button.textContent = "Request Sent";
            button.className = "secondary-btn";
            button.disabled = true;

        } else if (isReceived) {

            button.textContent = "Request Received";
            button.className = "secondary-btn";
            button.disabled = true;

        } else {

            button.textContent = "Connect →";
            button.className = "primary-btn";

            button.addEventListener("click", () => {
                sendRequest(person._id);
            });

        }

        card.append(top, description, category, button);

        grid.appendChild(card);

    });

}


// 9. SEND CONNECTION REQUEST

async function sendRequest(userId) {

    try {

        await apiRequest(`/connections/request/${userId}`, {
            method: "POST"
        });

        alert("Your connection request has been sent!");

        await refreshNetwork();

    } catch (error) {

        alert(error.message);

    }

}


// 10. DISPLAY CONNECTIONS

function displayConnections() {

    const list = document.getElementById("connectionList");

    list.replaceChildren();

    if (connections.length === 0) {

        showEmptyMessage(
            list,
            "You haven't connected with anyone yet."
        );

        return;
    }

    connections.forEach(item => {

        const person = item.person;

        const row = createPersonRow(person);

        const messageButton = createButton(
            "Message",
            "small-btn",
            () => openChat(person._id)
        );

        row.querySelector(".row-actions").append(messageButton);

        list.appendChild(row);

    });

}


// 11. DISPLAY CONNECTION REQUESTS

function displayRequests() {

    const list = document.getElementById("pendingList");

    list.replaceChildren();

    if (
        receivedRequests.length === 0 &&
        sentRequests.length === 0
    ) {

        showEmptyMessage(list, "No pending requests.");

        return;
    }

    receivedRequests.forEach(item => {

        const row = createPersonRow(item.requester);

        const acceptButton = createButton(
            "Accept",
            "small-btn",
            () => respondToRequest(item._id, "accepted")
        );

        const rejectButton = createButton(
            "Decline",
            "small-btn danger",
            () => respondToRequest(item._id, "rejected")
        );

        row.querySelector(".row-actions").append(
            acceptButton,
            rejectButton
        );

        list.appendChild(row);

    });

    sentRequests.forEach(item => {

        const row = createPersonRow(item.recipient);

        const status = document.createElement("small");
        status.textContent = "Request sent";

        row.querySelector(".row-actions").appendChild(status);

        list.appendChild(row);

    });

}


// 12. ACCEPT OR DECLINE REQUEST

async function respondToRequest(requestId, status) {

    try {

        await apiRequest(`/connections/request/${requestId}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        await refreshNetwork();

    } catch (error) {

        alert(error.message);

    }

}


// 13. CREATE PERSON ROW

function createPersonRow(person) {

    const row = document.createElement("div");
    row.className = "person-row";

    const avatar = document.createElement("div");
    avatar.className = "person-avatar";
    avatar.textContent =
        (person.name || "?").charAt(0).toUpperCase();

    const info = document.createElement("div");
    info.className = "person-info";

    const name = document.createElement("strong");
    name.textContent = person.name;

    const role = document.createElement("small");
    role.textContent =
        (person.role || "ECHO Member") +
        " • " +
        (person.email || "");

    info.append(name, role);

    const actions = document.createElement("div");
    actions.className = "row-actions";

    row.append(avatar, info, actions);

    return row;

}


// 14. COMMON HELPERS

function createButton(text, className, action) {

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = className;

    button.addEventListener("click", action);

    return button;

}


function showEmptyMessage(parent, text) {

    const message = document.createElement("p");

    message.className = "details-placeholder";
    message.textContent = text;

    parent.appendChild(message);

}


// =============================================
// MESSAGING
// =============================================


// 15. DISPLAY MESSAGE CONTACTS

function displayMessagePeople() {

    const list = document.getElementById("messagePeople");

    list.replaceChildren();

    if (connections.length === 0) {

        showEmptyMessage(
            list,
            "Connect with an investor to start messaging."
        );

        return;
    }

    connections.forEach(item => {

        const person = item.person;

        const button = document.createElement("button");

        button.className = "message-person";

        if (selectedInvestorId === person._id) {
            button.classList.add("active");
        }

        const avatar = document.createElement("div");
        avatar.className = "person-avatar";
        avatar.textContent =
            (person.name || "?").charAt(0).toUpperCase();

        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = person.name;

        const role = document.createElement("small");
        role.textContent = person.role;

        info.append(name, role);

        button.append(avatar, info);

        button.addEventListener("click", () => {
            openChat(person._id);
        });

        list.appendChild(button);

    });

}


// 16. OPEN CONVERSATION

async function openChat(userId) {

    const connection = connections.find(
        item => item.person._id === userId
    );

    if (!connection) return;

    try {

        selectedInvestorId = userId;

        const result = await apiRequest(
            `/messages/conversations/${userId}`,
            { method: "POST" }
        );

        const conversation = result.conversation || result;

        selectedConversationId = conversation._id;

        document.getElementById("chatName").textContent =
            connection.person.name;

        document.getElementById("chatStatus").textContent =
            connection.person.role;

        document.getElementById("chatAvatar").textContent =
            connection.person.name.charAt(0).toUpperCase();

        document.getElementById("messageInput").disabled = false;

        document.getElementById("sendMessageBtn").disabled = false;

        displayMessagePeople();

        await loadMessages();

    } catch (error) {

        alert(error.message);

    }

}


// 17. LOAD MESSAGES

async function loadMessages() {

    if (!selectedConversationId) return;

    try {

        const result = await apiRequest(
            `/messages/${selectedConversationId}`
        );

        chatMessages = Array.isArray(result)
            ? result
            : result.messages || [];

        displayMessages();

        await apiRequest(
            `/messages/${selectedConversationId}/read`,
            { method: "PATCH" }
        );

    } catch (error) {

        console.error("Unable to load messages:", error);

    }

}


// 18. DISPLAY MESSAGES

function displayMessages() {

    const chat = document.getElementById("chatMessages");

    chat.replaceChildren();

    if (!selectedConversationId) {

        showEmptyMessage(
            chat,
            "Select a connection to start a conversation."
        );

        return;
    }

    if (chatMessages.length === 0) {

        showEmptyMessage(
            chat,
            "No messages yet. Start the conversation!"
        );

        return;
    }

    chatMessages.forEach(message => {

        const bubble = document.createElement("div");

        const senderId = message.sender?._id || message.sender;

        bubble.className =
            String(senderId) === String(currentUser._id)
                ? "message-bubble sent"
                : "message-bubble received";

        const text = document.createElement("span");
        text.textContent = message.content;

        const time = document.createElement("small");
        time.className = "message-time";

        time.textContent = new Date(
            message.createdAt
        ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        bubble.append(text, time);

        chat.appendChild(bubble);

    });

    chat.scrollTop = chat.scrollHeight;

}


// 19. SEND MESSAGE

document.getElementById("messageForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        if (!selectedConversationId) return;

        const input = document.getElementById("messageInput");

        const content = input.value.trim();

        if (!content) return;

        const sendButton = document.getElementById("sendMessageBtn");

        sendButton.disabled = true;

        try {

            await apiRequest(
                `/messages/${selectedConversationId}`,
                {
                    method: "POST",
                    body: JSON.stringify({ content })
                }
            );

            input.value = "";

            await loadMessages();

        } catch (error) {

            alert(error.message);

        } finally {

            sendButton.disabled = false;

        }

    }
);


// =============================================
// PITCH ROOM
// Original localStorage functionality preserved
// =============================================


// 20. PROJECT DROPDOWN

const pitchProject = document.getElementById("pitchProject");

projects.forEach(project => {

    const option = document.createElement("option");

    option.value = project.id;

    option.textContent = project.title;

    pitchProject.appendChild(option);

});


// 21. LOAD SAVED PITCH

function loadPitch() {

    if (!savedPitch.projectId) return;

    pitchProject.value = savedPitch.projectId;

    document.getElementById("pitchTagline").value =
        savedPitch.tagline || "";

    document.getElementById("pitchProblem").value =
        savedPitch.problem || "";

    document.getElementById("pitchSolution").value =
        savedPitch.solution || "";

    document.getElementById("pitchMarket").value =
        savedPitch.market || "";

    document.getElementById("pitchAsk").value =
        savedPitch.ask || "";

    updatePitchPreview();

}


// 22. UPDATE PITCH PREVIEW

function updatePitchPreview() {

    const project = projects.find(item =>
        String(item.id) === String(pitchProject.value)
    );

    document.getElementById("previewTitle").textContent =
        project ? project.title : "Your idea.\nYour vision.";

    document.getElementById("previewTagline").textContent =
        document.getElementById("pitchTagline").value ||
        "Your one-line pitch will appear here.";

    document.getElementById("previewProblem").textContent =
        document.getElementById("pitchProblem").value ||
        "Your problem statement will appear here.";

    document.getElementById("previewSolution").textContent =
        document.getElementById("pitchSolution").value ||
        "Your solution will appear here.";

    document.getElementById("previewMarket").textContent =
        document.getElementById("pitchMarket").value ||
        "Your target audience will appear here.";

    document.getElementById("previewAsk").textContent =
        document.getElementById("pitchAsk").value ||
        "Your requirements will appear here.";

}


// 23. LIVE PITCH PREVIEW

[
    "pitchProject",
    "pitchTagline",
    "pitchProblem",
    "pitchSolution",
    "pitchMarket",
    "pitchAsk"
].forEach(id => {

    document.getElementById(id).addEventListener(
        "input",
        updatePitchPreview
    );

    document.getElementById(id).addEventListener(
        "change",
        updatePitchPreview
    );

});


// 24. SAVE PITCH

document.getElementById("pitchForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const pitch = {

            projectId: pitchProject.value,

            tagline: document.getElementById("pitchTagline")
                .value.trim(),

            problem: document.getElementById("pitchProblem")
                .value.trim(),

            solution: document.getElementById("pitchSolution")
                .value.trim(),

            market: document.getElementById("pitchMarket")
                .value.trim(),

            ask: document.getElementById("pitchAsk")
                .value.trim()

        };

        if (!pitch.projectId) {

            alert("Please select a project.");

            return;

        }

        savedPitch = pitch;

        localStorage.setItem(
            pitchKey,
            JSON.stringify(pitch)
        );

        document.getElementById("pitchMessage").textContent =
            "Your pitch has been saved successfully!";

        updatePitchPreview();

    }
);


// =============================================
// SEARCH
// =============================================


// 25. INVESTOR SEARCH

document.getElementById("investorSearch").addEventListener(
    "input",
    displayInvestors
);


// =============================================
// NETWORK DATA
// =============================================


// 26. FETCH NETWORK DATA

async function refreshNetwork() {

    const [userData, networkData] = await Promise.all([

        apiRequest("/connections/users"),

        apiRequest("/connections")

    ]);

    investors = Array.isArray(userData)
        ? userData
        : userData.users || [];

    const accepted = networkData.connections || [];

    connections = accepted.map(item => {

        const requesterId =
            item.requester?._id || item.requester;

        const person =
            String(requesterId) === String(currentUser._id)
                ? item.recipient
                : item.requester;

        return {
            ...item,
            person
        };

    });

    receivedRequests = networkData.receivedRequests || [];

    sentRequests = networkData.sentRequests || [];

    updateStats();

    displayInvestors();

    displayConnections();

    displayRequests();

    displayMessagePeople();

}


// =============================================
// INITIALIZATION
// =============================================


// 27. INITIAL PAGE LOAD

async function initializeNetwork() {

    try {

        await loadCurrentUser();

        await refreshNetwork();

        loadPitch();

        updatePitchPreview();

    } catch (error) {

        console.error("Network initialization failed:", error);

        document.getElementById("investorEmpty").classList.remove("hidden");

        document.getElementById("investorEmpty").textContent =
            "Unable to load network: " + error.message;

    }

}

initializeNetwork();
