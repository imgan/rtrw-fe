<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { X } from '@lucide/vue';

defineProps({
  title: { type: String, required: true },
  width: { type: String, default: '560px' },
});
const emit = defineEmits(['close']);

const onKey = (e) => e.key === 'Escape' && emit('close');
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @mousedown.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true" :style="{ maxWidth: width }">
        <header class="modal__head">
          <h3>{{ title }}</h3>
          <button class="btn btn--icon btn--ghost" aria-label="Tutup" @click="emit('close')"><X :size="16" /></button>
        </header>
        <div class="modal__body"><slot /></div>
        <footer v-if="$slots.footer" class="modal__foot"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}
.modal {
  width: 100%;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.modal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
.modal__head h3 { font-size: 17px; }
.modal__body { padding: 22px; overflow-y: auto; }
.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
}
</style>
