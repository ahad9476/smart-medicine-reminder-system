requireAuth();
document.getElementById("logoutBtn").addEventListener("click", logout);

const user = getCurrentUser();

const tableBody = document.getElementById("scheduleRows");
const backdrop = document.getElementById("scheduleModalBackdrop");
const form = document.getElementById("scheduleForm");
const modalTitle = document.getElementById("modalTitle");
const idField = document.getElementById("scheduleId");
const medicineField = document.getElementById("schedMedicine");
const timeField = document.getElementById("schedTime");
const frequencyField = document.getElementById("schedFrequency");
const dosageField = document.getElementById("schedDosage");
const instructionsField = document.getElementById("schedInstructions");

let schedules = [];
let medicines = [];

// ---------- Load + render ----------
async function loadMedicinesDropdown() {
  try {
    medicines = await apiFetch("/api/medicines");
    medicineField.innerHTML = medicines
      .map((m) => `<option value="${m.medicine_id}">${escapeHtml(m.name)}</option>`)
      .join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadSchedules() {
  tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Loading schedules…</td></tr>`;
  try {
    schedules = await apiFetch(`/api/schedules?user_id=${user.user_id}`);
    renderTable();
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function medicineName(medicine_id) {
  const med = medicines.find((m) => String(m.medicine_id) === String(medicine_id));
  return med ? med.name : `#${medicine_id}`;
}

function renderTable() {
  if (!schedules.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No schedules yet. Click "Add Schedule" to create one.</td></tr>`;
    return;
  }

  tableBody.innerHTML = schedules
    .map(
      (s) => `
      <tr data-id="${s.schedule_id}">
        <td>${escapeHtml(medicineName(s.medicine_id))}</td>
        <td>${escapeHtml(s.schedule_time)}</td>
        <td>${escapeHtml(s.frequency ?? "")}</td>
        <td>${escapeHtml(s.dosage_amount ?? "")}</td>
        <td>${escapeHtml(s.instructions ?? "")}</td>
        <td>
          <button class="btn-link edit-btn">Edit</button>
          <button class="btn-link danger delete-btn">Delete</button>
        </td>
      </tr>`
    )
    .join("");

  tableBody.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => openEditModal(e.target.closest("tr").dataset.id))
  );
  tableBody.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => deleteSchedule(e.target.closest("tr").dataset.id))
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Modal open/close ----------
function openAddModal() {
  modalTitle.textContent = "Add Schedule";
  form.reset();
  idField.value = "";
  backdrop.classList.add("open");
}

function openEditModal(id) {
  const sched = schedules.find((s) => String(s.schedule_id) === String(id));
  if (!sched) return;

  modalTitle.textContent = "Edit Schedule";
  idField.value = id;
  medicineField.value = sched.medicine_id;
  timeField.value = String(sched.schedule_time).slice(0, 5);
  frequencyField.value = sched.frequency ?? "daily";
  dosageField.value = sched.dosage_amount ?? "";
  instructionsField.value = sched.instructions ?? "";
  backdrop.classList.add("open");
}

function closeModal() {
  backdrop.classList.remove("open");
}

document.getElementById("openAddModal").addEventListener("click", openAddModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

// ---------- Create / Update ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    user_id: user.user_id,
    medicine_id: medicineField.value,
    schedule_time: `${timeField.value}:00`,
    frequency: frequencyField.value,
    dosage_amount: dosageField.value.trim(),
    instructions: instructionsField.value.trim(),
  };

  if (!payload.medicine_id || !timeField.value) {
    showToast("Medicine and time are required.", true);
    return;
  }

  const saveBtn = document.getElementById("saveScheduleBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    if (idField.value) {
      await apiFetch(`/api/schedules/${idField.value}`, {
        method: "PUT",
        body: JSON.stringify(payload), // already includes user_id
      });
      showToast("Schedule updated.");
    } else {
      await apiFetch("/api/schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Schedule added.");
    }
    closeModal();
    loadSchedules();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// ---------- Delete ----------
async function deleteSchedule(id) {
  if (!confirm("Delete this schedule? This cannot be undone.")) return;

  try {
    await apiFetch(`/api/schedules/${id}?user_id=${user.user_id}`, { method: "DELETE" });
    showToast("Schedule deleted.");
    loadSchedules();
  } catch (err) {
    showToast(err.message, true);
  }
}

(async function init() {
  await loadMedicinesDropdown();
  await loadSchedules();
})();
