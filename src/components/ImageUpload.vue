<script setup>
import { ref } from 'vue';
import { ImageUp, Trash2 } from '@lucide/vue';
import { uploadFile } from '@/services/cms';
import { errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';

const model = defineModel({ type: String, default: '' });
defineProps({ ratio: { type: String, default: '16 / 9' } });

const toast = useToast();
const uploading = ref(false);
const input = ref(null);

async function onPick(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 3 MB');
  uploading.value = true;
  try {
    model.value = await uploadFile(file);
    toast.success('Gambar terunggah. Jangan lupa simpan perubahan.');
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="upload">
    <div class="upload__preview" :style="{ aspectRatio: ratio }">
      <img v-if="model" :src="model" alt="" />
      <span v-else>Belum ada gambar</span>
    </div>
    <div class="upload__actions">
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick" />
      <button type="button" class="btn btn--ghost btn--sm" :disabled="uploading" @click="input.click()">
        <span v-if="uploading" class="spinner spinner--dark" /><ImageUp v-else :size="15" />
        {{ model ? 'Ganti Gambar' : 'Unggah Gambar' }}
      </button>
      <button v-if="model" type="button" class="btn btn--ghost btn--sm" @click="model = ''">
        <Trash2 :size="15" /> Hapus
      </button>
      <small>JPG / PNG / WEBP, maks. 3 MB</small>
    </div>
  </div>
</template>

<style scoped>
.upload { display: flex; flex-direction: column; gap: 10px; }
.upload__preview { width: 100%; max-width: 420px; border-radius: 10px; overflow: hidden; border: 1px dashed var(--border); background: var(--surface-muted); display: grid; place-items: center; color: var(--subtle); font-size: 13px; }
.upload__preview img { width: 100%; height: 100%; object-fit: cover; }
.upload__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.upload__actions small { color: var(--muted); font-size: 12px; }
.spinner--dark { border-color: rgba(15, 23, 42, 0.15); border-top-color: var(--primary); }
</style>
