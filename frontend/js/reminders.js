requireAuth();
document.getElementById("logoutBtn").addEventListener("click", logout);

const user = getCurrentUser();

async function loadReminders() {
  const tableBody = document.getElementById("reminderRows");
  try {
    const reminders = await apiFetch(`/api/reminders?user_id=${user.user_id}`);
    renderTable(reminders);
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderTable(reminders) {
  const tableBody = document.getElementById("reminderRows");

  if (!reminders.length) {
    tableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No reminders sent yet. They appear automatically once a scheduled dose comes due.</td></tr>`;
    return;
  }

  tableBody.innerHTML = reminders
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.medicine_name)}</td>
        <td>${escapeHtml(r.schedule_time)}</td>
        <td>${escapeHtml(r.reminder_date)}</td>
        <td><span class="status-tag ok">${escapeHtml(r.status)}</span></td>
      </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadReminders();
