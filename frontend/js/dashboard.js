requireAuth();

const user = getCurrentUser();
document.getElementById("welcomeMsg").textContent = `Welcome, ${user?.name || "there"}!`;

document.getElementById("logoutBtn").addEventListener("click", logout);

async function loadDashboard() {
  // Total medicines: reuse the same endpoint the Medicines page uses.
  try {
    const medicines = await apiFetch(`/api/medicines?user_id=${user.user_id}`);
    document.getElementById("totalMedicines").textContent = medicines.length;
  } catch (err) {
    document.getElementById("totalMedicines").textContent = "0";
    showToast(err.message, true);
  }
// Automatically mark overdue doses as missed.
try {
  await apiFetch(`/api/compliance/check-missed?user_id=${user.user_id}`);
} catch (err) {
  console.error("Missed-dose check failed:", err);
}

  // Today's schedule, joined with today's compliance status.
  try {
    const today = await apiFetch(`/api/schedules/today?user_id=${user.user_id}`);
    renderTodayList(today);
    document.getElementById("todayMedicines").textContent = today.length;
  } catch (err) {
    document.getElementById("todayMedicines").textContent = "0";
    renderTodayList([]);
  }
}

function renderTodayList(items) {
  const list = document.getElementById("todayList");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li>No medicines scheduled for today.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.dataset.scheduleId = item.schedule_id;
    li.dataset.medicineId = item.medicine_id;

    const isPending = item.status === "pending";

    li.innerHTML = `
      <span>${item.medicine_name || item.name} — ${item.time || ""}</span>
      <span class="tag">${item.status || "pending"}</span>
      ${
        isPending
          ? `<span class="dose-actions">
               <button class="btn-link take-btn">Mark Taken</button>
               <button class="btn-link danger skip-btn">Skip</button>
             </span>`
          : ""
      }
    `;
    list.appendChild(li);
  });

  list.querySelectorAll(".take-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => markDose(e.target.closest("li"), "taken"))
  );
  list.querySelectorAll(".skip-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => markDose(e.target.closest("li"), "skipped"))
  );
}

async function markDose(li, status) {
  const schedule_id = li.dataset.scheduleId;
  const medicine_id = li.dataset.medicineId;

  try {
    const result = await apiFetch("/api/compliance/mark", {
      method: "POST",
      body: JSON.stringify({
        schedule_id,
        medicine_id,
        user_id: user.user_id,
        status,
      }),
    });

    showToast(result.message || "Updated.");

    if (result.inventory && result.inventory.notified) {
      showToast(
        `Heads up: only ${result.inventory.quantity} dose(s) left for this medicine.`,
        true
      );
    }

    loadDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

loadDashboard();
