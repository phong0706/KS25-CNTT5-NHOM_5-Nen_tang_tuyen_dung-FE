/**
 * realtimeClient.js - WebSocket Client cho thông báo thời gian thực (<= 150 dòng).
 * Quản lý vòng đời kết nối, cấp vé 1 lần, đa tab BroadcastChannel, fallback polling.
 */
import { computeBackoff, shouldReconnect, IdDeduplicator, CloseCodes } from "./realtimeLogic.js";

class RealtimeClient {
  constructor() {
    this.ws = null;
    this.attempt = 0;
    this.status = "closed";
    this.channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("realtime_notifications") : null;
    this.dedup = new IdDeduplicator();
    this.handlers = { notification: new Set(), unread_count: new Set(), status: new Set() };
    this.reconnectTimer = null;
    this.stableTimer = null;
    this.lastSeenId = 0;
    this.setupMultiTab();
  }

  setupMultiTab() {
    if (!this.channel) return;
    this.channel.onmessage = (e) => {
      const { type, payload } = e.data || {};
      if (type === "notification" && !this.dedup.isDuplicate(payload?.id)) this.emitLocal("notification", payload);
      else if (type === "unread_count") this.emitLocal("unread_count", payload);
    };
  }

  on(event, handler) {
    this.handlers[event]?.add(handler);
    return () => this.handlers[event]?.delete(handler);
  }

  emitLocal(event, data) {
    this.handlers[event]?.forEach((h) => { try { h(data); } catch {} });
  }

  emit(event, data) {
    this.emitLocal(event, data);
    if (this.channel && (event === "notification" || event === "unread_count")) {
      try { this.channel.postMessage({ type: event, payload: data }); } catch {}
    }
  }

  setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.emitLocal("status", newStatus);
  }

  async connect() {
    if (!window.Auth?.isAuthenticated?.()) { this.setStatus("closed"); return; }
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) return;

    this.setStatus("connecting");
    clearTimeout(this.reconnectTimer);
    try {
      const res = await window.api.post("/ws/ticket");
      if (!res?.enabled || !res?.ticket) { this.fallback(); return; }

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = (window.CONFIG?.API_URL && new URL(window.CONFIG.API_URL).port) || "8000";
      const wsUrl = `${wsProtocol}//${host}:${port}/ws/notifications?ticket=${encodeURIComponent(res.ticket)}`;

      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => this.onOpen();
      this.ws.onmessage = (e) => this.onMessage(e);
      this.ws.onclose = (e) => this.onClose(e);
    } catch {
      this.fallback();
      this.scheduleReconnect();
    }
  }

  onOpen() {
    this.setStatus("connected");
    this.syncAfterReconnect();
    this.stableTimer = setTimeout(() => { this.attempt = 0; }, 60000);
  }

  async syncAfterReconnect() {
    try {
      const res = await window.api.get("/notifications", { limit: 10 });
      if (res?.unread_count != null) this.emit("unread_count", res.unread_count);
      for (const item of (res?.items || [])) {
        if (item.id > this.lastSeenId && !this.dedup.isDuplicate(item.id)) {
          this.lastSeenId = Math.max(this.lastSeenId, item.id);
          this.emit("notification", item);
        }
      }
    } catch {}
  }

  onMessage(e) {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "ping") this.ws?.send(JSON.stringify({ type: "pong" }));
      else if (msg.type === "hello" && msg.data?.unread_count != null) this.emit("unread_count", msg.data.unread_count);
      else if (msg.type === "notification" && !this.dedup.isDuplicate(msg.data?.id)) {
        this.lastSeenId = Math.max(this.lastSeenId, Number(msg.data?.id || 0));
        this.emit("notification", msg.data);
        if (msg.data?.unread_count != null) this.emit("unread_count", msg.data.unread_count);
      } else if (msg.type === "unread_count") {
        this.emit("unread_count", msg.data?.unread_count ?? msg.data);
      }
    } catch {}
  }

  onClose(e) {
    if (this.status === "closed") return;
    this.ws = null;
    clearTimeout(this.stableTimer);
    if (!shouldReconnect(e.code)) { this.setStatus("closed"); return; }
    this.scheduleReconnect();
    setTimeout(() => { if (this.status !== "connected" && this.status !== "closed") this.fallback(); }, 10000);
  }

  fallback() {
    if (this.status !== "connected") this.setStatus("polling");
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    const delay = computeBackoff(this.attempt++);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.stableTimer);
    if (this.ws) {
      try { this.ws.close(CloseCodes.NORMAL, "Client logout"); } catch {}
      this.ws = null;
    }
    this.setStatus("closed");
  }
}

export const realtimeClient = new RealtimeClient();

if (typeof window !== "undefined") {
  window.realtimeClient = realtimeClient;
  window.addEventListener("techrecruit:auth_logout", () => realtimeClient.disconnect());
}
