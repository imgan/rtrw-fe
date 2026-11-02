<script setup>
import { onMounted, ref, watch } from 'vue';
import { wargaOptions } from '@/services/layanan';

const model = defineModel({ type: [Number, String], default: '' });
const props = defineProps({ initial: { type: Object, default: null }, invalid: Boolean });

const search = ref('');
const options = ref(props.initial ? [props.initial] : []);

async function load() {
  const found = await wargaOptions(search.value);
  // Warga terpilih tetap ada di daftar walau tidak cocok dengan pencarian.
  const selected = options.value.find((o) => o.id === model.value);
  options.value = selected && !found.some((o) => o.id === selected.id) ? [selected, ...found] : found;
}

let timer;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(load, 300);
});
onMounted(load);
</script>

<template>
  <div class="picker">
    <input v-model="search" class="input" placeholder="Cari nama, NIK, atau No. KK…" />
    <select v-model.number="model" class="input" :class="{ 'input--invalid': invalid }">
      <option value="">— Pilih warga —</option>
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.nama }} · {{ o.nik }}</option>
    </select>
  </div>
</template>

<style scoped>
.picker { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 640px) { .picker { grid-template-columns: 1fr; } }
</style>
