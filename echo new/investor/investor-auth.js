
const API_URL = "http://localhost:5000/api/users";

// SIGN UP PAGE

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("signupMessage");

        if (password !== confirmPassword) {
            message.style.color = "red";
            message.textContent = "Passwords do not match.";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: "investor"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            message.style.color = "green";
            message.textContent = "Account created successfully! Redirecting to login...";

            setTimeout(function() {
                window.location.href = "investor-login.html";
            }, 1200);

        } catch (error) {
            message.style.color = "red";
            message.textContent = error.message || "Unable to connect to the server.";
        }
    });
}


// LOGIN PAGE

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const rememberedEmail = localStorage.getItem("investorRememberedEmail");

    if (rememberedEmail) {
        document.getElementById("loginEmail").value = rememberedEmail;
        document.getElementById("rememberMe").checked = true;
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const rememberMe = document.getElementById("rememberMe").checked;
        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    role: "investor"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            // Store authentication details
            sessionStorage.setItem("echoToken", data.token);
            sessionStorage.setItem("echoUser", JSON.stringify(data.user));

            // Investor compatibility keys
            sessionStorage.setItem("investorLoggedIn", "true");
            sessionStorage.setItem("investorAccount", data.user.name);

            if (rememberMe) {
                localStorage.setItem("investorRememberedEmail", email);
            } else {
                localStorage.removeItem("investorRememberedEmail");
            }

            message.style.color = "green";
            message.textContent = "Login successful! Opening your dashboard...";

            setTimeout(function() {
                window.location.href = "investor-dashboard.html";
            }, 1000);

        } catch (error) {
            message.style.color = "red";
            message.textContent = error.message || "Unable to connect to the server.";
        }
    });
}


// FORGOT PASSWORD PAGE

const forgotForm = document.getElementById("forgotForm");

if (forgotForm) {
    forgotForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const message = document.getElementById("forgotMessage");

        message.style.color = "red";
        message.textContent = "Password reset is not available yet.";
    });
}
