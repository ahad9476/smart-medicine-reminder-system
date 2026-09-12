requireAuth();

const user = getCurrentUser();
document.getElementById("welcomeMsg").textContent = `Welcome, ${user?.name || "there"}!`;

document.getElementById("logoutBtn").addEventListener("click", logout);

async function loadDashboard() {
  // Total medicines: reuse the same endpoint the Medicines page uses.
  try {
    const medicines = await apiFetch("/api/medicines");
    document.getElementById("totalMedicines").textContent = medicines.length;
  } catch (err) {
    document.getElementById("totalMedicines").textContent = "0";
    showToast(err.message, true);
  }

  // Today's schedule: separate endpoint (Member 2's part).
  // Coded defensively so the dashboard still works before that route exists.
  try {
    const today = await apiFetch("/api/schedules/today");
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
    li.innerHTML = `
      <span>${item.medicine_name || item.name} — ${item.time || ""}</span>
      <span class="tag">${item.status || "pending"}</span>
    `;
    list.appendChild(li);
  });
}

loadDashboard();
