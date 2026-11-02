<script setup>
import { onMounted, reactive, ref } from 'vue';
import { CalendarDays, ImageOff, Pencil, Plus, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import PhotosUpload from '@/components/PhotosUpload.vue';
import { activitiesApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate, today } from '@/utils/format';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList(activitiesApi, { published: '' });

const presetCategories = ['Gotong Royong', 'Kesehatan', 'Keagamaan', 'Olahraga', 'Rapat Warga', 'Perayaan'];

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

function open(item = {}) {
  Object.assign(form, {
    judul: '', kategori: '', deskripsi: '', tanggal: today(), waktu: '', lokasi: '', penanggung_jawab: '', fotos: [], is_published: true,
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
    const res = editing.value.id ? await activitiesApi.update(editing.value.id, payload) : await activitiesApi.create(payload);
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
        <div class="cms-icon"><CalendarDays :size="20" /></div>
        <div>
          <h2>Kegiatan Warga</h2>
          <p>6 kegiatan terbaru yang terbit tampil di beranda publik beserta fotonya.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Kegiatan</button>
    </div>

    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari judul, kategori, atau lokasi…" />
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
          <tr><th>Foto</th><th>Kegiatan</th><th>Tanggal</th><th>Lokasi</th><th>Status</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="6" class="empty">Belum ada kegiatan.</td></tr>
          <template v-else>
            <tr v-for="a in rows" :key="a.id">
              <td>
                <div class="thumb">
                  <img v-if="a.fotos.length" :src="a.fotos[0]" alt="" />
                  <ImageOff v-else :size="18" />
                  <span v-if="a.fotos.length > 1" class="thumb__count">{{ a.fotos.length }}</span>
                </div>
              </td>
              <td><strong>{{ a.judul }}</strong><small>{{ a.kategori }}</small></td>
              <td class="nowrap">{{ formatDate(a.tanggal, 'short') }}<small>{{ a.waktu }}</small></td>
              <td>{{ a.lokasi || '—' }}</td>
              <td><span class="badge" :class="a.is_published ? 'badge--green' : 'badge--gray'">{{ a.is_published ? 'Terbit' : 'Draf' }}</span></td>
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

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Kegiatan' : 'Tambah Kegiatan'" width="720px" @close="editing = null">
    <form id="activity-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field span-2">
        <label class="field__label">Judul Kegiatan *</label>
        <input v-model="form.judul" class="input" :class="{ 'input--invalid': errors.judul }" />
        <span v-if="errors.judul" class="field__error">{{ errors.judul }}</span>
      </div>
      <div class="field">
        <label class="field__label">Kategori *</label>
        <input v-model="form.kategori" class="input" list="activity-cats" :class="{ 'input--invalid': errors.kategori }" />
        <datalist id="activity-cats"><option v-for="c in presetCategories" :key="c" :value="c" /></datalist>
        <span v-if="errors.kategori" class="field__error">{{ errors.kategori }}</span>
      </div>
      <div class="field">
        <label class="field__label">Penanggung Jawab</label>
        <input v-model="form.penanggung_jawab" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Tanggal *</label>
        <input v-model="form.tanggal" type="date" class="input" :class="{ 'input--invalid': errors.tanggal }" />
        <span v-if="errors.tanggal" class="field__error">{{ errors.tanggal }}</span>
      </div>
      <div class="field">
        <label class="field__label">Waktu</label>
        <input v-model="form.waktu" class="input" placeholder="mis. 08.00–11.00 WIB" />
      </div>
      <div class="field span-2">
        <label class="field__label">Lokasi</label>
        <input v-model="form.lokasi" class="input" />
      </div>
      <div class="field span-2">
        <label class="field__label">Deskripsi *</label>
        <textarea v-model="form.deskripsi" class="input" rows="3" :class="{ 'input--invalid': errors.deskripsi }" />
        <span v-if="errors.deskripsi" class="field__error">{{ errors.deskripsi }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Foto Kegiatan</label>
        <PhotosUpload v-model="form.fotos" />
      </div>
      <label class="check span-2"><input v-model="form.is_published" type="checkbox" /> Terbitkan di beranda publik</label>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="activity-form" :disabled="saving"><span v-if="saving" class="spinner" /> Simpan</button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Kegiatan" :action="() => remove(deleting.id)" @close="deleting = null">
    Kegiatan <strong>{{ deleting.judul }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>

<style scoped>
.thumb { position: relative; width: 72px; height: 54px; border-radius: 7px; overflow: hidden; background: var(--surface-muted); color: var(--subtle); display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb__count { position: absolute; right: 3px; bottom: 3px; padding: 0 5px; border-radius: 4px; background: rgba(15, 23, 42, 0.75); color: #fff; font-size: 11px; font-weight: 600; }
</style>
