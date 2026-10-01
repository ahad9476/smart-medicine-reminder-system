
requireAuth();

document.getElementById("logoutBtn")
    .addEventListener("click", logout);

const user = getCurrentUser();

const tableBody = document.getElementById("caregiverRows");
const backdrop = document.getElementById("caregiverModalBackdrop");
const form = document.getElementById("caregiverForm");

const relationshipField = document.getElementById("cgRelationship");
const emailField = document.getElementById("cgEmail");
const phoneField = document.getElementById("cgPhone");

async function loadCaregivers() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="5">Loading caregivers...</td>
        </tr>
    `;

    try {
        const caregivers = await apiFetch(
            `/api/caregivers?user_id=${encodeURIComponent(user.user_id)}`
        );

        renderTable(caregivers);
    } catch (err) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">${escapeHtml(err.message)}</td>
            </tr>
        `;
    }
}

function renderTable(caregivers) {
    if (!caregivers.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No caregiver accounts assigned yet.
                    Click Assign Caregiver to add one.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = caregivers.map(c => `
        <tr data-assignment-id="${c.assignment_id}">
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.relationship || "")}</td>
            <td>${escapeHtml(c.account_email || c.email || "")}</td>
            <td>${escapeHtml(c.phone || "")}</td>
            <td>
                <button class="btn-link danger remove-btn">
                    Remove
                </button>
            </td>
        </tr>
    `).join("");

    tableBody.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const row = e.target.closest("tr");
            removeCaregiver(row.dataset.assignmentId);
        });
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function openModal() {
    form.reset();
    backdrop.classList.add("open");
}

function closeModal() {
    backdrop.classList.remove("open");
}

document.getElementById("openAddModal")
    .addEventListener("click", openModal);

document.getElementById("cancelModal")
    .addEventListener("click", closeModal);

backdrop.addEventListener("click", e => {
    if (e.target === backdrop) {
        closeModal();
    }
});

form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = {
        user_id: user.user_id,
        email: emailField.value.trim().toLowerCase(),
        relationship: relationshipField.value.trim(),
        phone: phoneField.value.trim()
    };

    if (!payload.email) {
        return showToast("Caregiver email is required.", true);
    }

    const saveBtn = document.getElementById("saveCaregiverBtn");

    saveBtn.disabled = true;
    saveBtn.textContent = "Assigning...";

    try {
        const result = await apiFetch("/api/caregivers", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showToast(result.message || "Caregiver assigned successfully.");

        closeModal();

        await loadCaregivers();

    } catch (err) {
        showToast(err.message, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Assign";
    }
});

async function removeCaregiver(assignmentId) {
    if (!confirm("Remove this caregiver assignment?")) {
        return;
    }

    try {
        await apiFetch(
            `/api/caregivers/assignment/${assignmentId}?user_id=${encodeURIComponent(user.user_id)}`,
            { method: "DELETE" }
        );

        showToast("Caregiver assignment removed.");

        await loadCaregivers();

    } catch (err) {
        showToast(err.message, true);
    }
}

loadCaregivers();