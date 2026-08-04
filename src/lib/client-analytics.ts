export function trackClientEvent(
  eventName: string,
  page: string,
  metadata?: Record<string, unknown>
) {
  const payload = JSON.stringify({ eventName, page, metadata: metadata ?? {} });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}