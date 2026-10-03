requireAuth();

document.getElementById("logoutBtn").addEventListener("click", logout);

const user = getCurrentUser();

async function loadReminders() {
  const tableBody = document.getElementById("reminderRows");

  try {
    const history = await apiFetch(
      `/api/compliance?user_id=${user.user_id}`
    );

    renderTable(history);
  } catch (err) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderTable(history) {
  const tableBody = document.getElementById("reminderRows");

  if (!history.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No medication history yet.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = history
    .map((item) => {
      const takenAt = item.taken_at
        ? new Date(item.taken_at).toLocaleString()
        : "—";

      return `
        <tr>
          <td>${escapeHtml(item.medicine_name)}</td>
          <td>${escapeHtml(item.scheduled_time)}</td>
          <td>${escapeHtml(item.scheduled_date)}</td>
          <td>
            <span class="status-tag ${escapeHtml(item.status)}">
              ${escapeHtml(item.status)}
            </span>
          </td>
          <td>${escapeHtml(takenAt)}</td>
        </tr>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadReminders();