requireAuth();
document.getElementById("logoutBtn").addEventListener("click", logout);

const tableBody = document.getElementById("medicineRows");
const backdrop = document.getElementById("medicineModalBackdrop");
const form = document.getElementById("medicineForm");
const modalTitle = document.getElementById("modalTitle");
const idField = document.getElementById("medicineId");
const nameField = document.getElementById("medName");
const dosageField = document.getElementById("medDosage");
const descField = document.getElementById("medDescription");

let medicines = [];

// ---------- Load + render ----------
async function loadMedicines() {
  tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Loading medicines…</td></tr>`;
  try {
    medicines = await apiFetch("/api/medicines");
    renderTable();
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderTable() {
  if (!medicines.length) {
    tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No medicines yet. Click "Add Medicine" to create one.</td></tr>`;
    return;
  }

  tableBody.innerHTML = medicines
    .map(
      (m) => `
      <tr data-id="${m.medicine_id ?? m.id}">
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.dosage ?? m.dosage_form ?? "")}</td>
        <td>${escapeHtml(m.description ?? m.instructions ?? "")}</td>
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
    btn.addEventListener("click", (e) => deleteMedicine(e.target.closest("tr").dataset.id))
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Modal open/close ----------
function openAddModal() {
  modalTitle.textContent = "Add Medicine";
  form.reset();
  idField.value = "";
  backdrop.classList.add("open");
  nameField.focus();
}

function openEditModal(id) {
  const med = medicines.find((m) => String(m.medicine_id ?? m.id) === String(id));
  if (!med) return;

  modalTitle.textContent = "Edit Medicine";
  idField.value = id;
  nameField.value = med.name ?? "";
  dosageField.value = med.dosage ?? med.dosage_form ?? "";
  descField.value = med.description ?? med.instructions ?? "";
  backdrop.classList.add("open");
  nameField.focus();
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

const user = getCurrentUser();

const payload = {
    user_id: user.user_id,
    name: nameField.value.trim(),
    dosage: dosageField.value.trim(),
    description: descField.value.trim()
};

  if (!payload.name || !payload.dosage) {
    showToast("Name and dosage are required.", true);
    return;
  }

  const saveBtn = document.getElementById("saveMedicineBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    if (idField.value) {
      await apiFetch(`/api/medicines/${idField.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Medicine updated.");
    } else {
      await apiFetch("/api/medicines", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Medicine added.");
    }
    closeModal();
    loadMedicines();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// ---------- Delete ----------
async function deleteMedicine(id) {
  if (!confirm("Delete this medicine? This cannot be undone.")) return;

  try {
    await apiFetch(`/api/medicines/${id}`, { method: "DELETE" });
    showToast("Medicine deleted.");
    loadMedicines();
  } catch (err) {
    showToast(err.message, true);
  }
}

loadMedicines();
