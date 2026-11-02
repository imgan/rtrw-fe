import { reactive } from 'vue';

const toasts = reactive([]);
let seq = 0;

export function useToast() {
  function show(message, type = 'success', timeout = 3500) {
    const id = ++seq;
    toasts.push({ id, message, type });
    setTimeout(() => dismiss(id), timeout);
  }
  function dismiss(id) {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }
  return {
    toasts,
    dismiss,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error', 5000),
    info: (m) => show(m, 'info'),
  };
}
