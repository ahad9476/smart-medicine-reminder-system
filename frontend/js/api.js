// ---------------------------------------------------------------
// Shared config + helpers used by every page.
// Change API_BASE_URL to wherever your backend actually runs.
// ---------------------------------------------------------------
const API_BASE_URL = "http://localhost:5000";

/**
 * apiFetch: a thin wrapper around fetch() that
 *  - always sends the JWT token (if we have one)
 *  - always sends/expects JSON
 *  - redirects to login.html if the token is missing/expired (401)
 *  - throws a normal Error with a readable message on failure
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

/** Guard for pages that require login. Call at the top of dashboard/medicines JS. */
function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}

/** Returns the logged-in user's saved profile, or null. */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/** Small toast helper shared across pages. */
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("visible"), 3000);
}
