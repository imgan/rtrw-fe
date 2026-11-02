<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrowDown, ArrowUp, Landmark, Pencil, Plus, Printer, Search, Trash2, Wallet } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import { cashApi } from '@/services/cms';
import { siteProfile } from '@/services/layanan';
import { escapeHtml, fetchAllPages, kopHtml, printDocument } from '@/utils/print';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate, formatMonth, formatNumber, formatRupiah, today } from '@/utils/format';

const toast = useToast();
const { rows, meta, loading, filters, load, goTo, remove: removeRow } = useCrudList(cashApi, { jenis: '', bulan: '' });

const summary = ref(null);
const categories = ref([]);

async function loadSummary() {
  try {
    summary.value = await cashApi.summary(filters.bulan);
    categories.value = await cashApi.categories();
  } catch (err) {
    toast.error(errorMessage(err));
  }
}
watch(() => filters.bulan, loadSummary);

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});

// Input nominal ditampilkan dengan pemisah ribuan, disimpan sebagai angka.
const nominalText = computed({
  get: () => (form.nominal ? formatNumber(form.nominal) : ''),
  set: (v) => (form.nominal = Number(String(v).replace(/\D/g, '')) || ''),
});

function open(item = {}) {
  Object.assign(form, { tanggal: today(), jenis: 'masuk', kategori: '', uraian: '', nominal: '', ...item });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = { tanggal: form.tanggal, jenis: form.jenis, kategori: form.kategori, uraian: form.uraian, nominal: form.nominal };
    const res = editing.value.id ? await cashApi.update(editing.value.id, payload) : await cashApi.create(payload);
    toast.success(res.message);
    editing.value = null;
    await Promise.all([load(), loadSummary()]);
  } catch (err) {
    errors.value = fieldErrors(err);
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}

async function remove(id) {
  await removeRow(id);
  await loadSummary();
}

