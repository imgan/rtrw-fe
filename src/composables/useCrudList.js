import { reactive, ref, watch } from 'vue';
import { errorMessage } from '@/services/api';
import { useToast } from './useToast';

/**
 * State daftar + paginasi + hapus untuk halaman CMS.
 * `filters` boleh berisi `search` (di-debounce) dan filter lain (langsung memuat ulang).
 */
export function useCrudList(resourceApi, initialFilters = {}) {
  const toast = useToast();
  const rows = ref([]);
  const meta = ref({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const loading = ref(false);
  const filters = reactive({ search: '', page: 1, limit: 10, ...initialFilters });

  async function load() {
    loading.value = true;
    try {
      const res = await resourceApi.list(filters);
      rows.value = res.data;
      meta.value = res.meta;
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      loading.value = false;
    }
  }

  let timer;
  watch(() => filters.search, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      filters.page = 1;
      load();
    }, 350);
  });
  const otherKeys = Object.keys(filters).filter((k) => k !== 'search' && k !== 'page');
  watch(() => otherKeys.map((k) => filters[k]), () => {
    filters.page = 1;
    load();
  });

  function goTo(page) {
    if (page < 1 || page > meta.value.total_pages) return;
    filters.page = page;
    load();
  }

  async function remove(id) {
    const res = await resourceApi.remove(id);
    toast.success(res.message);
    if (rows.value.length === 1 && filters.page > 1) filters.page--;
    await load();
  }

  return { rows, meta, loading, filters, load, goTo, remove };
}
