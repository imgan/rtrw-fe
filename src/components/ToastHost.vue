<script setup>
import { CircleCheck, CircleAlert, Info, X } from '@lucide/vue';
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();
const icons = { success: CircleCheck, error: CircleAlert, info: Info };
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.type}`">
        <component :is="icons[t.type]" :size="18" />
        <span>{{ t.message }}</span>
        <button class="toast__close" aria-label="Tutup" @click="dismiss(t.id)"><X :size="16" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  max-width: calc(100vw - 40px);
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
}
.toast--success { color: var(--primary); }
.toast--error { color: var(--danger); }
.toast--info { color: var(--link); }
.toast span { flex: 1; color: var(--text); }
.toast__close { color: var(--muted); display: flex; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
