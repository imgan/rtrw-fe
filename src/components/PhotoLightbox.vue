<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ChevronLeft, ChevronRight, X } from '@lucide/vue';
import { assetUrl } from '@/services/api';

const props = defineProps({
  photos: { type: Array, required: true },
  title: { type: String, default: '' },
});
const emit = defineEmits(['close']);

const index = ref(0);
const step = (delta) => {
  index.value = (index.value + delta + props.photos.length) % props.photos.length;
};

function onKey(e) {
  if (e.key === 'Escape') emit('close');
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <div class="box" role="dialog" aria-modal="true" :aria-label="`Foto ${title}`" @click.self="emit('close')">
      <button class="box__close" aria-label="Tutup" @click="emit('close')"><X :size="22" /></button>
      <button v-if="photos.length > 1" class="box__nav box__nav--prev" aria-label="Foto sebelumnya" @click="step(-1)"><ChevronLeft :size="26" /></button>
      <figure>
        <img :src="assetUrl(photos[index])" :alt="`${title}, foto ${index + 1}`" />
        <figcaption>{{ title }} · {{ index + 1 }} / {{ photos.length }}</figcaption>
      </figure>
      <button v-if="photos.length > 1" class="box__nav box__nav--next" aria-label="Foto berikutnya" @click="step(1)"><ChevronRight :size="26" /></button>
    </div>
  </Teleport>
</template>

<style scoped>
.box { position: fixed; inset: 0; z-index: 60; background: rgba(15, 23, 42, 0.88); display: flex; align-items: center; justify-content: center; padding: 24px; }
figure { margin: 0; max-width: min(1000px, 100%); text-align: center; }
img { max-width: 100%; max-height: 80vh; border-radius: 10px; display: block; margin: 0 auto; }
figcaption { margin-top: 10px; color: #fff; font-size: 14px; }
.box__close, .box__nav { position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.16); color: #fff; display: grid; place-items: center; }
.box__close:hover, .box__nav:hover { background: rgba(255, 255, 255, 0.3); }
.box__close { top: 16px; right: 16px; }
.box__nav { top: 50%; transform: translateY(-50%); }
.box__nav--prev { left: 16px; }
.box__nav--next { right: 16px; }
</style>
