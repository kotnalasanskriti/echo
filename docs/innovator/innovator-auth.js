
// ==================================
// ECHO INNOVATOR AUTHENTICATION
// Connected to Node.js + Express
// ==================================

const API_URL = "https://echo-5122.onrender.com/api/users";

// ==================================
// 1. LOGIN
// ==================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const errorMessage = document.getElementById("errorMessage");
    const rememberMe = document.getElementById("rememberMe");
    const loginButton = loginForm.querySelector('button[type="submit"]');

    if (togglePassword) {
        togglePassword.addEventListener("click", function () {
            const showing = passwordInput.type === "password";
            passwordInput.type = showing ? "text" : "password";
            togglePassword.textContent = showing ? "Hide" : "Show";
        });
    }

    // Restore remembered email
    const savedEmail = localStorage.getItem("innovatorRememberedEmail");

    if (savedEmail && emailInput && rememberMe) {
        emailInput.value = savedEmail;
        rememberMe.checked = true;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorMessage.textContent = "";

        if (!email || !emailInput.checkValidity()) {
            errorMessage.textContent = "Please enter a valid email address.";
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = "Password must contain at least 6 characters.";
            return;
        }

        if (rememberMe && rememberMe.checked) {
            localStorage.setItem("innovatorRememberedEmail", email);
        } else {
            localStorage.removeItem("innovatorRememberedEmail");
        }

        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: "innovator"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            // Save authentication details
            sessionStorage.setItem("echoToken", data.token);
            sessionStorage.setItem("echoUser", JSON.stringify(data.user));

            // Preserve existing frontend session keys
            sessionStorage.setItem("innovatorLoggedIn", "true");
            sessionStorage.setItem("innovatorEmail", data.user.email);
            sessionStorage.setItem("innovatorName", data.user.name);

            const profileCompleted = localStorage.getItem(
                "innovatorProfileCompleted_" + data.user.email
            );

            if (profileCompleted === "true") {
                window.location.href = "innovator-dashboard.html";
            } else {
                window.location.href = "innovator-onboarding.html";
            }

        } catch (error) {
            errorMessage.textContent = error.message || "Unable to connect to ECHO server.";
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Sign In";
        }
    });
}


// ==================================
// 2. SIGNUP
// ==================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    const fullName = document.getElementById("fullName");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const signupError = document.getElementById("signupError");
    const terms = document.getElementById("terms");
    const signupButton = signupForm.querySelector('button[type="submit"]');

    // Show/hide password helper
    function setupPasswordToggle(input, button) {
        if (!input || !button) return;

        button.addEventListener("click", function () {
            const showing = input.type === "password";
            input.type = showing ? "text" : "password";
            button.textContent = showing ? "Hide" : "Show";
        });
    }

    setupPasswordToggle(
        signupPassword,
        document.getElementById("toggleSignupPassword")
    );

    setupPasswordToggle(
        confirmPassword,
        document.getElementById("toggleConfirmPassword")
    );

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = fullName.value.trim();
        const email = signupEmail.value.trim().toLowerCase();
        const password = signupPassword.value;
        const confirm = confirmPassword.value;

        signupError.textContent = "";

        // Validate name
        if (name.length < 2) {
            signupError.textContent = "Please enter your full name.";
            return;
        }

        // Validate email
        if (!signupEmail.checkValidity()) {
            signupError.textContent = "Please enter a valid email address.";
            return;
        }

        // Validate password
        if (password.length < 6) {
            signupError.textContent = "Password must contain at least 6 characters.";
            return;
        }

        // Confirm password
        if (password !== confirm) {
            signupError.textContent = "Passwords do not match.";
            return;
        }

        // Accept terms
        if (!terms.checked) {
            signupError.textContent = "Please accept the Terms and Conditions.";
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    role: "innovator"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            // Save JWT and user details
            sessionStorage.setItem("echoToken", data.token);
            sessionStorage.setItem("echoUser", JSON.stringify(data.user));

            // Preserve existing frontend session keys
            sessionStorage.setItem("innovatorLoggedIn", "true");
            sessionStorage.setItem("innovatorEmail", data.user.email);
            sessionStorage.setItem("innovatorName", data.user.name);

            alert("Welcome to ECHO! Your account has been created.");

            window.location.href = "innovator-onboarding.html";

        } catch (error) {
            signupError.textContent = error.message || "Unable to connect to ECHO server.";
        } finally {
            signupButton.disabled = false;
            signupButton.textContent = "Create Account";
        }
    });
}


// ==================================
// 3. FORGOT PASSWORD
// Demo message for now
// ==================================

const forgotForm = document.getElementById("forgotForm");

if (forgotForm) {
    const forgotEmail = document.getElementById("forgotEmail");
    const forgotError = document.getElementById("forgotError");
    const forgotSuccess = document.getElementById("forgotSuccess");

    forgotForm.addEventListener("submit", function (event) {
        event.preventDefault();

        forgotError.textContent = "";
        forgotSuccess.textContent = "";

        if (!forgotEmail.checkValidity()) {
            forgotError.textContent = "Please enter a valid email address.";
            return;
        }

        forgotSuccess.textContent =
            "If an account exists with this email, password recovery instructions will be provided once email recovery is connected.";

        forgotForm.reset();
    });
}
