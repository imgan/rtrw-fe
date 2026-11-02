<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import {
  BadgeCheck, Building2, CalendarDays, ChevronRight, CircleCheck, CirclePlus, ClipboardList, Download,
  ExternalLink, Fingerprint, History, MapPin, MessageSquare, Pencil, Plus, Printer, Repeat, Search, Settings2,
  ShieldCheck, Trash2, UserCheck, UserPlus, Users, X,
} from '@lucide/vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import OfficialFormModal from './OfficialFormModal.vue';
import ReplaceOfficialModal from './ReplaceOfficialModal.vue';
import MutationFormModal from './MutationFormModal.vue';
import StrukturSettingsModal from './StrukturSettingsModal.vue';
import { mutationsApi, officialsApi } from '@/services/cms';
import { errorMessage } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/utils/format';

const toast = useToast();

const overview = ref(null);
const officials = ref([]);
const loadingOfficials = ref(false);
const satuan = ref('');
const search = ref('');

const mutasi = useCrudList(mutationsApi, { status: '', official_id: '' });
const historyFor = ref(null);
const historyEl = ref(null);

// Modal state
const officialForm = ref(null); // {} = baru, objek = ubah
const replacing = ref(null);
const mutationForm = ref(null);
const deletingOfficial = ref(null);
const deletingMutation = ref(null);
const settingsOpen = ref(false);

const s = computed(() => overview.value?.settings);
const activeCount = computed(() => officials.value.filter((o) => o.is_active).length);
const utamaCount = computed(() => officials.value.filter((o) => o.is_utama && o.is_active).length);

const filteredOfficials = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return officials.value;
  return officials.value.filter((o) => [o.nama, o.nik, o.jabatan].some((v) => v?.toLowerCase().includes(q)));
});

const statusBadge = {
  disahkan: { label: 'Disahkan', cls: 'badge--green' },
  diproses: { label: 'Diproses', cls: 'badge--amber' },
  ditolak: { label: 'Ditolak', cls: 'badge--red' },
};

