<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Megaphone, Pencil, Plus, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import { announcementsApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate, today } from '@/utils/format';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList(announcementsApi, { published: '' });

const colors = [
  { value: 'green', label: 'Hijau (umum / gotong royong)' },
  { value: 'blue', label: 'Biru (kesehatan / informasi)' },
  { value: 'amber', label: 'Kuning (himbauan)' },
  { value: 'red', label: 'Merah (keamanan / penting)' },
];
const presetCategories = ['Gotong Royong', 'Kesehatan Lingkungan', 'Keamanan Wilayah', 'Kegiatan Warga', 'Informasi Umum'];
const colorBadge = { green: 'badge--green', blue: 'badge--blue', amber: 'badge--amber', red: 'badge--red' };

const editing = ref(null); // null = tertutup, {} = baru, {id..} = ubah
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

function open(item = {}) {
  Object.assign(form, {
    kategori: '', warna: 'green', judul: '', isi: '', tanggal: today(), penanggung_jawab: '', is_published: true,
    ...item,
  });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const { id, created_at, updated_at, ...payload } = form;
    const res = editing.value.id
      ? await announcementsApi.update(editing.value.id, payload)
      : await announcementsApi.create(payload);
    toast.success(res.message);
    editing.value = null;
    load();
  } catch (err) {
    errors.value = fieldErrors(err);
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="card">
    <div class="cms-toolbar">
      <div class="cms-toolbar__title">
        <div class="cms-icon"><Megaphone :size="20" /></div>
        <div>
          <h2>Warta Pengumuman &amp; Woro-Woro</h2>
          <p>3 pengumuman terbaru yang terbit tampil di beranda publik.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Pengumuman</button>
    </div>

    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari judul, kategori, atau isi…" />
      </div>
      <select v-model="filters.published" class="input">
        <option value="">Semua status</option>
        <option value="1">Terbit</option>
        <option value="0">Draf</option>
      </select>
    </div>

    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr><th>Tanggal</th><th>Judul</th><th>Kategori</th><th>Penanggung Jawab</th><th>Status</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="6" class="empty">Belum ada pengumuman.</td></tr>
          <template v-else>
            <tr v-for="a in rows" :key="a.id">
              <td class="nowrap">{{ formatDate(a.tanggal, 'short') }}</td>
              <td>
                <strong>{{ a.judul }}</strong>
                <small>{{ a.isi.length > 110 ? a.isi.slice(0, 110) + '…' : a.isi }}</small>
              </td>
              <td><span class="badge" :class="colorBadge[a.warna]">{{ a.kategori }}</span></td>
              <td>{{ a.penanggung_jawab || '—' }}</td>
              <td>
                <span class="badge" :class="a.is_published ? 'badge--green' : 'badge--gray'">
                  {{ a.is_published ? 'Terbit' : 'Draf' }}
                </span>
              </td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(a)"><Pencil :size="15" /></button>
                  <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = a"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Pengumuman' : 'Tambah Pengumuman'" width="680px" @close="editing = null">
    <form id="ann-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field">
        <label class="field__label">Kategori *</label>
        <input v-model="form.kategori" class="input" list="ann-cats" :class="{ 'input--invalid': errors.kategori }" />
        <datalist id="ann-cats"><option v-for="c in presetCategories" :key="c" :value="c" /></datalist>
        <span v-if="errors.kategori" class="field__error">{{ errors.kategori }}</span>
      </div>
      <div class="field">
        <label class="field__label">Warna Label</label>
        <select v-model="form.warna" class="input">
          <option v-for="c in colors" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div class="field span-2">
        <label class="field__label">Judul *</label>
        <input v-model="form.judul" class="input" :class="{ 'input--invalid': errors.judul }" />
        <span v-if="errors.judul" class="field__error">{{ errors.judul }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Isi Pengumuman *</label>
        <textarea v-model="form.isi" class="input" rows="4" :class="{ 'input--invalid': errors.isi }" />
        <span v-if="errors.isi" class="field__error">{{ errors.isi }}</span>
      </div>
      <div class="field">
        <label class="field__label">Tanggal *</label>
        <input v-model="form.tanggal" type="date" class="input" :class="{ 'input--invalid': errors.tanggal }" />
        <span v-if="errors.tanggal" class="field__error">{{ errors.tanggal }}</span>
      </div>
      <div class="field">
        <label class="field__label">Penanggung Jawab</label>
        <input v-model="form.penanggung_jawab" class="input" placeholder="mis. Koordinator: Sie Kebersihan" />
      </div>
      <label class="check span-2"><input v-model="form.is_published" type="checkbox" /> Terbitkan di beranda publik</label>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="ann-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Pengumuman" :action="() => remove(deleting.id)" @close="deleting = null">
    Pengumuman <strong>{{ deleting.judul }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>
