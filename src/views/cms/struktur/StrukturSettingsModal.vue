<script setup>
import { reactive, ref } from 'vue';
import { FileText, Trash2, Upload } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import { settingsApi, uploadFile } from '@/services/cms';
import { assetUrl, errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const saving = ref(false);
const uploading = ref(false);
const fileInput = ref(null);
const form = reactive(JSON.parse(JSON.stringify(props.settings)));

async function onPickSk(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  uploading.value = true;
  try {
    form.sk.file = await uploadFile(file);
    toast.success('Salinan SK terunggah. Simpan untuk menerapkan.');
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    uploading.value = false;
  }
}

async function submit() {
  saving.value = true;
  try {
    const res = await settingsApi.save('struktur', form);
    toast.success(res.message);
    emit('saved');
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal title="Pengaturan SK, Periode & Wilayah" width="760px" @close="emit('close')">
    <form id="struktur-form" class="form-grid" novalidate @submit.prevent="submit">
      <div class="section span-2">Wilayah</div>
      <div class="field">
        <label class="field__label">Nama RW Induk</label>
        <input v-model="form.wilayah.nama_rw" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Keterangan Wilayah</label>
        <input v-model="form.wilayah.keterangan" class="input" />
      </div>
      <div class="field span-2">
        <label class="field__label">Daftar Satuan RT</label>
        <input v-model="form.wilayah.daftar_rt" class="input" />
        <span class="field__hint">Pisahkan dengan koma, mis. RT 01, RT 02, RT 03, RT 04</span>
      </div>

      <div class="section span-2">Masa Bakti</div>
      <div class="field">
        <label class="field__label">Label Periode</label>
        <input v-model="form.periode.label" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Status Periode</label>
        <input v-model="form.periode.status" class="input" placeholder="Berjalan" />
      </div>
      <div class="field">
        <label class="field__label">SK Berlaku Sampai</label>
        <input v-model="form.periode.berlaku_sampai" type="date" class="input" />
      </div>

      <div class="section span-2">Surat Keputusan Kelurahan</div>
      <div class="field span-2">
        <label class="field__label">Judul</label>
        <input v-model="form.sk.judul" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Nomor Dokumen</label>
        <input v-model="form.sk.nomor" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Label Status</label>
        <input v-model="form.sk.status" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Tanggal Penetapan</label>
        <input v-model="form.sk.tanggal" type="date" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Ditetapkan Oleh</label>
        <input v-model="form.sk.penetap" class="input" />
      </div>
      <div class="field span-2">
        <label class="field__label">Salinan Digital SK (PDF / gambar)</label>
        <div class="sk-file">
          <a v-if="form.sk.file" :href="assetUrl(form.sk.file)" target="_blank" class="sk-file__link"><FileText :size="16" /> Lihat berkas</a>
          <span v-else class="sk-file__empty">Belum ada berkas</span>
          <input ref="fileInput" type="file" accept="application/pdf,image/*" hidden @change="onPickSk" />
          <button type="button" class="btn btn--ghost btn--sm" :disabled="uploading" @click="fileInput.click()">
            <Upload :size="15" /> {{ uploading ? 'Mengunggah…' : 'Unggah' }}
          </button>
          <button v-if="form.sk.file" type="button" class="btn btn--ghost btn--sm" @click="form.sk.file = ''"><Trash2 :size="15" /></button>
        </div>
      </div>

      <div class="section span-2">Statistik</div>
      <div class="field">
        <label class="field__label">Validitas TTD Digital</label>
        <input v-model="form.statistik.ttd_digital" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Catatan TTD</label>
        <input v-model="form.statistik.ttd_catatan" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Tingkat Kehadiran Rapat</label>
        <input v-model="form.statistik.kehadiran" class="input" />
      </div>
      <div class="field">
        <label class="field__label">Catatan Kehadiran</label>
        <input v-model="form.statistik.kehadiran_catatan" class="input" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="emit('close')">Batal</button>
      <button class="btn btn--primary" type="submit" form="struktur-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.section { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.section:not(:first-child) { margin-top: 6px; }
.sk-file { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sk-file__link { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--primary); }
.sk-file__empty { color: var(--subtle); font-size: 14px; }
</style>