async function loadOverview() {
  try {
    overview.value = await officialsApi.overview();
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

async function loadOfficials() {
  loadingOfficials.value = true;
  try {
    officials.value = (await officialsApi.list({ satuan: satuan.value })).data;
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    loadingOfficials.value = false;
  }
}
watch(satuan, loadOfficials);

const refreshAll = () => Promise.all([loadOverview(), loadOfficials(), mutasi.load()]);

function onSaved(close) {
  close();
  refreshAll();
}

async function showHistory(o) {
  historyFor.value = o;
  mutasi.filters.official_id = o.id;
  await nextTick();
  historyEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function clearHistory() {
  historyFor.value = null;
  mutasi.filters.official_id = '';
}

async function removeOfficial(id) {
  const res = await officialsApi.remove(id);
  toast.success(res.message);
  refreshAll();
}
async function removeMutation(id) {
  await mutasi.remove(id);
  loadOverview();
}

const waLink = (no) => `https://wa.me/${(no || '').replace(/\D/g, '').replace(/^0/, '62')}`;
const initials = (nama) => nama.replace(/^(H|Hj|Drs?|Ir)\.\s*/i, '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function printPage() {
  document.body.classList.add('print-struktur');
  window.print();
  document.body.classList.remove('print-struktur');
}

// Ekspor "buku induk": daftar pengurus + seluruh riwayat mutasi dalam satu CSV (dibuka di Excel).
async function exportBukuInduk() {
  try {
    const [all, logs] = await Promise.all([
      officialsApi.list({}),
      mutationsApi.list({ limit: 100 }),
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['DAFTAR PENGURUS', s.value.wilayah.nama_rw, s.value.periode.label].map(esc).join(';'),
      ['Nama', 'Jabatan', 'Satuan', 'NIK', 'WhatsApp', 'Domisili', 'No. SK', 'Status', 'Aktif'].map(esc).join(';'),
      ...all.data.map((o) => [o.nama, o.jabatan, o.satuan, `'${o.nik || ''}`, o.no_wa, o.domisili, o.no_sk, o.status_label, o.is_active ? 'Ya' : 'Tidak'].map(esc).join(';')),
      '',
      esc('RIWAYAT MUTASI'),
      ['Tanggal Efektif', 'Jabatan', 'Pejabat Lama', 'Keterangan Lama', 'Pejabat Baru', 'Keterangan Baru', 'No. SK', 'Status'].map(esc).join(';'),
      ...logs.data.map((m) => [m.tanggal_efektif, m.jabatan, m.pejabat_lama, m.keterangan_lama, m.pejabat_baru, m.keterangan_baru, m.no_sk, m.status].map(esc).join(';')),
    ];
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `buku-induk-pengurus-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

onMounted(refreshAll);
</script>

<template>
  <div class="struktur">
    <!-- Judul -->
    <div class="page-head">
      <div>
        <nav class="crumbs">
          <RouterLink to="/cms">Dasbor</RouterLink> <ChevronRight :size="13" />
          <span>Struktur Organisasi</span> <ChevronRight :size="13" />
          <b>Master Data Pengurus RT/RW</b>
        </nav>
        <h2>Struktur &amp; Master Pengurus Lingkungan</h2>
        <p>Kelola legitimasi pejabat RT/RW, nomor kontak resmi pelayanan warga, dan riwayat pergantian masa bakti.</p>
      </div>
      <div class="page-head__actions no-print">
        <button class="btn btn--ghost" @click="printPage"><Printer :size="16" /> Cetak SK Struktur</button>
        <button class="btn btn--primary" @click="officialForm = {}"><UserPlus :size="16" /> Tambah / Mutasi Pengurus</button>
      </div>
    </div>

    <template v-if="s">
      <!-- Filter & SK -->
      <section class="card panel">
        <div class="filters">
          <div class="filter">
            <label>Wilayah Induk RW</label>
            <div class="fake-select"><Building2 :size="17" /> {{ s.wilayah.nama_rw }}</div>
            <small>{{ s.wilayah.keterangan }}</small>
          </div>
          <div class="filter filter--wide">
            <label>Pilihan Satuan Rukun Tetangga (RT)</label>
            <div class="seg">
              <button :class="{ active: satuan === '' }" @click="satuan = ''">Semua</button>
              <button :class="{ active: satuan === 'RW' }" @click="satuan = 'RW'">Inti RW</button>
              <button v-for="rt in overview.rt_list" :key="rt" :class="{ active: satuan === rt }" @click="satuan = rt">{{ rt }}</button>
            </div>
            <small>
              Menampilkan {{ activeCount }} pengurus aktif
              <template v-if="satuan && satuan !== 'RW'">di {{ satuan }} &amp; Pengurus Inti RW</template>
              <template v-else-if="satuan === 'RW'">di Pengurus Inti RW</template>
            </small>
          </div>
          <div class="filter">
            <label>Masa Bakti Kepengurusan</label>
            <div class="fake-select"><CalendarDays :size="17" /> {{ s.periode.label }} ({{ s.periode.status }})</div>
            <small>SK Berlaku sampai {{ formatDate(s.periode.berlaku_sampai) }}</small>
          </div>
          <button class="btn btn--icon btn--ghost settings-btn no-print" title="Pengaturan SK & periode" @click="settingsOpen = true">
            <Settings2 :size="16" />
          </button>
        </div>

        <div class="sk">
          <span class="sk__icon"><ShieldCheck :size="20" /></span>
          <div class="sk__text">
            <div><strong>{{ s.sk.judul }}</strong> <span v-if="s.sk.status" class="sk__badge">{{ s.sk.status }}</span></div>
            <small>Nomor Dokumen: <b>{{ s.sk.nomor }}</b> | Ditetapkan {{ s.sk.penetap }} pada {{ formatDate(s.sk.tanggal) }}.</small>
          </div>
          <a v-if="s.sk.file" :href="s.sk.file" target="_blank" class="sk__link no-print">Unduh Salinan Digital SK <Download :size="15" /></a>
          <button v-else class="sk__link no-print" @click="settingsOpen = true">Unggah Salinan SK <ExternalLink :size="15" /></button>
        </div>
      </section>

      <!-- Statistik -->
      <section class="stats">
        <div class="card stat">
          <span class="stat__icon stat__icon--blue"><Users :size="20" /></span>
          <div>
            <small>Total Aparatur Aktif</small>
            <strong>{{ overview.stats.total_aktif }} Pejabat</strong>
            <em class="blue">{{ s.wilayah.nama_rw.split(' ').slice(0, 2).join(' ') }} &amp; {{ overview.rt_list.length }} Satuan RT</em>
          </div>
        </div>
        <div class="card stat">
          <span class="stat__icon stat__icon--green"><MessageSquare :size="20" /></span>
          <div>
            <small>Validitas TTD Digital</small>
            <strong>{{ s.statistik.ttd_digital }}</strong>
            <em>{{ s.statistik.ttd_catatan }}</em>
          </div>
        </div>
        <div class="card stat">
          <span class="stat__icon stat__icon--amber"><ClipboardList :size="20" /></span>
          <div>
            <small>Usulan Mutasi Jabatan</small>
            <strong>{{ overview.stats.mutasi_diproses }} Berkas</strong>
            <em class="amber">{{ overview.stats.mutasi_terbaru || 'Tidak ada usulan tertunda' }}</em>
          </div>
        </div>
        <div class="card stat">
          <span class="stat__icon stat__icon--violet"><UserCheck :size="20" /></span>
          <div>
            <small>Tingkat Kehadiran Rapat</small>
            <strong>{{ s.statistik.kehadiran }}</strong>
            <em>{{ s.statistik.kehadiran_catatan }}</em>
          </div>
        </div>
      </section>

      <!-- Daftar pejabat -->
      <section>
        <div class="list-head">
          <h3>Daftar Pejabat Resmi Terdaftar <span class="pill">{{ utamaCount }} Pejabat Utama</span></h3>
          <div class="cms-search no-print">
            <Search :size="16" />
            <input v-model="search" class="input" placeholder="Cari nama, NIK, atau jabatan…" />
          </div>
        </div>

        <div class="officials">
          <article
            v-for="o in filteredOfficials"
            :key="o.id"
            class="card official"
            :class="[`official--${o.warna}`, { 'official--inactive': !o.is_active }]"
          >
            <div class="official__tools no-print">
              <button class="btn btn--icon btn--ghost" title="Ubah data" @click="officialForm = o"><Pencil :size="14" /></button>
              <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deletingOfficial = o"><Trash2 :size="14" /></button>
            </div>
            <div class="official__head">
              <img v-if="o.foto" :src="o.foto" alt="" class="official__photo" />
              <span v-else class="official__photo official__photo--initial">{{ initials(o.nama) }}</span>
              <div>
                <span v-if="o.label" class="official__label"><BadgeCheck :size="13" /> {{ o.label }}</span>
                <h4>{{ o.nama }}</h4>
                <p>{{ o.jabatan }}</p>
              </div>
            </div>
            <dl class="official__info">
              <div><dt><Fingerprint :size="14" /> NIK</dt><dd class="mono">{{ o.nik || '—' }}</dd></div>
              <div>
                <dt><MessageSquare :size="14" /> WhatsApp</dt>
                <dd><a v-if="o.no_wa" :href="waLink(o.no_wa)" target="_blank" rel="noopener">{{ o.no_wa }} <ExternalLink :size="12" /></a><template v-else>—</template></dd>
              </div>
              <div><dt><MapPin :size="14" /> Domisili</dt><dd>{{ o.domisili || '—' }}</dd></div>
            </dl>
            <div class="official__sk">
              <span>SK: {{ o.no_sk || '—' }}</span>
              <span v-if="!o.is_active" class="badge badge--gray">Nonaktif</span>
              <span v-else-if="o.status_label" class="official__status">{{ o.status_label }}</span>
            </div>
            <div class="official__foot no-print">
              <button @click="showHistory(o)"><History :size="14" /> Riwayat Pejabat</button>
              <button class="strong" @click="replacing = o"><Repeat :size="14" /> Ganti Pejabat</button>
            </div>
          </article>

          <button class="card official official--add no-print" @click="officialForm = {}">
            <CirclePlus :size="34" />
            <strong>Tambah Posisi Pengurus</strong>
            <span>Daftarkan Seksi Kebersihan, Rohani, atau Humas untuk masa bakti {{ s.periode.label.replace(/^Periode\s*/i, '') }}</span>
            <span class="btn btn--ghost btn--sm">Buka Formulir SK</span>
          </button>
        </div>
        <p v-if="!loadingOfficials && !filteredOfficials.length" class="empty">Tidak ada pengurus yang sesuai.</p>
      </section>

      <!-- Riwayat mutasi -->
      <section ref="historyEl" class="card history">
        <div class="history__head">
          <div>
            <h3>Riwayat &amp; Log Mutasi Pejabat Lingkungan</h3>
            <p>Catatan transparan pergantian pejabat dan legalitas surat keputusan lurah setempat.</p>
          </div>
          <div class="history__actions no-print">
            <button class="link-btn" @click="exportBukuInduk">Unduh Buku Induk Pengurus <Download :size="15" /></button>
            <button class="btn btn--ghost btn--sm" @click="mutationForm = {}"><Plus :size="15" /> Catat Riwayat</button>
          </div>
        </div>

        <div class="history__filters no-print">
          <select v-model="mutasi.filters.status" class="input">
            <option value="">Semua status</option>
            <option value="disahkan">Disahkan</option>
            <option value="diproses">Diproses</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <span v-if="historyFor" class="history__chip">
            Riwayat: {{ historyFor.jabatan }}
            <button aria-label="Hapus filter" @click="clearHistory"><X :size="14" /></button>
          </span>
        </div>

        <div class="cms-table-wrap">
          <table class="cms-table">
            <thead>
              <tr>
                <th>Tanggal Efektif</th><th>Jabatan &amp; Lingkungan</th><th>Pejabat Lama</th>
                <th>Pejabat Baru (Terpilih)</th><th>No. SK Kelurahan</th><th>Status Berkas</th><th class="right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="mutasi.loading.value"><td colspan="7" class="empty">Memuat riwayat…</td></tr>
              <tr v-else-if="!mutasi.rows.value.length"><td colspan="7" class="empty">Belum ada riwayat mutasi.</td></tr>
              <template v-else>
                <tr v-for="m in mutasi.rows.value" :key="m.id">
                  <td class="mono nowrap">{{ formatDate(m.tanggal_efektif, 'short') }}</td>
                  <td><strong>{{ m.jabatan }}</strong></td>
                  <td>{{ m.pejabat_lama || '—' }}<small v-if="m.keterangan_lama">({{ m.keterangan_lama }})</small></td>
                  <td class="text-green"><strong>{{ m.pejabat_baru }}</strong><small v-if="m.keterangan_baru">({{ m.keterangan_baru }})</small></td>
                  <td class="mono">{{ m.no_sk || '—' }}</td>
                  <td>
                    <span class="badge" :class="statusBadge[m.status].cls"><CircleCheck v-if="m.status === 'disahkan'" :size="12" /> {{ statusBadge[m.status].label }}</span>
                  </td>
                  <td class="right no-print">
                    <div class="cms-actions">
                      <button class="btn btn--icon btn--ghost" title="Ubah" @click="mutationForm = m"><Pencil :size="14" /></button>
                      <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deletingMutation = m"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <DataPager v-model:limit="mutasi.filters.limit" :meta="mutasi.meta.value" class="no-print" @go="mutasi.goTo" />
      </section>
    </template>
    <div v-else class="card empty">Memuat struktur pengurus…</div>
  </div>

  <OfficialFormModal
    v-if="officialForm"
    :official="officialForm.id ? officialForm : null"
    :rt-list="overview?.rt_list"
    :next-order="officials.length + 1"
    @close="officialForm = null"
    @saved="onSaved(() => (officialForm = null))"
  />
  <ReplaceOfficialModal v-if="replacing" :official="replacing" @close="replacing = null" @saved="onSaved(() => (replacing = null))" />
  <MutationFormModal
    v-if="mutationForm"
    :mutation="mutationForm.id ? mutationForm : null"
    @close="mutationForm = null"
    @saved="onSaved(() => (mutationForm = null))"
  />
  <StrukturSettingsModal v-if="settingsOpen" :settings="s" @close="settingsOpen = false" @saved="onSaved(() => (settingsOpen = false))" />

  <ConfirmDialog v-if="deletingOfficial" title="Hapus Pengurus" :action="() => removeOfficial(deletingOfficial.id)" @close="deletingOfficial = null">
    <strong>{{ deletingOfficial.nama }}</strong> ({{ deletingOfficial.jabatan }}) akan dihapus dari struktur. Riwayat mutasinya tetap disimpan.
  </ConfirmDialog>
  <ConfirmDialog v-if="deletingMutation" title="Hapus Riwayat Mutasi" :action="() => removeMutation(deletingMutation.id)" @close="deletingMutation = null">
    Riwayat <strong>{{ deletingMutation.jabatan }}</strong> ({{ deletingMutation.pejabat_baru }}) akan dihapus permanen.
  </ConfirmDialog>
</template>

<style scoped>
.struktur { display: flex; flex-direction: column; gap: 22px; }
.mono { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; font-size: 12.5px; }
.empty { padding: 32px; text-align: center; color: var(--muted); }

.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.crumbs { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); flex-wrap: wrap; }
.crumbs a { color: var(--muted); }
.crumbs b { color: var(--primary); font-weight: 600; }
.page-head h2 { margin-top: 8px; font-size: 26px; font-weight: 800; }
.page-head p { margin-top: 6px; color: var(--muted); max-width: 520px; line-height: 1.6; font-size: 14px; }
.page-head__actions { display: flex; flex-direction: column; gap: 10px; }

.panel { padding: 22px; }
.filters { display: grid; grid-template-columns: 1fr 1.6fr 1fr auto; gap: 16px; align-items: start; }
.filter { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.filter label { font-size: 13px; font-weight: 600; }
.filter small { font-size: 12px; color: var(--muted); }
.fake-select { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fake-select svg { color: var(--muted); flex-shrink: 0; }
.seg { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); overflow-x: auto; }
.seg button { flex: 1; height: 34px; padding: 0 12px; border-radius: 7px; font-size: 13px; font-weight: 500; white-space: nowrap; color: var(--muted); }
.seg button.active { background: var(--primary); color: #fff; font-weight: 600; }
.settings-btn { margin-top: 26px; }

.sk { margin-top: 20px; display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; background: var(--primary-soft); border: 1px solid #c6e3d6; }
.sk__icon { width: 38px; height: 38px; border-radius: 50%; background: var(--primary); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
.sk__text { flex: 1; min-width: 0; }
.sk__text strong { color: var(--primary); font-size: 14.5px; }
.sk__text small { display: block; margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.sk__badge { margin-left: 6px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--primary); color: var(--primary); font-size: 11px; font-weight: 600; }
.sk__link { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-weight: 700; font-size: 13px; white-space: nowrap; }

.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.stat { padding: 18px; display: flex; gap: 14px; align-items: center; }
.stat small { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
.stat strong { display: block; margin-top: 4px; font-size: 21px; }
.stat em { display: block; margin-top: 2px; font-style: normal; font-size: 12.5px; color: var(--muted); }
.stat em.blue { color: var(--link); }
.stat em.amber { color: var(--warning); }
.stat__icon { width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
.stat__icon--blue { background: #e8effd; color: var(--link); }
.stat__icon--green { background: var(--primary-soft); color: var(--primary); }
.stat__icon--amber { background: var(--warning-soft); color: var(--warning); }
.stat__icon--violet { background: #f1eafd; color: #7c3aed; }

.list-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.list-head h3 { font-size: 18px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pill { padding: 3px 10px; border-radius: 999px; background: var(--primary); color: #fff; font-size: 11.5px; font-weight: 600; letter-spacing: 0; }
.list-head .cms-search { width: 260px; }

.officials { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }
.official { position: relative; display: flex; flex-direction: column; border-top: 5px solid var(--tone); --tone: var(--link); --tone-soft: #e8effd; overflow: hidden; }
.official--green { --tone: var(--primary); --tone-soft: var(--primary-soft); border: 2px solid var(--primary); border-top-width: 5px; }
.official--dark { --tone: #1f2937; --tone-soft: var(--surface-muted); }
.official--amber { --tone: var(--warning); --tone-soft: var(--warning-soft); }
.official--inactive { opacity: 0.6; }
.official__tools { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
.official:hover .official__tools, .official:focus-within .official__tools { opacity: 1; }
.official__tools .btn--icon { width: 28px; height: 28px; }
.official__head { display: flex; gap: 14px; padding: 22px 20px 16px; }
.official__photo { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border); }
.official__photo--initial { display: grid; place-items: center; background: var(--tone-soft); color: var(--tone); font-weight: 700; }
.official__label { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: var(--tone-soft); color: var(--tone); font-size: 11px; font-weight: 600; }
.official--green .official__label { background: var(--primary); color: #fff; }
.official h4 { margin-top: 6px; font-size: 15.5px; line-height: 1.35; }
.official__head p { margin-top: 2px; color: var(--primary); font-size: 12.5px; font-weight: 600; }
.official__info { margin: 0 20px; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 9px; font-size: 12.5px; }
.official__info div { display: flex; justify-content: space-between; gap: 12px; }
.official__info dt { display: flex; align-items: center; gap: 6px; color: var(--muted); flex-shrink: 0; }
.official__info dd { margin: 0; text-align: right; }
.official__info dd a { color: var(--primary); display: inline-flex; align-items: center; gap: 4px; }
.official__sk { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 20px; font-size: 12px; color: var(--muted); flex: 1; }
.official__status { padding: 4px 10px; border-radius: 6px; background: var(--primary-soft); color: var(--primary); font-weight: 600; font-size: 11.5px; }
.official--dark .official__status { background: var(--primary-soft); }
.official__foot { display: flex; justify-content: space-between; padding: 12px 20px; background: var(--surface-muted); border-top: 1px solid var(--border); }
.official__foot button { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); font-weight: 500; }
.official__foot button.strong { color: var(--primary); font-weight: 600; }
.official__foot button:hover { color: var(--primary); }
.official--add { border: 2px dashed var(--border); align-items: center; justify-content: center; gap: 10px; padding: 32px 24px; text-align: center; background: transparent; box-shadow: none; color: var(--primary); min-height: 300px; }
.official--add:hover { border-color: var(--primary); background: #fff; }
.official--add strong { color: var(--text); font-size: 15px; }
.official--add > span:not(.btn) { font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 240px; }

.history { overflow: hidden; }
.history__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; padding: 22px; }
.history__head h3 { font-size: 18px; }
.history__head p { color: var(--muted); font-size: 13px; margin-top: 4px; }
.history__actions { display: flex; align-items: center; gap: 14px; }
.link-btn { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-weight: 600; font-size: 13px; }
.history__filters { display: flex; align-items: center; gap: 12px; padding: 0 22px 16px; flex-wrap: wrap; }
.history__filters .input { width: 180px; }
.history__chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 13px; font-weight: 600; }
.history__chip button { display: flex; color: var(--primary); }
.history .cms-table td small { display: block; }
.history .cms-table th, .history .cms-table td { padding-left: 16px; padding-right: 16px; }
.history .cms-table th:first-child, .history .cms-table td:first-child { padding-left: 22px; }
.history .cms-table td:nth-child(3) { min-width: 150px; }

@media (max-width: 1200px) {
  .filters { grid-template-columns: 1fr 1fr; }
  .filter--wide { grid-column: span 2; order: 3; }
  .settings-btn { justify-self: start; margin-top: 0; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .filters, .stats { grid-template-columns: 1fr; }
  .filter--wide { grid-column: span 1; }
  .sk { flex-wrap: wrap; }
  .page-head__actions { flex-direction: row; flex-wrap: wrap; }
  .list-head .cms-search { width: 100%; }
}
</style>

<style>
@media print {
  body.print-struktur .sidebar,
  body.print-struktur .header,
  body.print-struktur .no-print { display: none !important; }
  body.print-struktur .content { padding: 0 !important; }
  body.print-struktur .official { break-inside: avoid; }
}
</style>
