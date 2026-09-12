const API_BASE_URL = "http://localhost:5000";

const form = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");
const btn = document.getElementById("loginBtn");

// If already logged in, skip the login page entirely.
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("visible");
}
function hideError() {
  errorBox.classList.remove("visible");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showError("Please enter both email and password.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Logging in…";

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showError(data.message || "Invalid email or password.");
      return;
    }

    // Save token + basic profile for the rest of the app to use.
   localStorage.setItem("token", "logged-in");

localStorage.setItem(
    "user",
    JSON.stringify({
        user_id: data.user.user_id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
    })
);

    window.location.href = "dashboard.html";
  } catch (err) {
    showError("Can't reach the server. Is the backend running?");
  } finally {
    btn.disabled = false;
    btn.textContent = "Log In";
  }
});
