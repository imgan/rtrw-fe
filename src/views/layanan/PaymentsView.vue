<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Pencil, Plus, Printer, ReceiptText, Search, Ticket, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import WargaPicker from '@/components/WargaPicker.vue';
import { MONTHS, paymentsApi, siteProfile } from '@/services/layanan';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { formatDate, formatNumber, formatRupiah, terbilang, today } from '@/utils/format';
import { escapeHtml, fetchAllPages, kopHtml, printDocument } from '@/utils/print';

const props = defineProps({ mine: Boolean });

const toast = useToast();
const listFn = (params) => (props.mine ? paymentsApi.mine(params) : paymentsApi.list(params));
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList({ list: listFn, remove: paymentsApi.remove }, { bulan: '', tahun: '' });

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({});
const thisYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => thisYear + 1 - i);

const nominalText = computed({
  get: () => (form.nominal ? formatNumber(form.nominal) : ''),
  set: (v) => (form.nominal = Number(String(v).replace(/\D/g, '')) || ''),
});
const rowNumber = (i) => (meta.value.page - 1) * meta.value.limit + i + 1;

function open(item = {}) {
  const now = new Date();
  Object.assign(form, {
    user_id: '', tanggal: today(), keterangan: 'Iuran bulanan warga', nominal: '',
    bulan: now.getMonth() + 1, tahun: now.getFullYear(), ...item,
  });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = { user_id: form.user_id, tanggal: form.tanggal, keterangan: form.keterangan, nominal: form.nominal, bulan: form.bulan, tahun: form.tahun };
    const res = editing.value.id ? await paymentsApi.update(editing.value.id, payload) : await paymentsApi.create(payload);
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

async function printList() {
  try {
    const [site, all] = await Promise.all([siteProfile(), fetchAllPages(listFn, filters)]);
    const periode = [filters.bulan ? MONTHS[filters.bulan - 1] : '', filters.tahun].filter(Boolean).join(' ') || 'Semua Periode';
    const total = all.reduce((sum, p) => sum + p.nominal, 0);
    const body = all.map((p, i) => `<tr>
      <td class="center">${i + 1}</td>
      <td class="nowrap">${escapeHtml(formatDate(p.tanggal, 'short'))}</td>
      <td>${escapeHtml(p.nama)}<br>${escapeHtml(p.nik)}</td>
      <td>${escapeHtml(p.keterangan)}</td>
      <td class="nowrap">${escapeHtml(MONTHS[p.bulan - 1])} ${p.tahun}</td>
      <td class="right nowrap">${formatRupiah(p.nominal)}</td></tr>`).join('');
    printDocument('Rekap Pembayaran Warga', `${kopHtml(site)}
      <h1>REKAP PEMBAYARAN WARGA</h1><p class="center">Periode: ${escapeHtml(periode)}</p>
      <table class="data"><thead><tr><th>No</th><th>Tanggal</th><th>Warga</th><th>Keterangan</th><th>Bulan/Tahun</th><th>Nominal</th></tr></thead>
      <tbody>${body || '<tr><td colspan="6" class="center">Tidak ada data</td></tr>'}</tbody>
      <tfoot><tr><th colspan="5" class="right">Total</th><th class="right nowrap">${formatRupiah(total)}</th></tr></tfoot></table>`);
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

const VOUCHER_STYLE = `
  @page { size: A5 landscape; margin: 1cm; }
  body { font-size: 10.5pt; line-height: 1.35; }
  .kop { padding-bottom: 4px; margin-bottom: 10px; }
  .kop h1 { font-size: 12.5pt; }
  .kop p { font-size: 9pt; }
  .voucher-title { font-size: 12.5pt; letter-spacing: 0.04em; }
  .voucher-no { text-align: center; margin: 0 0 10px; font-size: 10pt; }
  table.voucher { width: 100%; border-collapse: collapse; }
  table.voucher td { padding: 2px 4px; vertical-align: top; }
  table.voucher td:first-child { width: 110px; white-space: nowrap; }
  table.voucher td:nth-child(2) { width: 12px; }
  .amount { margin: 10px 0 4px; padding: 5px 10px; border: 1px solid #000; font-size: 13pt; font-weight: bold; }
  .words { font-style: italic; }
  .signs { display: flex; justify-content: space-between; margin-top: 8px; text-align: center; }
  .signs div { width: 40%; }
  .signs .space { height: 44px; }
`;

// Nomor voucher diturunkan dari id, jadi selalu sama setiap kali dicetak ulang.
const voucherNumber = (p) => `VCR/${String(p.id).padStart(6, '0')}/${p.tahun}`;

async function printVoucher(p) {
  try {
    const site = await siteProfile();
    const alamat = [p.blok && `Blok ${p.blok}`, p.no_rumah && `No. ${p.no_rumah}`].filter(Boolean).join(' ') || '—';
    printDocument(`Voucher ${voucherNumber(p)}`, `${kopHtml(site)}
      <h1 class="voucher-title">VOUCHER PEMBAYARAN</h1>
      <p class="voucher-no">No. ${escapeHtml(voucherNumber(p))}</p>
      <table class="voucher">
        <tr><td>Telah terima dari</td><td>:</td><td><b>${escapeHtml(p.nama)}</b></td></tr>
        <tr><td>NIK</td><td>:</td><td>${escapeHtml(p.nik)}</td></tr>
        <tr><td>Alamat</td><td>:</td><td>${escapeHtml(alamat)}</td></tr>
        <tr><td>Untuk pembayaran</td><td>:</td><td>${escapeHtml(p.keterangan)}</td></tr>
        <tr><td>Periode</td><td>:</td><td>${escapeHtml(MONTHS[p.bulan - 1])} ${p.tahun}</td></tr>
        <tr><td>Tanggal bayar</td><td>:</td><td>${escapeHtml(formatDate(p.tanggal))}</td></tr>
      </table>
      <div class="amount">${formatRupiah(p.nominal)}</div>
      <div class="words">Terbilang: ${escapeHtml(terbilang(p.nominal))}</div>
      <div class="signs">
        <div>Warga<div class="space"></div>( ${escapeHtml(p.nama)} )</div>
        <div>Bendahara<div class="space"></div>( .............................. )</div>
      </div>`, VOUCHER_STYLE);
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

onMounted(load);
</script>

<template>
  <div class="card">
    <div class="cms-toolbar">
      <div class="cms-toolbar__title">
        <div class="cms-icon"><ReceiptText :size="20" /></div>
        <div>
          <h2>{{ mine ? 'Pembayaran Saya' : 'Pembayaran Warga' }}</h2>
          <p>Total sesuai filter: <b>{{ formatRupiah(meta.jumlah) }}</b></p>
        </div>
      </div>
      <div class="cms-actions">
        <button class="btn btn--ghost" @click="printList"><Printer :size="16" /> Cetak Rekap</button>
        <button v-if="!mine" class="btn btn--primary" @click="open()"><Plus :size="18" /> Catat Pembayaran</button>
      </div>
    </div>
    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" :placeholder="mine ? 'Cari keterangan…' : 'Cari nama, NIK, No. KK, atau keterangan…'" />
      </div>
      <select v-model="filters.bulan" class="input">
        <option value="">Semua bulan</option>
        <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
      </select>
      <select v-model="filters.tahun" class="input">
        <option value="">Semua tahun</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr>
            <th>No</th><th>Tanggal</th><th v-if="!mine">Warga</th><th>Keterangan</th><th>Bulan</th><th>Tahun</th>
            <th class="right">Nominal</th><th class="right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="8" class="empty">Belum ada data pembayaran.</td></tr>
          <template v-else>
            <tr v-for="(p, i) in rows" :key="p.id">
              <td>{{ rowNumber(i) }}</td>
              <td class="nowrap">{{ formatDate(p.tanggal, 'short') }}</td>
              <td v-if="!mine"><strong>{{ p.nama }}</strong><small>{{ p.nik }}</small></td>
              <td>{{ p.keterangan }}</td>
              <td>{{ MONTHS[p.bulan - 1] }}</td>
              <td>{{ p.tahun }}</td>
              <td class="right nowrap">{{ formatRupiah(p.nominal) }}</td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Cetak Voucher" @click="printVoucher(p)"><Ticket :size="15" /></button>
                  <button v-if="!mine" class="btn btn--icon btn--ghost" title="Ubah" @click="open(p)"><Pencil :size="15" /></button>
                  <button v-if="!mine" class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = p"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Pembayaran' : 'Catat Pembayaran'" width="680px" @close="editing = null">
    <form id="payment-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field span-2">
        <label class="field__label">Warga *</label>
        <WargaPicker v-model="form.user_id" :initial="editing.id ? { id: editing.user_id, nama: editing.nama, nik: editing.nik } : null" :invalid="Boolean(errors.user_id)" />
        <span v-if="errors.user_id" class="field__error">{{ errors.user_id }}</span>
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
        <label class="field__label">Keterangan *</label>
        <input v-model="form.keterangan" class="input" :class="{ 'input--invalid': errors.keterangan }" />
        <span v-if="errors.keterangan" class="field__error">{{ errors.keterangan }}</span>
      </div>
      <div class="field">
        <label class="field__label">Bulan *</label>
        <select v-model.number="form.bulan" class="input"><option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option></select>
      </div>
      <div class="field">
        <label class="field__label">Tahun *</label>
        <select v-model.number="form.tahun" class="input"><option v-for="y in years" :key="y" :value="y">{{ y }}</option></select>
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="payment-form" :disabled="saving"><span v-if="saving" class="spinner" /> Simpan</button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Pembayaran" :action="() => remove(deleting.id)" @close="deleting = null">
    Pembayaran <strong>{{ deleting.nama }}</strong> ({{ formatRupiah(deleting.nominal) }}) akan dihapus permanen.
  </ConfirmDialog>
</template>
