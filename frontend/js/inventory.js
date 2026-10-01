requireAuth();
document.getElementById("logoutBtn").addEventListener("click", logout);

const user = getCurrentUser();

const LOW_STOCK_THRESHOLD = 3; // keep in sync with backend/controllers/inventoryController.js

const tableBody = document.getElementById("inventoryRows");
const backdrop = document.getElementById("inventoryModalBackdrop");
const form = document.getElementById("inventoryForm");
const medicineField = document.getElementById("invMedicine");
const quantityField = document.getElementById("invQuantity");
const expiryField = document.getElementById("invExpiry");

let medicines = [];

async function loadMedicinesDropdown() {
  try {
    medicines = await apiFetch(`/api/medicines?user_id=${user.user_id}`);
    medicineField.innerHTML = medicines
      .map((m) => `<option value="${m.medicine_id}">${escapeHtml(m.name)}</option>`)
      .join("");
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadInventory() {
  tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Loading inventory…</td></tr>`;
  try {
    const rows = await apiFetch(`/api/inventory?user_id=${user.user_id}`);
    renderTable(rows);
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderTable(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No inventory records yet. Click "Set / Restock" to add one.</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows
    .map((r) => {
      const isLow = r.quantity <= LOW_STOCK_THRESHOLD;
      const statusLabel = r.quantity <= 0 ? "Out of stock" : isLow ? "Low stock" : "OK";
      return `
      <tr>
        <td>${escapeHtml(r.medicine_name)}</td>
        <td>${r.quantity}</td>
        <td>${escapeHtml(r.expiry_date ?? "")}</td>
        <td><span class="status-tag ${isLow ? "low" : "ok"}">${statusLabel}</span></td>
        <td>
          <button class="btn-link edit-btn" data-medicine-id="${r.medicine_id}" data-quantity="${r.quantity}" data-expiry="${r.expiry_date ?? ""}">Update</button>
          <button class="btn-link refill-btn" data-medicine-id="${r.medicine_id}" data-medicine-name="${escapeHtml(r.medicine_name)}">Refill</button>
        </td>
      </tr>`;
    })
    .join("");

  tableBody.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const t = e.target;
      openModal(t.dataset.medicineId, t.dataset.quantity, t.dataset.expiry);
    })
  );
  tableBody.querySelectorAll(".refill-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const t = e.target;
      openRefillModal(t.dataset.medicineId, t.dataset.medicineName);
    })
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function openModal(medicineId, quantity, expiry) {
  form.reset();
  if (medicineId) medicineField.value = medicineId;
  if (quantity !== undefined) quantityField.value = quantity;
  if (expiry) expiryField.value = expiry;
  backdrop.classList.add("open");
}

function closeModal() {
  backdrop.classList.remove("open");
}

document.getElementById("openAddModal").addEventListener("click", () => openModal());
document.getElementById("cancelModal").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    medicine_id: medicineField.value,
    quantity: Number(quantityField.value),
    expiry_date: expiryField.value || null,
  };

  if (!payload.medicine_id || quantityField.value === "") {
    showToast("Medicine and quantity are required.", true);
    return;
  }

  const saveBtn = document.getElementById("saveInventoryBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    await apiFetch("/api/inventory", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showToast("Inventory updated.");
    closeModal();
    loadInventory();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// ---------- Refill modal + history ----------
const refillBackdrop = document.getElementById("refillModalBackdrop");
const refillForm = document.getElementById("refillForm");
const refillMedicineIdField = document.getElementById("refillMedicineId");
const refillMedicineNameLabel = document.getElementById("refillMedicineName");
const refillQuantityField = document.getElementById("refillQuantity");
const refillRows = document.getElementById("refillRows");

function openRefillModal(medicineId, medicineName) {
  refillForm.reset();
  refillMedicineIdField.value = medicineId;
  refillMedicineNameLabel.textContent = medicineName;
  refillBackdrop.classList.add("open");
}
function closeRefillModal() {
  refillBackdrop.classList.remove("open");
}

document.getElementById("cancelRefillModal").addEventListener("click", closeRefillModal);
refillBackdrop.addEventListener("click", (e) => {
  if (e.target === refillBackdrop) closeRefillModal();
});

refillForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    medicine_id: refillMedicineIdField.value,
    quantity_added: Number(refillQuantityField.value),
  };

  if (!payload.medicine_id || !payload.quantity_added || payload.quantity_added <= 0) {
    showToast("A positive quantity is required.", true);
    return;
  }

  const saveBtn = document.getElementById("saveRefillBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    await apiFetch("/api/refills", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showToast("Refill recorded.");
    closeRefillModal();
    loadInventory();
    loadRefillHistory();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

async function loadRefillHistory() {
  refillRows.innerHTML = `<tr><td colspan="3" class="empty-state">Loading refill history…</td></tr>`;
  try {
    const refills = await apiFetch(`/api/refills?user_id=${user.user_id}`);
    if (!refills.length) {
      refillRows.innerHTML = `<tr><td colspan="3" class="empty-state">No refills recorded yet.</td></tr>`;
      return;
    }
    refillRows.innerHTML = refills
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.medicine_name)}</td>
          <td>${r.quantity_added}</td>
          <td>${escapeHtml(r.refill_date)}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    refillRows.innerHTML = `<tr><td colspan="3" class="empty-state">${err.message}</td></tr>`;
  }
}

(async function init() {
  await loadMedicinesDropdown();
  await loadInventory();
  await loadRefillHistory();
})();
