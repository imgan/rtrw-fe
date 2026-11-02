<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Hammer, Pencil, Plus, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import { projectsApi } from '@/services/layanan';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate, formatNumber, formatRupiah } from '@/utils/format';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList(projectsApi);

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

const nilaiText = computed({
  get: () => (form.nilai ? formatNumber(form.nilai) : ''),
  set: (v) => (form.nilai = Number(String(v).replace(/\D/g, '')) || 0),
});

function open(item = {}) {
  Object.assign(form, {
    nama_kegiatan: '', no_sk: '', tgl_sk: '', tgl_mulai: '', tgl_selesai: '', nilai: 0, asal_projek: '', volume: '',
    ...item,
    nilai: Number(item.nilai) || 0,
  });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const { id, created_at, updated_at, ...payload } = form;
    const res = editing.value.id ? await projectsApi.update(editing.value.id, payload) : await projectsApi.create(payload);
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
        <div class="cms-icon"><Hammer :size="20" /></div>
        <div>
          <h2>Pembangunan Lingkungan</h2>
          <p>Catat kegiatan pembangunan beserta SK, jadwal, nilai, dan asal projek.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Kegiatan</button>
    </div>
    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari kegiatan, No. SK, atau asal projek…" />
      </div>
    </div>
    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr><th>Nama Kegiatan</th><th>SK</th><th>Pekerjaan</th><th class="right">Nilai Projek</th><th>Asal Projek</th><th>Volume</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="7" class="empty">Belum ada kegiatan pembangunan.</td></tr>
          <template v-else>
            <tr v-for="p in rows" :key="p.id">
              <td><strong>{{ p.nama_kegiatan }}</strong></td>
              <td class="nowrap">{{ p.no_sk || '—' }}<small>{{ formatDate(p.tgl_sk, 'short') }}</small></td>
              <td class="nowrap">{{ formatDate(p.tgl_mulai, 'short') }}<small>s.d. {{ formatDate(p.tgl_selesai, 'short') }}</small></td>
              <td class="right nowrap">{{ formatRupiah(p.nilai) }}</td>
              <td>{{ p.asal_projek || '—' }}</td>
              <td>{{ p.volume || '—' }}</td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(p)"><Pencil :size="15" /></button>
                  <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = p"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Kegiatan' : 'Tambah Kegiatan'" width="680px" @close="editing = null">
    <form id="project-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field span-2">
        <label class="field__label">Nama Kegiatan *</label>
        <input v-model="form.nama_kegiatan" class="input" :class="{ 'input--invalid': errors.nama_kegiatan }" />
        <span v-if="errors.nama_kegiatan" class="field__error">{{ errors.nama_kegiatan }}</span>
      </div>
      <div class="field"><label class="field__label">No. SK</label><input v-model="form.no_sk" class="input" /></div>
      <div class="field"><label class="field__label">Tanggal SK</label><input v-model="form.tgl_sk" type="date" class="input" /></div>
      <div class="field"><label class="field__label">Tanggal Awal Pekerjaan</label><input v-model="form.tgl_mulai" type="date" class="input" /></div>
      <div class="field">
        <label class="field__label">Tanggal Akhir Pekerjaan</label>
        <input v-model="form.tgl_selesai" type="date" class="input" :class="{ 'input--invalid': errors.tgl_selesai }" />
        <span v-if="errors.tgl_selesai" class="field__error">{{ errors.tgl_selesai }}</span>
      </div>
      <div class="field">
        <label class="field__label">Nilai Projek (Rp) *</label>
        <input v-model="nilaiText" class="input" inputmode="numeric" placeholder="0" :class="{ 'input--invalid': errors.nilai }" />
        <span v-if="errors.nilai" class="field__error">{{ errors.nilai }}</span>
      </div>
      <div class="field"><label class="field__label">Asal Projek</label><input v-model="form.asal_projek" class="input" placeholder="mis. Dana Kelurahan" /></div>
      <div class="field"><label class="field__label">Volume</label><input v-model="form.volume" class="input" placeholder="mis. 120 meter" /></div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="project-form" :disabled="saving"><span v-if="saving" class="spinner" /> Simpan</button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Kegiatan" :action="() => remove(deleting.id)" @close="deleting = null">
    Kegiatan <strong>{{ deleting.nama_kegiatan }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>
