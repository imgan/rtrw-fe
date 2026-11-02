<script setup>
import { ref } from 'vue';
import BaseModal from './BaseModal.vue';
import { errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  title: { type: String, default: 'Konfirmasi' },
  confirmLabel: { type: String, default: 'Ya, Hapus' },
  danger: { type: Boolean, default: true },
  action: { type: Function, required: true },
});
const emit = defineEmits(['close']);

const toast = useToast();
const busy = ref(false);

async function run() {
  busy.value = true;
  try {
    await props.action();
    emit('close');
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BaseModal :title="title" width="440px" @close="emit('close')">
    <p class="text"><slot /></p>
    <template #footer>
      <button class="btn btn--ghost" @click="emit('close')">Batal</button>
      <button class="btn" :class="danger ? 'btn--danger' : 'btn--primary'" :disabled="busy" @click="run">
        <span v-if="busy" class="spinner" /> {{ confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.text { line-height: 1.6; color: var(--muted); }
.text :deep(strong) { color: var(--text); }
</style>
