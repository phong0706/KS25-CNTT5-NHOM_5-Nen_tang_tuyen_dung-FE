/**
 * Logic Trang Đăng nhập (pages/login.html)
 * Kết nối Auth State, Axios Api và Route Guard (Pure Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const submitBtn = document.getElementById("btn-login-submit");
  const togglePasswordBtn = document.getElementById("toggle-password-btn");
  const eyeIcon = document.getElementById("eye-icon");
  const authAlert = document.getElementById("auth-alert");
  const alertMessage = document.getElementById("alert-message");

  // Khởi tạo CAPTCHA bảo vệ
  const captcha = typeof createCaptcha === "function" ? createCaptcha({
    canvasId: "auth-captcha-canvas",
    inputId: "auth-captcha-input",
    refreshBtnId: "btn-refresh-captcha",
    errorId: "captcha-error",
    length: 4
  }) : null;

  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get("redirect");
  const isExpired = urlParams.get("expired");
  const isRegistered = urlParams.get("registered");

  if (isExpired === "1") {
    showAlert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", "warning");
  } else if (isRegistered === "1") {
    showAlert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.", "success");
  }

  // Toggle Password
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      eyeIcon.innerHTML = isPassword
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  }

  // Nút tài khoản test nhanh
  document.querySelectorAll(".btn-demo-acc").forEach((btn) => {
    btn.addEventListener("click", () => {
      emailInput.value = btn.dataset.email;
      passwordInput.value = btn.dataset.pass;
      clearErrors();
      if (captcha) captcha.fillCorrectCode();
      emailInput.focus();
    });
  });

  function showAlert(msg, type = "danger") {
    authAlert.className = `form-alert alert-${type} show`;
    alertMessage.textContent = msg;
  }

  function hideAlert() {
    authAlert.className = "form-alert";
    alertMessage.textContent = "";
  }

  function setError(input, errorEl, message) {
    input.classList.add("is-invalid");
    errorEl.querySelector(".error-text").textContent = message;
    errorEl.classList.add("active");
  }

  function clearError(input, errorEl) {
    input.classList.remove("is-invalid");
    errorEl.classList.remove("active");
  }

  function clearErrors() {
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    hideAlert();
  }

  emailInput.addEventListener("input", () => clearError(emailInput, emailError));
  passwordInput.addEventListener("input", () => clearError(passwordInput, passwordError));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    if (!email) {
      setError(emailInput, emailError, "Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailInput, emailError, "Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    if (!password) {
      setError(passwordInput, passwordError, "Vui lòng nhập mật khẩu");
      isValid = false;
    }

    // Kiểm tra CAPTCHA
    if (captcha && !captcha.validate()) {
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    try {
      const { user } = await Auth.login(email, password);

      if (redirectTarget && !redirectTarget.includes("login.html") && !redirectTarget.includes("register.html")) {
        window.location.href = decodeURIComponent(redirectTarget);
      } else {
        const dashboardUrl = Auth.getDashboardUrl(user.role);
        window.location.href = dashboardUrl;
      }
    } catch (err) {
      console.error("[Login Error]", err);
      const message = err.message || "Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      showAlert(message, "danger");
      if (captcha) captcha.refresh();
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
      submitBtn.querySelector(".btn-text").textContent = "Đang xác thực...";
    } else {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-text").textContent = "Đăng nhập";
    }
  }
});

