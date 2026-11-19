/**
 * Trang Xét duyệt Tin tuyển dụng (/pages/admin/jobs.html)
 */
import { showStatusToast } from "../components/toast.js";
import { renderStatusTabs } from "../components/statusTabs.js";

const state = {
  activeTab: "pending",
  searchQuery: "",
  rejectingJob: null,
  counts: { pending: 0, published: 0, rejected: 0, closed: 0, all: 0 },
};

function esc(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

async function loadJobs() {
  const tbody = document.getElementById("adm-jobs-tbody");
  const errBox = document.getElementById("adm-jobs-error");
  errBox.hidden = true;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;">Đang tải danh sách tin...</td></tr>`;

  try {
    const res = await window.api.get(`/admin/jobs?status=${state.activeTab}&q=${encodeURIComponent(state.searchQuery)}`);
    state.counts = res.counts || state.counts;
    renderTabs();
    renderTable(res.items || []);
  } catch (err) {
    tbody.innerHTML = "";
    errBox.hidden = false;
    document.getElementById("adm-jobs-error-msg").textContent = err?.message || "Lỗi kết nối máy chủ khi tải tin.";
  }
}

function renderTabs() {
  const tabs = [
    { key: "pending", id: "pending", label: "Chờ duyệt", count: state.counts.pending },
    { key: "published", id: "published", label: "Đang tuyển", count: state.counts.published },
    { key: "rejected", id: "rejected", label: "Bị từ chối", count: state.counts.rejected },
    { key: "all", id: "all", label: "Tất cả", count: state.counts.all },
  ];
  const bar = document.getElementById("adm-jobs-tabs");
  renderStatusTabs(bar, tabs, state.activeTab, (nextKey) => {
    state.activeTab = nextKey;
    loadJobs();
  });
}

function renderTable(items) {
  const tbody = document.getElementById("adm-jobs-tbody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-secondary);">Không có tin tuyển dụng nào trong mục này.</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map((j) => {
      const isPending = j.status === "pending";
      const statusBadge = `<span class="badge badge--${j.status}">${esc(j.status === "pending" ? "Chờ duyệt" : j.status === "published" ? "Đang tuyển" : j.status === "rejected" ? "Bị từ chối" : j.status)}</span>`;
      const deadlineText = j.deadline ? new Date(j.deadline).toLocaleDateString("vi-VN") : "Không thời hạn";

      return `
        <tr data-job-id="${j.id}" data-version="${j.version}">
          <td>
            <div style="font-weight:600;color:var(--text-primary);">${esc(j.title)}</div>
            <div style="font-size:12px;color:var(--text-secondary);">${esc(j.employer_email)}</div>
          </td>
          <td>${esc(j.company_name)}</td>
          <td>${esc(deadlineText)}</td>
          <td>${statusBadge}</td>
          <td style="text-align:right;">
            ${isPending ? `
              <button type="button" class="btn btn-sm btn-success adm-btn-approve" data-id="${j.id}" data-version="${j.version}" style="margin-right:6px;">Duyệt</button>
              <button type="button" class="btn btn-sm btn-danger adm-btn-reject" data-id="${j.id}" data-version="${j.version}" data-title="${esc(j.title)}">Từ chối</button>
            ` : `<span style="font-size:12px;color:var(--text-secondary);">Hoàn tất</span>`}
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".adm-btn-approve").forEach((btn) => {
    btn.onclick = () => handleApprove(Number(btn.dataset.id), Number(btn.dataset.version));
  });
  tbody.querySelectorAll(".adm-btn-reject").forEach((btn) => {
    btn.onclick = () => openRejectDialog({ id: Number(btn.dataset.id), version: Number(btn.dataset.version), title: btn.dataset.title });
  });
}

async function handleApprove(jobId, version) {
  try {
    await window.api.post(`/admin/jobs/${jobId}/approve`, { version });
    showStatusToast("Đã duyệt tin tuyển dụng thành công!", "success");
    loadJobs();
  } catch (err) {
    showStatusToast(err?.message || "Duyệt tin thất bại.", "error");
  }
}

function openRejectDialog(job) {
  state.rejectingJob = job;
  const dialog = document.getElementById("adm-reject-dialog");
  const textarea = document.getElementById("adm-reject-reason-input");
  const errMsg = document.getElementById("adm-reject-err-msg");
  const confirmBtn = document.getElementById("adm-reject-confirm-btn");

  textarea.value = "";
  errMsg.hidden = true;
  confirmBtn.disabled = true;

  confirmBtn.onclick = async () => {
    const reason = textarea.value.trim();
    if (reason.length < 10) return;
    try {
      await window.api.post(`/admin/jobs/${job.id}/reject`, { version: job.version, reason });
      showStatusToast("Đã từ chối tin tuyển dụng.", "info");
      dialog.close();
      loadJobs();
    } catch (err) {
      showStatusToast(err?.message || "Từ chối tin thất bại.", "error");
    }
  };

  dialog.showModal();
}

function init() {
  const dialog = document.getElementById("adm-reject-dialog");
  const textarea = document.getElementById("adm-reject-reason-input");
  const errMsg = document.getElementById("adm-reject-err-msg");
  const confirmBtn = document.getElementById("adm-reject-confirm-btn");
  const cancelBtn = document.getElementById("adm-reject-cancel-btn");

  if (textarea && confirmBtn) {
    textarea.oninput = () => {
      const val = textarea.value.trim();
      const isShort = val.length < 10;
      errMsg.hidden = !isShort || val.length === 0;
      confirmBtn.disabled = isShort;
    };
  }
  if (cancelBtn && dialog) cancelBtn.onclick = () => dialog.close();

  document.getElementById("adm-jobs-refresh-btn").onclick = loadJobs;
  document.getElementById("adm-jobs-retry-btn").onclick = loadJobs;
  document.getElementById("adm-jobs-search").oninput = (e) => {
    state.searchQuery = e.target.value.trim();
    loadJobs();
  };
  loadJobs();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
