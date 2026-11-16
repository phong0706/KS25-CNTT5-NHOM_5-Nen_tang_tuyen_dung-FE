/**
 * Logic Quên & Đặt lại mật khẩu (pages/forgot-password.html)
 */

document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("step-1-section");
  const step2 = document.getElementById("step-2-section");
  const heading = document.getElementById("page-heading");
  const subheading = document.getElementById("page-subheading");
  const alertBox = document.getElementById("auth-alert");
  const alertMsg = document.getElementById("alert-message");

  const emailForm = document.getElementById("forgot-email-form");
  const emailInput = document.getElementById("forgot-email");
  const emailError = document.getElementById("email-error");
  const btnSend = document.getElementById("btn-send-code");

  const resetForm = document.getElementById("reset-password-form");
  const codeInput = document.getElementById("reset-code");
  const codeError = document.getElementById("code-error");
  const newPwInput = document.getElementById("new-password");
  const newPwError = document.getElementById("new-pw-error");
  const confirmPwInput = document.getElementById("confirm-password");
  const confirmPwError = document.getElementById("confirm-pw-error");
  const btnReset = document.getElementById("btn-reset-submit");
  const btnResend = document.getElementById("btn-resend-code");
  const btnChangeEmail = document.getElementById("btn-change-email");
  const targetEmailText = document.getElementById("target-email-text");

  let userEmail = "";
  let countdownTimer = null;

  function showAlert(msg, type = "danger") {
    alertBox.className = `form-alert ${type}`;
    alertMsg.textContent = msg;
    alertBox.style.display = "flex";
  }

  function hideAlert() {
    alertBox.style.display = "none";
    alertMsg.textContent = "";
  }

  function clearErrors() {
    hideAlert();
    [emailError, codeError, newPwError, confirmPwError].forEach((el) => {
      if (el) el.style.display = "none";
    });
  }

  function getActiveEmail() {
    return (
      userEmail || targetEmailText.textContent || sessionStorage.getItem("forgot_pw_email") || emailInput.value || ""
    ).trim();
  }

  function startCooldown(seconds = 60) {
    if (countdownTimer) clearInterval(countdownTimer);
    let left = seconds;
    btnResend.disabled = true;
    btnResend.textContent = `Gửi lại (${left}s)`;

    countdownTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(countdownTimer);
        btnResend.disabled = false;
        btnResend.textContent = "Gửi lại mã";
      } else {
        btnResend.textContent = `Gửi lại (${left}s)`;
      }
    }, 1000);
  }

  function setupToggle(btnId, input) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.querySelector("svg").innerHTML = isPw
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  }

  setupToggle("toggle-new-pw", newPwInput);
  setupToggle("toggle-confirm-pw", confirmPwInput);

  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const email = emailInput.value.trim();
    if (!email || !email.includes("@") || !email.includes(".")) {
      emailError.style.display = "flex";
      emailInput.focus();
      return;
    }
    btnSend.classList.add("loading");
    btnSend.disabled = true;
    try {
      const res = await Auth.forgotPassword(email);
      userEmail = email;
      sessionStorage.setItem("forgot_pw_email", email);
      targetEmailText.textContent = userEmail;
      step1.style.display = "none";
      step2.style.display = "block";
      heading.textContent = "Đặt lại mật khẩu";
      subheading.textContent = "Nhập mã xác nhận 6 số và mật khẩu mới của bạn.";
      startCooldown(res?.cooldown_seconds || 60);
      codeInput.focus();
    } catch (err) {
      showAlert(err.message || "Không thể gửi mã xác nhận. Vui lòng thử lại sau.");
    } finally {
      btnSend.classList.remove("loading");
      btnSend.disabled = false;
    }
  });

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const code = codeInput.value.trim();
    const newPw = newPwInput.value;
    const confirmPw = confirmPwInput.value;
    let hasError = false;

    if (!code || code.length < 4) {
      codeError.style.display = "flex";
      if (!hasError) { codeInput.focus(); hasError = true; }
    }

    if (!newPw || newPw.length < 6) {
      newPwError.style.display = "flex";
      if (!hasError) { newPwInput.focus(); hasError = true; }
    }

    if (newPw !== confirmPw) {
      confirmPwError.style.display = "flex";
      if (!hasError) { confirmPwInput.focus(); hasError = true; }
    }

    if (hasError) return;

    btnReset.classList.add("loading");
    btnReset.disabled = true;
    const activeEmail = getActiveEmail();
    if (!activeEmail) {
      showAlert("Không xác định được email. Vui lòng thử lại từ bước 1.");
      btnReset.classList.remove("loading");
      btnReset.disabled = false;
      return;
    }

    try {
      await Auth.resetPassword(activeEmail, code, newPw);
      sessionStorage.removeItem("forgot_pw_email");
      showAlert("Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...", "success");
      setTimeout(() => {
        window.location.href = "login.html?reset=1";
      }, 1500);
    } catch (err) {
      showAlert(err.message || "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại.");
      btnReset.classList.remove("loading");
      btnReset.disabled = false;
    }
  });

  // Nút gửi lại mã
  btnResend.addEventListener("click", async () => {
    clearErrors();
    btnResend.disabled = true;
    const activeEmail = getActiveEmail();
    try {
      const res = await Auth.forgotPassword(activeEmail);
      showAlert("Đã gửi lại mã xác nhận mới đến email của bạn.", "success");
      startCooldown(res?.cooldown_seconds || 60);
    } catch (err) {
      showAlert(err.message || "Chưa thể gửi lại mã lúc này. Vui lòng chờ giây lát.");
      btnResend.disabled = false;
    }
  });

  // Nút đổi email khác
  btnChangeEmail.addEventListener("click", () => {
    clearErrors();
    step2.style.display = "none";
    step1.style.display = "block";
    heading.textContent = "Quên mật khẩu";
    subheading.textContent = "Nhập địa chỉ email để nhận mã 6 số đặt lại mật khẩu.";
    emailInput.focus();
  });
});
