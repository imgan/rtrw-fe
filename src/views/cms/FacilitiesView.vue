<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Building2, ImageOff, Pencil, Plus, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import PhotosUpload from '@/components/PhotosUpload.vue';
import { facilitiesApi } from '@/services/cms';
import { assetUrl, errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList(facilitiesApi, { kondisi: '' });

const conditions = { baik: { label: 'Baik', badge: 'badge--green' }, perbaikan: { label: 'Dalam Perbaikan', badge: 'badge--amber' }, rusak: { label: 'Rusak', badge: 'badge--red' } };
const presetCategories = ['Gedung Serbaguna', 'Olahraga', 'Keamanan', 'Ibadah', 'Ruang Terbuka', 'Kebersihan'];

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

function open(item = {}) {
  Object.assign(form, {
    nama: '', kategori: '', deskripsi: '', lokasi: '', kondisi: 'baik', jam_operasional: '', penanggung_jawab: '', fotos: [],
    urutan: meta.value.total + 1, is_active: true,
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
    const res = editing.value.id ? await facilitiesApi.update(editing.value.id, payload) : await facilitiesApi.create(payload);
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
        <div class="cms-icon"><Building2 :size="20" /></div>
        <div>
          <h2>Fasilitas Umum</h2>
          <p>Fasilitas yang berstatus tampil muncul di beranda publik beserta fotonya.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Fasilitas</button>
    </div>

    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari nama, kategori, atau lokasi…" />
      </div>
      <select v-model="filters.kondisi" class="input">
        <option value="">Semua kondisi</option>
        <option v-for="(c, key) in conditions" :key="key" :value="key">{{ c.label }}</option>
      </select>
    </div>

    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr><th>Foto</th><th>Fasilitas</th><th>Lokasi</th><th>Kondisi</th><th>Tampil</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="6" class="empty">Belum ada fasilitas.</td></tr>
          <template v-else>
            <tr v-for="f in rows" :key="f.id">
              <td>
                <div class="thumb">
                  <img v-if="f.fotos.length" :src="assetUrl(f.fotos[0])" alt="" />
                  <ImageOff v-else :size="18" />
                  <span v-if="f.fotos.length > 1" class="thumb__count">{{ f.fotos.length }}</span>
                </div>
              </td>
              <td><strong>{{ f.nama }}</strong><small>{{ f.kategori }}</small></td>
              <td>{{ f.lokasi || '—' }}<small>{{ f.jam_operasional }}</small></td>
              <td><span class="badge" :class="conditions[f.kondisi].badge">{{ conditions[f.kondisi].label }}</span></td>
              <td><span class="badge" :class="f.is_active ? 'badge--green' : 'badge--gray'">{{ f.is_active ? 'Tampil' : 'Disembunyikan' }}</span></td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(f)"><Pencil :size="15" /></button>
                  <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = f"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Fasilitas' : 'Tambah Fasilitas'" width="720px" @close="editing = null">
    <form id="facility-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field">
        <label class="field__label">Nama Fasilitas *</label>
        <input v-model="form.nama" class="input" :class="{ 'input--invalid': errors.nama }" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field">
        <label class="field__label">Kategori *</label>
        <input v-model="form.kategori" class="input" list="facility-cats" :class="{ 'input--invalid': errors.kategori }" />
        <datalist id="facility-cats"><option v-for="c in presetCategories" :key="c" :value="c" /></datalist>
        <span v-if="errors.kategori" class="field__error">{{ errors.kategori }}</span>
      </div>
      <div class="field">
        <label class="field__label">Lokasi</label>
        <input v-model="form.lokasi" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Kondisi</label>
        <select v-model="form.kondisi" class="input">
          <option v-for="(c, key) in conditions" :key="key" :value="key">{{ c.label }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Jam Operasional</label>
        <input v-model="form.jam_operasional" class="input" placeholder="mis. Setiap hari, 08.00–21.00 WIB" />
      </div>
      <div class="field">
        <label class="field__label">Penanggung Jawab</label>
        <input v-model="form.penanggung_jawab" class="input" />
      </div>
      <div class="field span-2">
        <label class="field__label">Deskripsi</label>
        <textarea v-model="form.deskripsi" class="input" rows="3" />
      </div>
      <div class="field span-2">
        <label class="field__label">Foto Fasilitas</label>
        <PhotosUpload v-model="form.fotos" />
      </div>
      <div class="field">
        <label class="field__label">Nomor Urut</label>
        <input v-model.number="form.urutan" type="number" class="input" />
      </div>
      <label class="check"><input v-model="form.is_active" type="checkbox" /> Tampilkan di beranda publik</label>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="facility-form" :disabled="saving"><span v-if="saving" class="spinner" /> Simpan</button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Fasilitas" :action="() => remove(deleting.id)" @close="deleting = null">
    Fasilitas <strong>{{ deleting.nama }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>

<style scoped>
.thumb { position: relative; width: 72px; height: 54px; border-radius: 7px; overflow: hidden; background: var(--surface-muted); color: var(--subtle); display: grid; place-items: center; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb__count { position: absolute; right: 3px; bottom: 3px; padding: 0 5px; border-radius: 4px; background: rgba(15, 23, 42, 0.75); color: #fff; font-size: 11px; font-weight: 600; }
</style>
