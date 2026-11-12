/**
 * Logic Trang Đăng ký (pages/register.html)
 * Bộ chọn Role Card Selector, Validation trực quan & Đăng ký liền mạch (Pure Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const roleCardCandidate = document.getElementById("role-card-candidate");
  const roleCardEmployer = document.getElementById("role-card-employer");
  const companyGroup = document.getElementById("company-field-group");

  const fullnameInput = document.getElementById("reg-fullname");
  const emailInput = document.getElementById("reg-email");
  const companyInput = document.getElementById("reg-company");
  const phoneInput = document.getElementById("reg-phone");
  const passwordInput = document.getElementById("reg-password");
  const confirmPasswordInput = document.getElementById("reg-confirm-password");

  const fullnameError = document.getElementById("fullname-error");
  const emailError = document.getElementById("reg-email-error");
  const companyError = document.getElementById("company-error");
  const phoneError = document.getElementById("phone-error");
  const passwordError = document.getElementById("reg-password-error");
  const confirmPasswordError = document.getElementById("confirm-password-error");

  const submitBtn = document.getElementById("btn-register-submit");
  const authAlert = document.getElementById("auth-alert");
  const alertMessage = document.getElementById("alert-message");

  // Khởi tạo CAPTCHA bảo vệ
  const captcha = typeof createCaptcha === "function" ? createCaptcha({
    canvasId: "reg-captcha-canvas",
    inputId: "reg-captcha-input",
    refreshBtnId: "btn-refresh-reg-captcha",
    errorId: "reg-captcha-error",
    length: 4
  }) : null;

  let selectedRole = "candidate";

  // Xử lý bộ chọn Role Card
  function selectRole(role) {
    selectedRole = role;
    if (role === "candidate") {
      roleCardCandidate.classList.add("active");
      roleCardCandidate.querySelector(".role-radio-check").textContent = "✓";
      roleCardEmployer.classList.remove("active");
      roleCardEmployer.querySelector(".role-radio-check").textContent = "";
      companyGroup.style.display = "none";
      clearError(companyInput, companyError);
    } else {
      roleCardEmployer.classList.add("active");
      roleCardEmployer.querySelector(".role-radio-check").textContent = "✓";
      roleCardCandidate.classList.remove("active");
      roleCardCandidate.querySelector(".role-radio-check").textContent = "";
      companyGroup.style.display = "block";
      companyInput.focus();
    }
  }

  roleCardCandidate.addEventListener("click", () => selectRole("candidate"));
  roleCardEmployer.addEventListener("click", () => selectRole("employer"));

  // Toggle Password
  function setupPasswordToggle(buttonId, inputEl) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isPassword = inputEl.type === "password";
      inputEl.type = isPassword ? "text" : "password";
      const svg = btn.querySelector("svg");
      svg.innerHTML = isPassword
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });
  }

  setupPasswordToggle("toggle-reg-pw-btn", passwordInput);
  setupPasswordToggle("toggle-confirm-pw-btn", confirmPasswordInput);

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

  function clearAllErrors() {
    clearError(fullnameInput, fullnameError);
    clearError(emailInput, emailError);
    clearError(companyInput, companyError);
    clearError(phoneInput, phoneError);
    clearError(passwordInput, passwordError);
    clearError(confirmPasswordInput, confirmPasswordError);
    hideAlert();
  }

  [
    [fullnameInput, fullnameError],
    [emailInput, emailError],
    [companyInput, companyError],
    [phoneInput, phoneError],
    [passwordInput, passwordError],
    [confirmPasswordInput, confirmPasswordError],
  ].forEach(([input, errorEl]) => {
    input.addEventListener("input", () => clearError(input, errorEl));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();

    const fullName = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const companyName = companyInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let isValid = true;

    if (!fullName) {
      setError(fullnameInput, fullnameError, "Vui lòng nhập họ và tên của bạn");
      isValid = false;
    }

    if (!email) {
      setError(emailInput, emailError, "Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailInput, emailError, "Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    if (selectedRole === "employer" && !companyName) {
      setError(companyInput, companyError, "Nhà tuyển dụng bắt buộc phải nhập tên công ty");
      isValid = false;
    }

    if (phone && !/^[0-9+\s-]{9,15}$/.test(phone)) {
      setError(phoneInput, phoneError, "Số điện thoại không hợp lệ");
      isValid = false;
    }

    if (!password) {
      setError(passwordInput, passwordError, "Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (password.length < 6) {
      setError(passwordInput, passwordError, "Mật khẩu phải từ 6 ký tự trở lên");
      isValid = false;
    }

    if (!confirmPassword) {
      setError(confirmPasswordInput, confirmPasswordError, "Vui lòng xác nhận mật khẩu");
      isValid = false;
    } else if (password !== confirmPassword) {
      setError(confirmPasswordInput, confirmPasswordError, "Mật khẩu xác nhận không trùng khớp");
      isValid = false;
    }

    // Kiểm tra CAPTCHA
    if (captcha && !captcha.validate()) {
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    try {
      const payload = {
        email: email,
        password: password,
        full_name: fullName,
        phone: phone || null,
        role: selectedRole,
      };

      if (selectedRole === "employer") {
        payload.company_name = companyName;
      }

      await Auth.register(payload);

      try {
        const { user } = await Auth.login(email, password);
        const dashboardUrl = Auth.getDashboardUrl(user.role);
        window.location.href = dashboardUrl;
      } catch (loginErr) {
        window.location.href = "login.html?registered=1";
      }
    } catch (err) {
      console.error("[Register Error]", err);
      setLoading(false);
      if (captcha) captcha.refresh();

      if (err.status === 409 || (err.message && err.message.includes("đã được sử dụng"))) {
        setError(emailInput, emailError, "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.");
        emailInput.focus();
      } else {
        const msg = err.message || "Đã xảy ra lỗi trong quá trình tạo tài khoản.";
        showAlert(msg, "danger");
      }
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
      submitBtn.querySelector(".btn-text").textContent = "Đang tạo tài khoản...";
    } else {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-text").textContent = "Đăng ký tài khoản";
    }
  }
});

