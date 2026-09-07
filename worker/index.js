// Custom service worker source, bundled into the generated public/sw.js by
// @ducanh2912/next-pwa (customWorkerSrc, see next.config.js). Adds real
// Web Push handling for the Daily Devotional reminder -- this is what lets
// the notification fire even while the app is fully closed, unlike the
// plain `new Notification()` call used for the "app is open" case (see
// DailyDevotionalPopup.tsx). The push message itself is sent server-side
// by /api/v1/push/send-daily via the `web-push` library.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: "Today's Encouragement", body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || "Today's Encouragement"
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'kc-daily-devotional',
    data: { url: payload.url || '/daily' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/daily'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && new URL(client.url).pathname === url) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    })
  )
})

// A push subscription can be invalidated/rotated by the browser at any
// time; when that happens, re-subscribe with the same VAPID key and tell
// the server about the new endpoint so the reminder keeps working instead
// of silently going dead.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const applicationServerKey = event.oldSubscription
          ? event.oldSubscription.options.applicationServerKey
          : undefined
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
        await fetch('/api/v1/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
            subscription: newSubscription.toJSON(),
          }),
        })
      } catch {
        // Best effort -- if this fails the user's existing "Get a dated
        // reminder each day" opt-in will just stop delivering until they
        // revisit and the client-side check re-subscribes them.
      }
    })()
  )
})
