<script setup>
import { reactive, ref } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import { mutationsApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { today } from '@/utils/format';

const props = defineProps({ mutation: { type: Object, default: null } });
const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const saving = ref(false);
const errors = ref({});
const isEdit = Boolean(props.mutation?.id);

const form = reactive({
  tanggal_efektif: today(), jabatan: '', pejabat_lama: '', keterangan_lama: '', pejabat_baru: '',
  keterangan_baru: '', no_sk: '', status: 'disahkan',
  ...(props.mutation || {}),
});

async function submit() {
  saving.value = true;
  errors.value = {};
  try {
    const { id, created_at, updated_at, official_id, ...payload } = form;
    const res = isEdit ? await mutationsApi.update(id, payload) : await mutationsApi.create(payload);
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
  <BaseModal :title="isEdit ? 'Ubah Riwayat Mutasi' : 'Catat Riwayat Mutasi'" width="680px" @close="emit('close')">
    <p class="note">Riwayat hanya mencatat log. Untuk mengganti pejabat aktif gunakan tombol <b>Ganti Pejabat</b> pada kartu.</p>
    <form id="mutation-form" class="form-grid" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field__label">Tanggal Efektif *</label>
        <input v-model="form.tanggal_efektif" type="date" class="input" :class="{ 'input--invalid': errors.tanggal_efektif }" />
        <span v-if="errors.tanggal_efektif" class="field__error">{{ errors.tanggal_efektif }}</span>
      </div>
      <div class="field">
        <label class="field__label">Status Berkas</label>
        <select v-model="form.status" class="input">
          <option value="disahkan">Disahkan</option>
          <option value="diproses">Diproses</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>
      <div class="field span-2">
        <label class="field__label">Jabatan & Lingkungan *</label>
        <input v-model="form.jabatan" class="input" :class="{ 'input--invalid': errors.jabatan }" />
        <span v-if="errors.jabatan" class="field__error">{{ errors.jabatan }}</span>
      </div>
      <div class="field">
        <label class="field__label">Pejabat Lama</label>
        <input v-model="form.pejabat_lama" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Keterangan Pejabat Lama</label>
        <input v-model="form.keterangan_lama" class="input" placeholder="mis. Demisioner" />
      </div>
      <div class="field">
        <label class="field__label">Pejabat Baru *</label>
        <input v-model="form.pejabat_baru" class="input" :class="{ 'input--invalid': errors.pejabat_baru }" />
        <span v-if="errors.pejabat_baru" class="field__error">{{ errors.pejabat_baru }}</span>
      </div>
      <div class="field">
        <label class="field__label">Keterangan Pejabat Baru</label>
        <input v-model="form.keterangan_baru" class="input" placeholder="mis. Terpilih Kembali" />
      </div>
      <div class="field span-2">
        <label class="field__label">No. SK Kelurahan</label>
        <input v-model="form.no_sk" class="input" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="emit('close')">Batal</button>
      <button class="btn btn--primary" type="submit" form="mutation-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.note { margin-bottom: 18px; padding: 10px 14px; border-radius: 8px; background: var(--warning-soft); color: var(--warning); font-size: 13px; }
</style>
