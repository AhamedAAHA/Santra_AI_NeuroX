/** One-time browser migration from legacy "sentra-*" keys to "santra-*". */
export function migrateSentraBrandStorage() {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (!key.startsWith("sentra")) continue;
      const next = key.replace(/^sentra/, "santra");
      if (!window.localStorage.getItem(next)) {
        const value = window.localStorage.getItem(key);
        if (value != null) window.localStorage.setItem(next, value);
      }
    }
  } catch {
    // ignore private-mode / storage failures
  }

  try {
    const legacyCookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("sentra-local-session="));
    if (legacyCookie && !document.cookie.includes("santra-local-session=")) {
      const value = legacyCookie.slice("sentra-local-session=".length);
      document.cookie = `santra-local-session=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}
