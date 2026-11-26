// Sends the login cookie automatically. If your app keeps the token elsewhere, tell me.
export async function authFetch(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}
