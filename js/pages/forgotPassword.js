/**
 * Logic Quên & Đặt lại mật khẩu (pages/forgot-password.html)
 */
document.addEventListener("DOMContentLoaded", () => {
  const step1 = document.getElementById("step-1-section"), step2 = document.getElementById("step-2-section");
  const pill1 = document.getElementById("step-pill-1"), pill2 = document.getElementById("step-pill-2");
  const heading = document.getElementById("page-heading"), subheading = document.getElementById("page-subheading");
  const alertBox = document.getElementById("auth-alert"), alertMsg = document.getElementById("alert-message");
  const timerText = document.getElementById("otp-timer-text");
  const emailForm = document.getElementById("forgot-email-form"), emailInput = document.getElementById("forgot-email");
  const emailError = document.getElementById("email-error"), btnSend = document.getElementById("btn-send-code");
  const resetForm = document.getElementById("reset-password-form"), codeInput = document.getElementById("reset-code");
  const codeError = document.getElementById("code-error"), digitBoxes = Array.from(document.querySelectorAll(".digit-box"));
  const newPwInput = document.getElementById("new-password"), newPwError = document.getElementById("new-pw-error");
  const confirmPwInput = document.getElementById("confirm-password"), confirmPwError = document.getElementById("confirm-pw-error");
  const btnReset = document.getElementById("btn-reset-submit"), btnResend = document.getElementById("btn-resend-code");
  const btnChangeEmail = document.getElementById("btn-change-email"), targetEmailText = document.getElementById("target-email-text");
  let userEmail = "", cooldownTimer = null, expireTimer = null;

  const showAlert = (msg, type = "danger") => {
    alertBox.className = `form-alert ${type}`;
    alertMsg.textContent = msg;
    alertBox.style.display = "flex";
  };
  const hideAlert = () => { alertBox.style.display = "none"; alertMsg.textContent = ""; };
  const clearErrors = () => {
    hideAlert();
    [emailError, codeError, newPwError, confirmPwError].forEach((el) => { if (el) el.style.display = "none"; });
  };
  const getActiveEmail = () => (
    userEmail || targetEmailText?.textContent || sessionStorage.getItem("forgot_pw_email") || emailInput.value || ""
  ).trim();

  function startExpireCountdown(seconds = 900) {
    if (expireTimer) clearInterval(expireTimer);
    let remain = seconds;
    const update = () => {
      const m = Math.floor(remain / 60).toString().padStart(2, "0");
      const s = (remain % 60).toString().padStart(2, "0");
      if (timerText) timerText.textContent = `${m}:${s}`;
      if (remain <= 0) {
        clearInterval(expireTimer);
        showAlert("Mã xác nhận 15 phút đã hết hạn. Vui lòng bấm 'Gửi lại mã' để nhận mã mới.", "warning");
      }
      remain -= 1;
    };
    update();
    expireTimer = setInterval(update, 1000);
  }

  function startCooldown(seconds = 60) {
    if (cooldownTimer) clearInterval(cooldownTimer);
    let left = seconds;
    btnResend.disabled = true;
    btnResend.textContent = `Gửi lại (${left}s)`;
    cooldownTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(cooldownTimer);
        btnResend.disabled = false;
        btnResend.textContent = "Gửi lại mã";
      } else {
        btnResend.textContent = `Gửi lại (${left}s)`;
      }
    }, 1000);
  }

  function setStep(step) {
    if (step === 2) {
      step1.style.display = "none";
      step2.style.display = "block";
      pill1?.classList.replace("active", "completed");
      pill2?.classList.add("active");
      heading.textContent = "Đặt lại mật khẩu";
      subheading.textContent = "Nhập mã xác nhận 6 số và mật khẩu mới của bạn.";
      startExpireCountdown(900);
      digitBoxes[0]?.focus();
    } else {
      step2.style.display = "none";
      step1.style.display = "block";
      pill1?.classList.add("active");
      pill1?.classList.remove("completed");
      pill2?.classList.remove("active");
      heading.textContent = "Quên mật khẩu";
      subheading.textContent = "Nhập địa chỉ email để nhận mã 6 số đặt lại mật khẩu.";
      if (expireTimer) clearInterval(expireTimer);
      emailInput.focus();
    }
  }

  const syncDigitsToInput = () => {
    const val = digitBoxes.map((b) => b.value.replace(/\D/g, "").slice(0, 1)).join("");
    if (codeInput) codeInput.value = val;
  };

  digitBoxes.forEach((box, idx) => {
    box.addEventListener("input", (e) => {
      const clean = e.target.value.replace(/\D/g, "");
      e.target.value = clean.slice(-1);
      syncDigitsToInput();
      if (clean && idx < digitBoxes.length - 1) digitBoxes[idx + 1].focus();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && idx > 0) digitBoxes[idx - 1].focus();
    });
    box.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
      text.split("").forEach((d, i) => { if (digitBoxes[i]) digitBoxes[i].value = d; });
      syncDigitsToInput();
      digitBoxes[Math.min(text.length, digitBoxes.length - 1)]?.focus();
    });
  });

  codeInput?.addEventListener("input", () => {
    const val = (codeInput.value || "").replace(/\D/g, "").slice(0, 6);
    digitBoxes.forEach((b, i) => { b.value = val[i] || ""; });
  });

  function setupToggle(btnId, input) {
    const btn = document.getElementById(btnId);
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.querySelector("svg").innerHTML = isPw
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  }
  setupToggle("toggle-new-pw", newPwInput); setupToggle("toggle-confirm-pw", confirmPwInput);

  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const email = emailInput.value.trim();
    if (!email || !email.includes("@") || !email.includes(".")) {
      emailError.style.display = "flex"; emailInput.focus(); return;
    }
    btnSend.classList.add("loading"); btnSend.disabled = true;
    try {
      const res = await Auth.forgotPassword(email);
      userEmail = email;
      sessionStorage.setItem("forgot_pw_email", email);
      if (targetEmailText) targetEmailText.textContent = userEmail;
      setStep(2);
      startCooldown(res?.cooldown_seconds || 60);
    } catch (err) {
      showAlert(err.message || "Không thể gửi mã xác nhận. Vui lòng thử lại sau.");
    } finally {
      btnSend.classList.remove("loading"); btnSend.disabled = false;
    }
  });

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    syncDigitsToInput();
    const code = (codeInput.value || "").trim(), newPw = newPwInput.value, confirmPw = confirmPwInput.value;
    let hasError = false;
    if (!code || code.length < 4) { codeError.style.display = "flex"; digitBoxes[0]?.focus(); hasError = true; }
    if (!newPw || newPw.length < 6) { newPwError.style.display = "flex"; if (!hasError) { newPwInput.focus(); hasError = true; } }
    if (newPw !== confirmPw) { confirmPwError.style.display = "flex"; if (!hasError) { confirmPwInput.focus(); hasError = true; } }
    if (hasError) return;

    btnReset.classList.add("loading"); btnReset.disabled = true;
    const activeEmail = getActiveEmail();
    if (!activeEmail) {
      showAlert("Không xác định được email. Vui lòng thử lại từ bước 1.");
      btnReset.classList.remove("loading"); btnReset.disabled = false; return;
    }
    try {
      await Auth.resetPassword(activeEmail, code, newPw);
      sessionStorage.removeItem("forgot_pw_email");
      if (expireTimer) clearInterval(expireTimer);
      showAlert("Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...", "success");
      setTimeout(() => { window.location.href = "login.html?reset=1"; }, 1500);
    } catch (err) {
      showAlert(err.message || "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại.");
      btnReset.classList.remove("loading"); btnReset.disabled = false;
    }
  });

  btnResend.addEventListener("click", async () => {
    clearErrors(); btnResend.disabled = true;
    try {
      const res = await Auth.forgotPassword(getActiveEmail());
      showAlert("Đã gửi lại mã xác nhận mới đến email của bạn.", "success");
      startExpireCountdown(900);
      startCooldown(res?.cooldown_seconds || 60);
    } catch (err) {
      showAlert(err.message || "Chưa thể gửi lại mã lúc này. Vui lòng chờ giây lát.");
      btnResend.disabled = false;
    }
  });

  btnChangeEmail.addEventListener("click", () => { clearErrors(); setStep(1); });
});
