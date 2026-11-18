/**
 * Quản lý danh mục ngành nghề, địa điểm và kỹ năng.
 */
document.addEventListener("DOMContentLoaded", () => {
  const types = {
    industries: { label: "ngành", endpoint: "/industries" },
    locations: { label: "địa điểm", endpoint: "/locations" },
    skills: { label: "kỹ năng", endpoint: "/skills" },
  };
  const tabs = Array.from(document.querySelectorAll(".admin-tab"));
  const modal = document.getElementById("category-modal");
  const form = document.getElementById("category-form");
  const title = document.getElementById("category-modal-title");
  const nameInput = document.getElementById("category-name");
  const statusInput = document.getElementById("category-status");
  const typeInput = document.getElementById("category-type");
  const idInput = document.getElementById("category-id");
  const errorEl = document.getElementById("category-form-error");
  const saveButton = document.getElementById("btn-save-category");
  if (!modal || !form) return;

  let activeType = "industries";
  let returnFocus = null;
  const requestIds = { industries: 0, locations: 0, skills: 0 };

  function setMessage(type, message, isError = false) {
    const body = document.getElementById(`${type}-table-body`);
    if (!body) return;
    body.innerHTML = `<tr><td colspan="4" class="${isError ? "text-error" : "muted"} admin-table-message">${escapeHtml(message)}</td></tr>`;
  }

  async function loadCategories(type) {
    const body = document.getElementById(`${type}-table-body`);
    if (!body) return;
    const requestId = ++requestIds[type];
    setMessage(type, "Đang tải...");
    try {
      const result = await api.get(types[type].endpoint, { status: "" });
      if (requestId !== requestIds[type]) return;
      const list = Array.isArray(result) ? result : result && Array.isArray(result.items) ? result.items : null;
      if (!list) {
        console.error(`[AdminCategories] API ${types[type].endpoint} trả về dữ liệu không đúng định dạng:`, result);
        setMessage(type, "Máy chủ trả về danh sách danh mục không đúng định dạng.", true);
        return;
      }
      if (list.length === 0) {
        setMessage(type, "Chưa có danh mục nào.");
        return;
      }
      body.innerHTML = list.map((item) => {
        const status = item.status === "active" || item.status === true ? "active" : "inactive";
        const visibilityButton = status === "active"
          ? `<button class="btn btn-small btn-danger" type="button" data-action="hide" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}">Ẩn</button>`
          : `<button class="btn btn-small btn-primary" type="button" data-action="restore" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}">Bật lại</button>`;
        return `<tr>
          <td><code>#${escapeHtml(item.id)}</code></td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td><span class="admin-status${status === "active" ? "" : " is-inactive"}">${status === "active" ? "Hoạt động" : "Đã ẩn"}</span></td>
          <td class="actions">
            <button class="btn btn-small btn-outline" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}" data-status="${status}">Sửa</button>
            ${visibilityButton}
          </td>
        </tr>`;
      }).join("");
    } catch (error) {
      if (requestId === requestIds[type]) setMessage(type, `Lỗi tải dữ liệu: ${error.message}`, true);
    }
  }

  function setActiveTab(tab, moveFocus = false) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) panel.hidden = !active;
    });
    activeType = tab.dataset.type;
    if (moveFocus) tab.focus();
    loadCategories(activeType);
  }

  function openModal(type, item = null, trigger = document.activeElement) {
    activeType = type;
    returnFocus = trigger;
    typeInput.value = type;
    idInput.value = item ? item.id : "";
    nameInput.value = item ? item.name : "";
    statusInput.value = item ? item.status : "active";
    title.textContent = `${item ? "Sửa" : "Thêm"} ${types[type].label}`;
    errorEl.hidden = true;
    errorEl.textContent = "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    nameInput.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    form.reset();
    errorEl.hidden = true;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      setActiveTab(tabs[nextIndex], true);
    });
  });

  document.querySelectorAll(".btn-add-category").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.type, null, button));
  });

  Object.keys(types).forEach((type) => {
    const body = document.getElementById(`${type}-table-body`);
    if (!body) return;
    body.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "edit") {
        openModal(type, { id: button.dataset.id, name: button.dataset.name, status: button.dataset.status }, button);
        return;
      }

      if (action === "hide" && typeof showConfirmModal === "function") {
        const confirmed = await showConfirmModal({
          title: `Ẩn ${types[type].label}`,
          description: `Danh mục "${button.dataset.name}" sẽ không còn xuất hiện trong lựa chọn mới. Dữ liệu cũ được giữ nguyên.`,
          confirmLabel: "Ẩn danh mục",
          cancelLabel: "Huỷ",
        });
        if (!confirmed) return;
      }

      button.disabled = true;
      try {
        const endpoint = `${types[type].endpoint}/${encodeURIComponent(button.dataset.id)}`;
        if (action === "hide") await api.delete(endpoint);
        else await api.put(endpoint, { status: "active" });
        if (typeof showToast === "function") showToast(action === "hide" ? "Đã ẩn danh mục." : "Đã bật lại danh mục.", "success");
        await loadCategories(type);
      } catch (error) {
        if (typeof showToast === "function") showToast(error.message || "Không thể cập nhật danh mục.", "error");
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      errorEl.textContent = "Vui lòng nhập tên danh mục.";
      errorEl.hidden = false;
      nameInput.focus();
      return;
    }
    const type = typeInput.value;
    const id = idInput.value;
    const payload = { name, status: statusInput.value };
    saveButton.disabled = true;
    saveButton.textContent = "Đang lưu...";
    errorEl.hidden = true;
    try {
      if (id) await api.put(`${types[type].endpoint}/${encodeURIComponent(id)}`, payload);
      else await api.post(types[type].endpoint, payload);
      closeModal();
      if (typeof showToast === "function") showToast(id ? "Đã cập nhật danh mục." : "Đã thêm danh mục.", "success");
      await loadCategories(type);
    } catch (error) {
      errorEl.textContent = error.message || "Không thể lưu danh mục.";
      errorEl.hidden = false;
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Lưu danh mục";
    }
  });

  setActiveTab(tabs[0]);
});
