<script setup>
import { ChevronLeft, ChevronRight } from '@lucide/vue';

defineProps({ meta: { type: Object, required: true } });
const limit = defineModel('limit', { type: Number, default: 10 });
const emit = defineEmits(['go']);
</script>

<template>
  <div class="pager">
    <div class="pager__size">
      Tampilkan
      <select v-model.number="limit" class="input">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
      baris · {{ meta.total }} data
    </div>
    <div class="pager__nav">
      <span>Halaman {{ meta.page }} dari {{ meta.total_pages }}</span>
      <button class="btn btn--icon btn--ghost" :disabled="meta.page <= 1" @click="emit('go', meta.page - 1)">
        <ChevronLeft :size="16" />
      </button>
      <button class="btn btn--icon btn--ghost" :disabled="meta.page >= meta.total_pages" @click="emit('go', meta.page + 1)">
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pager { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 14px 22px; border-top: 1px solid var(--border); font-size: 14px; color: var(--muted); }
.pager__size, .pager__nav { display: flex; align-items: center; gap: 8px; }
.pager__size .input { width: 74px; height: 34px; padding: 0 8px; }
</style>
