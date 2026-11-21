/**
 * realtimeLogic.js - Logic thuần của Realtime WebSocket Client.
 * Thuần logic, không I/O, không DOM, tuân thủ techrecruit-rules (<= 150 dòng).
 */
export const CloseCodes = {
  NORMAL: 1000,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  UNAUTHORIZED: 4401,
  FORBIDDEN: 4403,
  PING_TIMEOUT: 4408,
  TOO_MANY_CONNECTIONS: 4429,
};

export const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 16000, 30000];
export const MAX_BACKOFF = 30000;
export const STABLE_RESET_MS = 60000;
export const FALLBACK_THRESHOLD_MS = 10000;

/**
 * Tính toán thời gian chờ kết nối lại (exponential backoff + jitter 20%).
 * @param {number} attempt Số lần thử lại (bắt đầu từ 0)
 * @param {number} randomVal Giá trị ngẫu nhiên [0..1]
 * @returns {number} Thời gian trễ tính bằng mili-giây
 */
export function computeBackoff(attempt, randomVal = Math.random()) {
  const safeAttempt = Math.max(0, Math.floor(attempt || 0));
  const base = safeAttempt < BACKOFF_STEPS.length ? BACKOFF_STEPS[safeAttempt] : MAX_BACKOFF;
  // Jitter +-20%: factor nằm trong khoảng [0.8 .. 1.2]
  const jitterFactor = 0.8 + (Math.max(0, Math.min(1, randomVal)) * 0.4);
  return Math.round(base * jitterFactor);
}

/**
 * Xác định client có nên kết nối lại dựa theo mã đóng WebSocket hay không.
 * @param {number} code Mã đóng kết nối
 * @returns {boolean} true nếu nên thử kết nối lại, false nếu dừng hẳn
 */
export function shouldReconnect(code) {
  if (code === CloseCodes.NORMAL) return false;        // 1000: Đóng chủ động (Logout) -> DỪNG
  if (code === CloseCodes.FORBIDDEN) return false;     // 4403: Tài khoản bị khóa hoặc sai Origin -> DỪNG
  if (code === CloseCodes.UNAUTHORIZED) return false;  // 4401: Token/Vé sai hoặc hết hạn -> DỪNG / Cần đăng nhập lại
  return true; // 1012 (restart), 1013 (busy), 4408 (timeout), 4429 (rate limit), mất mạng -> Thử lại
}

/**
 * Quyết định có kích hoạt cơ chế fallback polling 60s hay không.
 * @param {boolean} isConnected Trạng thái kết nối WebSocket hiện tại
 * @param {number} disconnectedDurationMs Thời gian mất kết nối (mili-giây)
 * @returns {boolean}
 */
export function shouldEnablePolling(isConnected, disconnectedDurationMs) {
  if (isConnected) return false;
  return Number(disconnectedDurationMs || 0) >= FALLBACK_THRESHOLD_MS;
}

/**
 * Lớp chống trùng lặp ID thông báo theo hàng đợi giới hạn kích thước (FIFO).
 */
export class IdDeduplicator {
  constructor(maxSize = 200) {
    this.maxSize = Math.max(10, maxSize);
    this.seen = new Set();
    this.queue = [];
  }

  isDuplicate(id) {
    if (id == null) return false;
    const key = String(id);
    if (this.seen.has(key)) return true;

    this.seen.add(key);
    this.queue.push(key);
    if (this.queue.length > this.maxSize) {
      const oldest = this.queue.shift();
      if (oldest) this.seen.delete(oldest);
    }
    return false;
  }

  clear() {
    this.seen.clear();
    this.queue = [];
  }
}