// Jurnal urut kronologis dan mengikuti filter yang sedang aktif.
async function printJurnal() {
  try {
    const [site, all] = await Promise.all([siteProfile(), fetchAllPages(cashApi.list, filters)]);
    all.reverse();
    const sum = (jenis) => all.filter((t) => t.jenis === jenis).reduce((total, t) => total + t.nominal, 0);
    const body = all.map((t, i) => `<tr>
      <td class="center">${i + 1}</td>
      <td class="nowrap">${escapeHtml(formatDate(t.tanggal, 'short'))}</td>
      <td>${escapeHtml(t.uraian)}</td>
      <td class="right nowrap">${t.jenis === 'masuk' ? formatRupiah(t.nominal) : ''}</td>
      <td class="right nowrap">${t.jenis === 'keluar' ? formatRupiah(t.nominal) : ''}</td>
      <td class="right nowrap">${formatRupiah(t.saldo)}</td></tr>`).join('');
    printDocument('Jurnal Pemasukan dan Pengeluaran', `${kopHtml(site)}
      <h1>JURNAL PEMASUKAN DAN PENGELUARAN</h1>
      <p class="center">Periode: ${escapeHtml(filters.bulan ? formatMonth(filters.bulan) : 'Semua Periode')}</p>
      <table class="data"><thead><tr><th>No</th><th>Tanggal</th><th>Keterangan/Kegiatan</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr></thead>
      <tbody>${body || '<tr><td colspan="6" class="center">Tidak ada data</td></tr>'}</tbody>
      <tfoot><tr><th colspan="3" class="right">Jumlah</th><th class="right nowrap">${formatRupiah(sum('masuk'))}</th><th class="right nowrap">${formatRupiah(sum('keluar'))}</th><th></th></tr></tfoot></table>`);
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

onMounted(() => Promise.all([load(), loadSummary()]));
</script>

<template>
  <div v-if="summary" class="summary">
    <div class="card sum">
      <div><small>Penerimaan {{ formatMonth(summary.bulan) }}</small><strong class="text-green">{{ formatRupiah(summary.pemasukan) }}</strong></div>
      <span class="sum__icon sum__icon--green"><ArrowDown :size="18" /></span>
    </div>
    <div class="card sum">
      <div><small>Pengeluaran {{ formatMonth(summary.bulan) }}</small><strong class="text-red">{{ formatRupiah(summary.pengeluaran) }}</strong></div>
      <span class="sum__icon sum__icon--red"><ArrowUp :size="18" /></span>
    </div>
    <div class="card sum">
      <div><small>Saldo Akhir Kas (keseluruhan)</small><strong class="text-green">{{ formatRupiah(summary.saldo) }}</strong></div>
      <span class="sum__icon"><Landmark :size="18" /></span>
    </div>
  </div>

  <div class="card">
    <div class="cms-toolbar">
      <div class="cms-toolbar__title">
        <div class="cms-icon"><Wallet :size="20" /></div>
        <div>
          <h2>Buku Kas RT</h2>
          <p>Ringkasan bulan terakhir dan 5 mutasi terbaru tampil di beranda publik.</p>
        </div>
      </div>
      <div class="cms-actions">
        <button class="btn btn--ghost" @click="printJurnal"><Printer :size="16" /> Cetak Jurnal</button>
        <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Catat Transaksi</button>
      </div>
    </div>

    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari uraian atau kategori…" />
      </div>
      <select v-model="filters.jenis" class="input">
        <option value="">Semua jenis</option>
        <option value="masuk">Pemasukan</option>
        <option value="keluar">Pengeluaran</option>
      </select>
      <input v-model="filters.bulan" type="month" class="input" title="Filter bulan" />
    </div>

    <div class="cms-table-wrap">
      <table class="cms-table cms-table--compact">
        <thead>
          <tr><th>No</th><th>Tanggal</th><th>Keterangan / Kegiatan</th><th>Kategori</th><th class="right">Debit</th><th class="right">Kredit</th><th class="right">Saldo</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="8" class="empty">Belum ada transaksi.</td></tr>
          <template v-else>
            <tr v-for="(t, i) in rows" :key="t.id">
              <td>{{ (meta.page - 1) * meta.limit + i + 1 }}</td>
              <td class="nowrap">{{ formatDate(t.tanggal, 'short') }}</td>
              <td>{{ t.uraian }}</td>
              <td><span class="badge" :class="t.jenis === 'masuk' ? 'badge--green' : 'badge--blue'">{{ t.kategori }}</span></td>
              <td class="right nowrap text-green">{{ t.jenis === 'masuk' ? formatRupiah(t.nominal) : '—' }}</td>
              <td class="right nowrap text-red">{{ t.jenis === 'keluar' ? formatRupiah(t.nominal) : '—' }}</td>
              <td class="right nowrap">{{ formatRupiah(t.saldo) }}</td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(t)"><Pencil :size="15" /></button>
                  <button class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = t"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Transaksi Kas' : 'Catat Transaksi Kas'" @close="editing = null">
    <form id="cash-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field span-2">
        <label class="field__label">Jenis Transaksi</label>
        <div class="segmented">
          <button type="button" :class="{ active: form.jenis === 'masuk' }" @click="form.jenis = 'masuk'"><ArrowDown :size="16" /> Pemasukan</button>
          <button type="button" :class="{ active: form.jenis === 'keluar', out: true }" @click="form.jenis = 'keluar'"><ArrowUp :size="16" /> Pengeluaran</button>
        </div>
      </div>
      <div class="field">
        <label class="field__label">Tanggal *</label>
        <input v-model="form.tanggal" type="date" class="input" :class="{ 'input--invalid': errors.tanggal }" />
        <span v-if="errors.tanggal" class="field__error">{{ errors.tanggal }}</span>
      </div>
      <div class="field">
        <label class="field__label">Nominal (Rp) *</label>
        <input v-model="nominalText" class="input" inputmode="numeric" placeholder="0" :class="{ 'input--invalid': errors.nominal }" />
        <span v-if="errors.nominal" class="field__error">{{ errors.nominal }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Kategori *</label>
        <input v-model="form.kategori" class="input" list="cash-cats" placeholder="mis. Iuran Warga, Operasional" :class="{ 'input--invalid': errors.kategori }" />
        <datalist id="cash-cats"><option v-for="c in categories" :key="c" :value="c" /></datalist>
        <span v-if="errors.kategori" class="field__error">{{ errors.kategori }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Uraian Transaksi *</label>
        <input v-model="form.uraian" class="input" :class="{ 'input--invalid': errors.uraian }" />
        <span v-if="errors.uraian" class="field__error">{{ errors.uraian }}</span>
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="cash-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Transaksi" :action="() => remove(deleting.id)" @close="deleting = null">
    Transaksi <strong>{{ deleting.uraian }}</strong> ({{ formatRupiah(deleting.nominal) }}) akan dihapus dan saldo berjalan dihitung ulang.
  </ConfirmDialog>
</template>

<style scoped>
.summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.sum { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
.sum small { color: var(--muted); font-size: 13px; }
.sum strong { display: block; margin-top: 4px; font-size: 21px; }
.sum__icon { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-muted); }
.sum__icon--green { background: var(--primary-soft); color: var(--primary); }
.sum__icon--red { background: var(--danger-soft); color: var(--danger); }
.segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 5px; border-radius: 10px; background: var(--surface-muted); border: 1px solid var(--border); }
.segmented button { height: 38px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--muted); }
.segmented button.active { background: var(--primary); color: #fff; }
.segmented button.active.out { background: var(--danger); }
@media (max-width: 900px) { .summary { grid-template-columns: 1fr; } }
</style>
