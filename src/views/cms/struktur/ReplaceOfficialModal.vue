<script setup>
import { reactive, ref } from 'vue';
import { ArrowRight } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ImageUpload from '@/components/ImageUpload.vue';
import { officialsApi } from '@/services/cms';
import { errorMessage, fieldErrors } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { today } from '@/utils/format';

const props = defineProps({ official: { type: Object, required: true } });
const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const saving = ref(false);
const errors = ref({});

const form = reactive({
  nama: '', nik: '', no_wa: '', domisili: '', foto: '', no_sk: props.official.no_sk || '',
  status_label: props.official.status_label || '', tanggal_efektif: today(),
  keterangan_lama: 'Demisioner', keterangan_baru: '', status: 'disahkan',
});
const reasonsOld = ['Demisioner', 'Habis Masa Bakti', 'Mengundurkan Diri', 'Pindah Domisili', 'Meninggal Dunia', 'Periode 1'];
const reasonsNew = ['Terpilih', 'Terpilih Kembali', 'Penunjukan Sementara (Plt.)', 'Usulan Rapat RT'];

async function submit() {
  saving.value = true;
  errors.value = {};
  try {
    const res = await officialsApi.replace(props.official.id, form);
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
  <BaseModal title="Ganti / Mutasi Pejabat" width="760px" @close="emit('close')">
    <div class="swap">
      <div>
        <small>Pejabat saat ini</small>
        <strong>{{ official.nama }}</strong>
        <span>{{ official.jabatan }}</span>
      </div>
      <ArrowRight :size="20" />
      <div>
        <small>Pejabat baru</small>
        <strong>{{ form.nama || '—' }}</strong>
        <span>{{ official.jabatan }}</span>
      </div>
    </div>

    <form id="replace-form" class="form-grid" novalidate @submit.prevent="submit">
      <div class="field span-2">
        <label class="field__label">Status Mutasi</label>
        <select v-model="form.status" class="input">
          <option value="disahkan">Disahkan — langsung ganti pejabat aktif</option>
          <option value="diproses">Diproses — catat sebagai usulan, pejabat aktif tidak berubah</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Tanggal Efektif *</label>
        <input v-model="form.tanggal_efektif" type="date" class="input" :class="{ 'input--invalid': errors.tanggal_efektif }" />
        <span v-if="errors.tanggal_efektif" class="field__error">{{ errors.tanggal_efektif }}</span>
      </div>
      <div class="field">
        <label class="field__label">Nomor SK Kelurahan</label>
        <input v-model="form.no_sk" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Keterangan Pejabat Lama</label>
        <input v-model="form.keterangan_lama" class="input" list="reasons-old" />
        <datalist id="reasons-old"><option v-for="r in reasonsOld" :key="r" :value="r" /></datalist>
      </div>
      <div class="field">
        <label class="field__label">Keterangan Pejabat Baru</label>
        <input v-model="form.keterangan_baru" class="input" list="reasons-new" />
        <datalist id="reasons-new"><option v-for="r in reasonsNew" :key="r" :value="r" /></datalist>
      </div>

      <div class="section span-2">Data Pejabat Baru</div>
      <div class="field">
        <label class="field__label">Nama Lengkap & Gelar *</label>
        <input v-model="form.nama" class="input" :class="{ 'input--invalid': errors.nama }" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field">
        <label class="field__label">NIK</label>
        <input v-model="form.nik" class="input" inputmode="numeric" maxlength="16" :class="{ 'input--invalid': errors.nik }" />
        <span v-if="errors.nik" class="field__error">{{ errors.nik }}</span>
      </div>
      <div class="field">
        <label class="field__label">No. WhatsApp</label>
        <input v-model="form.no_wa" class="input" inputmode="tel" :class="{ 'input--invalid': errors.no_wa }" />
        <span v-if="errors.no_wa" class="field__error">{{ errors.no_wa }}</span>
      </div>
      <div class="field">
        <label class="field__label">Label Status</label>
        <input v-model="form.status_label" class="input" placeholder="mis. Masa Aktif: Th. 1" />
      </div>
      <div class="field span-2">
        <label class="field__label">Domisili</label>
        <input v-model="form.domisili" class="input" />
      </div>
      <div class="field span-2">
        <label class="field__label">Foto</label>
        <ImageUpload v-model="form.foto" ratio="1 / 1" class="photo" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="emit('close')">Batal</button>
      <button class="btn btn--primary" type="submit" form="replace-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> {{ form.status === 'disahkan' ? 'Sahkan Pergantian' : 'Catat Usulan' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.swap { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 14px 16px; margin-bottom: 20px; border-radius: 10px; background: var(--surface-muted); border: 1px solid var(--border); }
.swap > svg { color: var(--primary); }
.swap small { display: block; font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.swap strong { display: block; margin-top: 2px; }
.swap span { font-size: 12.5px; color: var(--muted); }
.section { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); padding: 8px 0 6px; border-bottom: 1px solid var(--border); }
.photo :deep(.upload__preview) { max-width: 120px; }
</style>
