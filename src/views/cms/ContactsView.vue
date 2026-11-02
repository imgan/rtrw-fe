<script setup>
import { onMounted, reactive, ref } from 'vue';
import { MessageSquare, Pencil, Phone, PhoneCall, Plus, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import { contactsApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList(contactsApi);

const tones = [
  { value: 'primary', label: 'Utama (hijau)' },
  { value: 'default', label: 'Biasa' },
  { value: 'danger', label: 'Darurat (merah)' },
];
const toneBadge = { primary: 'badge--green', default: 'badge--gray', danger: 'badge--red' };

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

function open(item = {}) {
  Object.assign(form, {
    nama: '', keterangan: '', telepon: '', aksi: 'telepon', tone: 'default',
    urutan: (meta.value.total || 0) + 1, is_active: true, ...item,
  });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const { id, created_at, updated_at, ...payload } = form;
    const res = editing.value.id ? await contactsApi.update(editing.value.id, payload) : await contactsApi.create(payload);
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
        <div class="cms-icon"><PhoneCall :size="20" /></div>
        <div>
          <h2>Kontak Pengurus &amp; Darurat</h2>
          <p>Kontak aktif tampil di bagian "Siaga Cepat" beranda, berurutan sesuai nomor urut.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Kontak</button>
    </div>

    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari nama, keterangan, atau nomor…" />
      </div>
    </div>

    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr><th>Urut</th><th>Nama</th><th>Nomor</th><th>Tombol</th><th>Gaya</th><th>Status</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="7" class="empty">Belum ada kontak.</td></tr>
          <template v-else>
            <tr v-for="c in rows" :key="c.id">
              <td>{{ c.urutan }}</td>
              <td><strong>{{ c.nama }}</strong><small>{{ c.keterangan }}</small></td>
              <td class="nowrap">{{ c.telepon || '—' }}</td>
              <td class="nowrap">
                <MessageSquare v-if="c.aksi === 'whatsapp'" :size="14" /><Phone v-else :size="14" />
                {{ c.aksi === 'whatsapp' ? 'WhatsApp' : 'Telepon' }}
              </td>
              <td><span class="badge" :class="toneBadge[c.tone]">{{ tones.find((t) => t.value === c.tone)?.label }}</span></td>
              <td>
                <span class="badge" :class="c.is_active ? 'badge--green' : 'badge--gray'">{{ c.is_active ? 'Tampil' : 'Disembunyikan' }}</span>
              </td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(c)"><Pencil :size="15" /></button>
                  <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = c"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Kontak' : 'Tambah Kontak'" @close="editing = null">
    <form id="contact-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field span-2">
        <label class="field__label">Nama *</label>
        <input v-model="form.nama" class="input" :class="{ 'input--invalid': errors.nama }" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Keterangan / Jabatan</label>
        <input v-model="form.keterangan" class="input" placeholder="mis. Sekretaris (Urusan Surat & KK)" />
      </div>
      <div class="field">
        <label class="field__label">Nomor Telepon</label>
        <input v-model="form.telepon" class="input" inputmode="tel" :class="{ 'input--invalid': errors.telepon }" placeholder="0812-xxxx-xxxx" />
        <span v-if="errors.telepon" class="field__error">{{ errors.telepon }}</span>
      </div>
      <div class="field">
        <label class="field__label">Tombol Aksi</label>
        <select v-model="form.aksi" class="input">
          <option value="telepon">Telepon langsung</option>
          <option value="whatsapp">Chat WhatsApp</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Gaya Tampilan</label>
        <select v-model="form.tone" class="input">
          <option v-for="t in tones" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Nomor Urut</label>
        <input v-model.number="form.urutan" type="number" class="input" />
      </div>
      <label class="check span-2"><input v-model="form.is_active" type="checkbox" /> Tampilkan di beranda</label>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="contact-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Kontak" :action="() => remove(deleting.id)" @close="deleting = null">
    Kontak <strong>{{ deleting.nama }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>
