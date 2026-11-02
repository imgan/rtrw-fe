<script setup>
import { reactive, ref } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import ImageUpload from '@/components/ImageUpload.vue';
import { officialsApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { today } from '@/utils/format';

const props = defineProps({
  official: { type: Object, default: null },
  rtList: { type: Array, default: () => [] },
  nextOrder: { type: Number, default: 1 },
});
const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const saving = ref(false);
const errors = ref({});
const isEdit = Boolean(props.official?.id);

const form = reactive({
  nama: '', jabatan: '', satuan: 'RW', label: '', warna: 'blue', nik: '', no_wa: '', domisili: '', foto: '',
  no_sk: '', status_label: '', urutan: props.nextOrder, is_utama: true, is_active: true,
  catat_mutasi: true, tanggal_efektif: today(),
  ...(props.official || {}),
});

const colors = [
  { value: 'blue', label: 'Biru — Pengurus induk RW' },
  { value: 'green', label: 'Hijau — Ketua RT' },
  { value: 'dark', label: 'Gelap — Seksi / koordinator' },
  { value: 'amber', label: 'Kuning — Lainnya' },
];
const labelPresets = ['Pengurus Induk RW', 'Ketua RT Terpilih', 'Pengurus RT', 'Seksi Keamanan & Trantib', 'Seksi Kebersihan', 'Seksi Rohani', 'Humas'];

async function submit() {
  saving.value = true;
  errors.value = {};
  try {
    const { id, created_at, updated_at, ...payload } = form;
    const res = isEdit ? await officialsApi.update(id, payload) : await officialsApi.create(payload);
    toast.success(res.message);
    emit('saved');
  } catch (err) {
    errors.value = fieldErrors(err);
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEdit ? 'Ubah Data Pengurus' : 'Tambah Posisi Pengurus'" width="760px" @close="emit('close')">
    <form id="official-form" class="form-grid" novalidate @submit.prevent="submit">
      <div class="field span-2">
        <label class="field__label">Foto Pejabat</label>
        <ImageUpload v-model="form.foto" ratio="1 / 1" class="photo" />
      </div>
      <div class="field">
        <label class="field__label">Nama Lengkap & Gelar *</label>
        <input v-model="form.nama" class="input" :class="{ 'input--invalid': errors.nama }" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field">
        <label class="field__label">Jabatan *</label>
        <input v-model="form.jabatan" class="input" placeholder="mis. Bendahara RT 02" :class="{ 'input--invalid': errors.jabatan }" />
        <span v-if="errors.jabatan" class="field__error">{{ errors.jabatan }}</span>
      </div>
      <div class="field">
        <label class="field__label">Satuan Wilayah</label>
        <select v-model="form.satuan" class="input">
          <option value="RW">Pengurus Inti RW</option>
          <option v-for="rt in rtList" :key="rt" :value="rt">{{ rt }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Label Kartu</label>
        <input v-model="form.label" class="input" list="official-labels" />
        <datalist id="official-labels"><option v-for="l in labelPresets" :key="l" :value="l" /></datalist>
      </div>
      <div class="field">
        <label class="field__label">NIK</label>
        <input v-model="form.nik" class="input" inputmode="numeric" maxlength="16" :class="{ 'input--invalid': errors.nik }" />
        <span v-if="errors.nik" class="field__error">{{ errors.nik }}</span>
      </div>
      <div class="field">
        <label class="field__label">No. WhatsApp</label>
        <input v-model="form.no_wa" class="input" inputmode="tel" placeholder="+62 8xx-xxxx-xxxx" :class="{ 'input--invalid': errors.no_wa }" />
        <span v-if="errors.no_wa" class="field__error">{{ errors.no_wa }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Domisili</label>
        <input v-model="form.domisili" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Nomor SK</label>
        <input v-model="form.no_sk" class="input" placeholder="142/SK-SKM/2023" />
      </div>
      <div class="field">
        <label class="field__label">Label Status</label>
        <input v-model="form.status_label" class="input" placeholder="mis. Masa Aktif: Th. 2" />
      </div>
      <div class="field">
        <label class="field__label">Warna Kartu</label>
        <select v-model="form.warna" class="input">
          <option v-for="c in colors" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Nomor Urut</label>
        <input v-model.number="form.urutan" type="number" class="input" />
      </div>
      <label class="check"><input v-model="form.is_utama" type="checkbox" /> Pejabat utama</label>
      <label class="check"><input v-model="form.is_active" type="checkbox" /> Aktif menjabat</label>

      <template v-if="!isEdit">
        <label class="check span-2"><input v-model="form.catat_mutasi" type="checkbox" /> Catat sebagai pengangkatan di riwayat mutasi</label>
        <div v-if="form.catat_mutasi" class="field">
          <label class="field__label">Tanggal Efektif</label>
          <input v-model="form.tanggal_efektif" type="date" class="input" />
        </div>
      </template>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="emit('close')">Batal</button>
      <button class="btn btn--primary" type="submit" form="official-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.photo :deep(.upload__preview) { max-width: 120px; }
</style>
