<script setup>
import { onMounted, ref } from 'vue';
import { ExternalLink, Save } from '@lucide/vue';
import ImageUpload from '@/components/ImageUpload.vue';
import { settingsApi } from '@/services/cms';
import { errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const data = ref(null);
const saving = ref(false);

// Skema form: setiap section = satu kartu; tipe: text | textarea | number | date | image.
const sections = [
  {
    key: 'site', title: 'Identitas Situs', desc: 'Nama dan wilayah di header & footer.',
    fields: [
      { key: 'nama', label: 'Nama RT / RW' },
      { key: 'wilayah', label: 'Kelurahan, Kecamatan, Kota' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'telepon', label: 'No. Telepon' },
    ],
  },
  {
    key: 'hero', title: 'Sambutan Utama', desc: 'Blok paling atas beranda.',
    fields: [
      { key: 'badge', label: 'Label Kecil', span: 2 },
      { key: 'judul', label: 'Judul Besar', span: 2 },
      { key: 'kutipan', label: 'Kutipan Sambutan', type: 'textarea', span: 2 },
      { key: 'nama_ketua', label: 'Nama Ketua RT' },
      { key: 'jabatan_ketua', label: 'Jabatan & Masa Bakti' },
    ],
  },
  {
    key: 'siaga', title: 'Kartu Siaga Lingkungan', desc: 'Kartu bergambar di samping sambutan.',
    fields: [
      { key: 'gambar', label: 'Foto Kegiatan', type: 'image', ratio: '2 / 1', span: 2 },
      { key: 'tag', label: 'Label di Foto' },
      { key: 'label', label: 'Label Kecil' },
      { key: 'judul', label: 'Judul', span: 2 },
      { key: 'deskripsi', label: 'Deskripsi', type: 'textarea', span: 2 },
      { key: 'piket', label: 'Info Piket' },
      { key: 'personel', label: 'Jumlah Personel' },
    ],
  },
  {
    key: 'statistik', title: 'Statistik Warga', desc: 'Empat kartu angka di bawah sambutan. Saldo kas dihitung otomatis dari buku kas.',
    fields: [
      { key: 'total_kk', label: 'Total Kepala Keluarga', type: 'number' },
      { key: 'catatan_kk', label: 'Catatan KK' },
      { key: 'total_warga', label: 'Jumlah Warga (Jiwa)', type: 'number' },
      { key: 'laki_laki', label: 'Laki-laki', type: 'number' },
      { key: 'perempuan', label: 'Perempuan', type: 'number' },
      { key: 'keamanan', label: 'Status Keamanan (mis. 24 Jam)' },
      { key: 'keamanan_sub', label: 'Sub-label Keamanan' },
      { key: 'keamanan_catatan', label: 'Catatan Keamanan' },
    ],
  },
  {
    key: 'kas', title: 'Info Kas', desc: 'Pelengkap bagian transparansi kas.',
    fields: [
      { key: 'audit_terakhir', label: 'Tanggal Audit Terakhir', type: 'date' },
      { key: 'status_bendahara', label: 'Status Bendahara' },
    ],
  },
  {
    key: 'wilayah', title: 'Denah & Wilayah', desc: 'Kartu peta cakupan wilayah.',
    fields: [
      { key: 'gambar_denah', label: 'Gambar Denah', type: 'image', ratio: '3 / 1', span: 2 },
      { key: 'judul', label: 'Judul' },
      { key: 'posko', label: 'Titik Posko Utama' },
      { key: 'deskripsi', label: 'Deskripsi', type: 'textarea', span: 2 },
      { key: 'batas_utara', label: 'Batas Utara' },
      { key: 'batas_selatan', label: 'Batas Selatan' },
      { key: 'batas_barat', label: 'Batas Barat' },
    ],
  },
  {
    key: 'kontak', title: 'Kontak Darurat', desc: 'Daftar kontak dikelola di menu Kontak Pengurus.',
    fields: [
      { key: 'deskripsi', label: 'Deskripsi', type: 'textarea', span: 2 },
      { key: 'darurat', label: 'Info Darurat Bawah', span: 2 },
    ],
  },
  {
    key: 'footer', title: 'Footer & Jam Pelayanan', desc: '',
    fields: [
      { key: 'deskripsi', label: 'Deskripsi Singkat', type: 'textarea', span: 2 },
      { key: 'sekretariat', label: 'Alamat Sekretariat', type: 'textarea', span: 2 },
      { key: 'jam_senin_jumat', label: 'Senin – Jumat' },
      { key: 'jam_sabtu', label: 'Sabtu' },
      { key: 'jam_minggu', label: 'Minggu & Hari Libur', span: 2 },
    ],
  },
];

async function save() {
  saving.value = true;
  try {
    const res = await settingsApi.saveHome(data.value);
    data.value = res.data;
    toast.success(res.message);
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    data.value = await settingsApi.getHome();
  } catch (err) {
    toast.error(errorMessage(err));
  }
});
</script>

<template>
  <div v-if="!data" class="card loading">Memuat konten beranda…</div>

  <form v-else class="settings" @submit.prevent="save">
    <div class="actionbar card">
      <div>
        <strong>Konten Beranda Publik</strong>
        <small>Perubahan tampil di beranda setelah disimpan.</small>
      </div>
      <div class="actionbar__btns">
        <a href="/" target="_blank" class="btn btn--ghost"><ExternalLink :size="16" /> Lihat Beranda</a>
        <button class="btn btn--primary" type="submit" :disabled="saving">
          <span v-if="saving" class="spinner" /><Save v-else :size="16" /> Simpan Perubahan
        </button>
      </div>
    </div>

    <section v-for="sec in sections" :key="sec.key" class="card block">
      <header>
        <h3>{{ sec.title }}</h3>
        <p v-if="sec.desc">{{ sec.desc }}</p>
      </header>
      <div class="form-grid">
        <div v-for="f in sec.fields" :key="f.key" class="field" :class="{ 'span-2': f.span === 2 }">
          <label class="field__label">{{ f.label }}</label>
          <ImageUpload v-if="f.type === 'image'" v-model="data[sec.key][f.key]" :ratio="f.ratio" />
          <textarea v-else-if="f.type === 'textarea'" v-model="data[sec.key][f.key]" class="input" rows="3" />
          <input v-else-if="f.type === 'number'" v-model.number="data[sec.key][f.key]" type="number" min="0" class="input" />
          <input v-else v-model="data[sec.key][f.key]" :type="f.type || 'text'" class="input" />
        </div>
      </div>
    </section>
  </form>
</template>

<style scoped>
.loading { padding: 40px; text-align: center; color: var(--muted); }
.settings { display: flex; flex-direction: column; gap: 20px; max-width: 980px; }
.actionbar { position: sticky; top: 12px; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px 20px; }
.actionbar strong { display: block; }
.actionbar small { color: var(--muted); font-size: 13px; }
.actionbar__btns { display: flex; gap: 10px; flex-wrap: wrap; }
.block { padding: 22px; }
.block header { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.block h3 { font-size: 16px; }
.block header p { color: var(--muted); font-size: 13px; margin-top: 4px; }
</style>
