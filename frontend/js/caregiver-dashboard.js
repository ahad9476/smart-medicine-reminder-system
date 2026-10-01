
requireAuth();

const user = getCurrentUser();

if (!user || user.role !== "caregiver") {
    window.location.href = "dashboard.html";
}

document.getElementById("logoutBtn")
    .addEventListener("click", logout);

document.getElementById("welcomeMessage").textContent =
    `Welcome, ${user.name}!`;

let selectedPatient = null;
let assignedPatients = [];

async function loadPatients() {
    const container = document.getElementById("patientList");

    container.textContent = "Loading patients...";

    try {
        assignedPatients = await apiFetch(
            `/api/caregiver/patients?caregiver_user_id=${user.user_id}`
        );

        if (!assignedPatients.length) {
            container.textContent =
                "No patients have been assigned to your account yet.";
            return;
        }

        container.innerHTML = "";

        assignedPatients.forEach(patient => {
            const card = document.createElement("div");

            card.className = "patient-card";

            card.innerHTML = `
                <h3>${escapeHtml(patient.patient_name)}</h3>
                <p>${escapeHtml(patient.patient_email)}</p>
                <p>Relationship: ${
                    escapeHtml(patient.relationship || "Caregiver")
                }</p>
            `;

            card.addEventListener("click", () => {
                selectPatient(patient, card);
            });

            container.appendChild(card);
        });

    } catch (err) {
        container.textContent = err.message;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function selectPatient(patient, card) {
    selectedPatient = patient;

    document.querySelectorAll(".patient-card")
        .forEach(item => item.classList.remove("selected"));

    card.classList.add("selected");

    await loadPatientOverview();
}

async function loadPatientOverview() {
    if (!selectedPatient) return;

    const patientId = selectedPatient.patient_id;

    document.getElementById("patientTitle").textContent =
        `${selectedPatient.patient_name}'s Overview`;

    document.getElementById("patientDetails").textContent =
        `Patient email: ${selectedPatient.patient_email}`;

    try {
        const data = await apiFetch(
            `/api/caregiver/patients/${patientId}?caregiver_user_id=${user.user_id}`
        );

        renderSchedules(data.schedules, patientId);
        renderInventory(data.inventory);

    } catch (err) {
        showToast(err.message, true);
    }
}

function renderSchedules(schedules, patientId) {
    const container = document.getElementById("scheduleList");

    if (!schedules.length) {
        container.textContent =
            "No medication schedules found.";
        return;
    }

    container.innerHTML = "";

    schedules.forEach(item => {
        const row = document.createElement("div");

        row.style.padding = "14px 0";
        row.style.borderBottom = "1px solid var(--border)";

        const status = item.status || "pending";

        row.innerHTML = `
            <strong>${escapeHtml(item.medicine_name)}</strong>

            <p>
                Time: ${escapeHtml(item.schedule_time)}
            </p>

            <p>
                Dosage: ${escapeHtml(item.dosage_amount || item.dosage || "Not specified")}
            </p>

            <span class="status ${status}">
                ${escapeHtml(status)}
            </span>

            ${
                status === "pending"
                    ? `
                    <div style="margin-top:10px">
                        <button class="dose-button take">
                            Mark Taken
                        </button>

                        <button class="dose-button skip">
                            Skip
                        </button>
                    </div>
                    `
                    : ""
            }
        `;

        const takeButton = row.querySelector(".take");
        const skipButton = row.querySelector(".skip");

        if (takeButton) {
            takeButton.addEventListener("click", () => {
                showToast(
                    "Dose actions require the caregiver-authorized endpoint."
                );
            });
        }

        if (skipButton) {
            skipButton.addEventListener("click", () => {
                showToast(
                    "Dose actions require the caregiver-authorized endpoint."
                );
            });
        }

        container.appendChild(row);
    });
}

function renderInventory(inventory) {
    const container = document.getElementById("inventoryList");

    if (!inventory.length) {
        container.textContent = "No inventory records found.";
        return;
    }

    container.innerHTML = "";

    inventory.forEach(item => {
        const row = document.createElement("div");

        row.style.padding = "12px 0";
        row.style.borderBottom = "1px solid var(--border)";

        const lowStock = Number(item.quantity) <= 3;

        row.innerHTML = `
            <strong>${escapeHtml(item.medicine_name)}</strong>
            <p>Available quantity: ${item.quantity}</p>
            <p>Expiry: ${escapeHtml(item.expiry_date || "Not recorded")}</p>
            ${
                lowStock
                    ? '<span class="status missed">Low Stock</span>'
                    : '<span class="status taken">Available</span>'
            }
        `;

        container.appendChild(row);
    });
}

loadPatients();