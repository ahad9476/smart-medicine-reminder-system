requireAuth();

const user = getCurrentUser();

if (!user) {
    window.location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);

const nameField = document.getElementById("profileName");
const emailField = document.getElementById("profileEmail");
const phoneField = document.getElementById("profilePhone");
const saveButton = document.getElementById("saveProfileBtn");


async function loadProfile() {
    try {
        const profile = await apiFetch(
            `/api/profile?user_id=${user.user_id}`
        );

        nameField.value = profile.name || "";
        emailField.value = profile.email || "";
        phoneField.value = profile.phone || "";

    } catch (err) {
        showToast(err.message, true);
    }
}


async function saveProfile() {
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const phone = phoneField.value.trim();

    if (!name) {
        showToast("Name is required.", true);
        return;
    }

    if (!email) {
        showToast("Email is required.", true);
        return;
    }

    if (phone.length > 20) {
        showToast("Phone number cannot exceed 20 characters.", true);
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const result = await apiFetch("/api/profile", {
            method: "PUT",
            body: JSON.stringify({
                user_id: user.user_id,
                name: name,
                email: email,
                phone: phone
            })
        });

        showToast(result.message || "Profile updated successfully.");

        // Keep localStorage user information updated
        user.name = name;
        user.email = email;

        localStorage.setItem("user", JSON.stringify(user));

    } catch (err) {
        showToast(err.message, true);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
}


saveButton.addEventListener("click", saveProfile);

loadProfile();