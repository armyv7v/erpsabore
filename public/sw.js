self.addEventListener("push", (event) => {
  let payload = {
    title: "ERP Sabore",
    body: "Tenés una nueva notificación.",
    icon: "/brand/logo_camel_fondo_blanco.png",
    badge: "/brand/logo_camel_fondo_blanco.png",
    url: "/",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_error) {
      payload.body = event.data.text();
    }
  }

  const { title, body, icon, badge, tag, url } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: tag || "erp-sabore-notification",
      data: { url: url || "/" },
      renotify: Boolean(tag),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
