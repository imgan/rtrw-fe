// "Ingat sesi" → localStorage, selain itu sessionStorage (hilang saat tab ditutup).
const KEY = 'wh_token';

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const tokenStorage = {
  get: () => safe(() => localStorage.getItem(KEY) || sessionStorage.getItem(KEY)),
  set(token, remember) {
    this.clear();
    safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token));
  },
  clear() {
    safe(() => localStorage.removeItem(KEY));
    safe(() => sessionStorage.removeItem(KEY));
  },
};
