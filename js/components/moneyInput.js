/**
 * Component nhập tiền tệ VNĐ: tự định dạng dấu chấm (1.000.000) khi gõ.
 */

export function formatMoneyDots(num) {
  if (num === null || num === undefined || num === "") return "";
  const digits = String(num).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

export function parseMoneyDigits(str) {
  const digits = String(str ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

export function bindMoneyInput(inputEl, onChange) {
  if (!inputEl) return null;

  const formatAndNotify = () => {
    const raw = inputEl.value;
    const digits = raw.replace(/\D/g, "");
    const formatted = digits ? Number(digits).toLocaleString("vi-VN") : "";
    if (inputEl.value !== formatted) {
      inputEl.value = formatted;
    }
    onChange?.(digits ? Number(digits) : null);
  };

  inputEl.addEventListener("input", formatAndNotify);
  inputEl.addEventListener("blur", formatAndNotify);

  return {
    getValue: () => parseMoneyDigits(inputEl.value),
    setValue: (val) => {
      inputEl.value = formatMoneyDots(val);
    },
  };
}

