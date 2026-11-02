<script setup>
import { ref } from 'vue';
import { ImageUp, X } from '@lucide/vue';
import { uploadFile } from '@/services/cms';
import { assetUrl, errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';

const MAX_PHOTOS = 8;
const model = defineModel({ type: Array, default: () => [] });

const toast = useToast();
const uploading = ref(false);
const input = ref(null);

async function onPick(e) {
  const files = [...e.target.files];
  e.target.value = '';
  const room = MAX_PHOTOS - model.value.length;
  if (files.length > room) toast.error(`Maksimal ${MAX_PHOTOS} foto; ${files.length - room} foto tidak diunggah.`);
  uploading.value = true;
  try {
    for (const file of files.slice(0, room)) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} melebihi 3 MB`);
        continue;
      }
      model.value = [...model.value, await uploadFile(file)];
    }
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="photos">
    <div v-for="(url, i) in model" :key="url" class="photos__item">
      <img :src="assetUrl(url)" alt="" />
      <span v-if="i === 0" class="photos__cover">Sampul</span>
      <button type="button" class="photos__remove" title="Hapus foto" @click="model = model.filter((u) => u !== url)"><X :size="14" /></button>
    </div>
    <button v-if="model.length < MAX_PHOTOS" type="button" class="photos__add" :disabled="uploading" @click="input.click()">
      <span v-if="uploading" class="spinner photos__spinner" /><ImageUp v-else :size="20" />
      {{ uploading ? 'Mengunggah…' : 'Tambah Foto' }}
    </button>
    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="onPick" />
  </div>
  <small class="photos__hint">JPG / PNG / WEBP, maks. 3 MB per foto, hingga {{ MAX_PHOTOS }} foto. Foto pertama menjadi sampul.</small>
</template>

<style scoped>
.photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 10px; }
.photos__item, .photos__add { aspect-ratio: 4 / 3; border-radius: 8px; overflow: hidden; }
.photos__item { position: relative; border: 1px solid var(--border); }
.photos__item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photos__cover { position: absolute; left: 6px; bottom: 6px; padding: 1px 7px; border-radius: 5px; background: var(--primary); color: #fff; font-size: 11px; font-weight: 600; }
.photos__remove { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; border-radius: 50%; background: rgba(15, 23, 42, 0.7); color: #fff; display: grid; place-items: center; }
.photos__add { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 1px dashed var(--subtle); color: var(--muted); font-size: 12.5px; font-weight: 600; background: var(--surface-muted); }
.photos__add:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.photos__spinner { border-color: rgba(15, 23, 42, 0.15); border-top-color: var(--primary); }
.photos__hint { color: var(--muted); font-size: 12px; }
</style>
