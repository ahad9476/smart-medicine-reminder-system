requireAuth();
document.getElementById("logoutBtn").addEventListener("click", logout);

const user = getCurrentUser();

async function loadNotifications() {
  const list = document.getElementById("notificationList");
  try {
    const notifications = await apiFetch(`/api/notifications?user_id=${user.user_id}`);
    renderList(notifications);
  } catch (err) {
    list.innerHTML = `<li>${err.message}</li>`;
  }
}

function renderList(items) {
  const list = document.getElementById("notificationList");
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<li>No notifications yet.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    const isLow = item.type_name === "Low Stock";
    const badgeClass = item.type_name === "Missed Dose" ? "low" : isLow ? "low" : "ok";
    const when = new Date(item.created_at).toLocaleString();

    li.innerHTML = `
      <span>${escapeHtml(item.message)} <small style="color:#888;">(${when})</small></span>
      <span class="status-tag ${badgeClass}">${escapeHtml(item.type_name)}</span>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadNotifications();
