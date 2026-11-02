<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Ban, Check, CircleCheck, Clock, FileText, Pencil, Plus, Printer, Search, Trash2 } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import DataPager from '@/components/DataPager.vue';
import WargaPicker from '@/components/WargaPicker.vue';
import { lettersApi, siteProfile } from '@/services/layanan';
import { errorMessage, fieldErrors } from '@/services/api';
import { useCrudList } from '@/composables/useCrudList';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { formatDate, today } from '@/utils/format';
import { escapeHtml, kopHtml, printDocument } from '@/utils/print';

const props = defineProps({ mine: Boolean });

const auth = useAuthStore();
const toast = useToast();
const listFn = (params) => (props.mine ? lettersApi.mine(params) : lettersApi.list(params));
const { rows, meta, loading, filters, load, goTo, remove } = useCrudList({ list: listFn, remove: lettersApi.remove }, { status: '' });

const STEPS = [
  { key: 'sekretaris', label: 'Sekretaris' },
  { key: 'bendahara', label: 'Bendahara' },
  { key: 'ketua', label: 'Ketua' },
];
const JENIS = ['Surat Pengantar KTP', 'Surat Pengantar KK', 'Surat Keterangan Domisili', 'Surat Keterangan Usaha', 'Surat Keterangan Tidak Mampu', 'Surat Pengantar SKCK', 'Surat Keterangan Kematian'];
const STATUS = {
  diajukan: { label: 'Diajukan', cls: 'badge--gray' },
  diproses: { label: 'Diproses', cls: 'badge--amber' },
  disetujui: { label: 'Disetujui', cls: 'badge--green' },
  ditolak: { label: 'Ditolak', cls: 'badge--red' },
};

const canManage = computed(() => !props.mine && auth.can('letters.manage'));
const editing = ref(null);
const deleting = ref(null);
const rejecting = ref(null);
const accing = ref(null);
const alasan = ref('');
const saving = ref(false);
const errors = ref({});
const form = reactive({});

const rowNumber = (i) => (meta.value.page - 1) * meta.value.limit + i + 1;
const nextStep = (l) => (['diajukan', 'diproses'].includes(l.status) ? STEPS.find((s) => !l[`acc_${s.key}_at`]) : null);
const canAcc = (l) => {
  const step = nextStep(l);
  return !props.mine && step && auth.can(`letters.acc_${step.key}`);
};
const canReject = (l) => !props.mine && ['diajukan', 'diproses'].includes(l.status);
const canEdit = (l) => l.status === 'diajukan' && (props.mine || canManage.value);
const canDelete = (l) => ['diajukan', 'ditolak'].includes(l.status) && (props.mine || canManage.value);

function open(item = {}) {
  Object.assign(form, { user_id: '', tanggal_pengajuan: today(), jenis_surat: '', keperluan: '', tanggal_pelaksanaan: '', ...item });
  errors.value = {};
  editing.value = item;
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = {
      jenis_surat: form.jenis_surat,
      keperluan: form.keperluan,
      tanggal_pelaksanaan: form.tanggal_pelaksanaan,
      tanggal_pengajuan: form.tanggal_pengajuan,
    };
    if (canManage.value && !editing.value.id) payload.user_id = form.user_id;
    const res = editing.value.id ? await lettersApi.update(editing.value.id, payload) : await lettersApi.create(payload);
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

async function runAcc() {
  const res = await lettersApi.acc(accing.value.id, nextStep(accing.value).key);
  toast.success(res.message);
  load();
}

async function runReject() {
  saving.value = true;
  errors.value = {};
  try {
    const res = await lettersApi.reject(rejecting.value.id, alasan.value);
    toast.success(res.message);
    rejecting.value = null;
    alasan.value = '';
    load();
  } catch (err) {
    errors.value = fieldErrors(err);
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}

async function printLetter(l) {
  try {
    const site = await siteProfile();
    const row = (label, value) => `<tr><td class="label">${label}</td><td>: ${escapeHtml(value || '-')}</td></tr>`;
    const alamat = [l.alamat, l.blok ? `Blok ${l.blok} No. ${l.no_rumah || '-'}` : ''].filter(Boolean).join(', ');
    const sign = (jabatan, nama) => `<div><p>${jabatan}</p><div class="space"></div><p><u>${escapeHtml(nama)}</u></p></div>`;
    printDocument(`Surat ${l.nomor_surat}`, `${kopHtml(site)}
      <h1><u>SURAT KETERANGAN</u></h1>
      <p class="center">Nomor: ${escapeHtml(l.nomor_surat)}</p>
      <p>Yang bertanda tangan di bawah ini, pengurus ${escapeHtml(site.nama)}, menerangkan bahwa:</p>
      <table class="info">
        ${row('Nama', l.nama)}${row('NIK', l.nik)}${row('No. KK', l.no_kk)}
        ${row('Tanggal Lahir', l.tanggal_lahir ? formatDate(l.tanggal_lahir) : '')}${row('Alamat', alamat)}
      </table>
      <p>adalah benar warga kami. Surat ini diberikan sebagai <b>${escapeHtml(l.jenis_surat)}</b> untuk keperluan:</p>
      <p class="keperluan">${escapeHtml(l.keperluan)}</p>
      ${l.tanggal_pelaksanaan ? `<p>Tanggal pelaksanaan: ${escapeHtml(formatDate(l.tanggal_pelaksanaan))}.</p>` : ''}
      <p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
      <p class="tanggal">${escapeHtml(formatDate(l.acc_ketua_at))}</p>
      <div class="signs">
        ${sign('Sekretaris', l.acc_sekretaris_nama)}${sign('Bendahara', l.acc_bendahara_nama)}${sign('Ketua RW/RT', l.acc_ketua_nama)}
      </div>`, `
      .center { text-align: center; }
      table.info { margin: 10px 0 10px 20px; border-collapse: collapse; }
      table.info td { padding: 2px 6px 2px 0; vertical-align: top; }
      td.label { width: 130px; }
      .keperluan { margin-left: 20px; font-weight: bold; }
      .tanggal { text-align: right; margin-top: 24px; }
      .signs { display: flex; justify-content: space-between; text-align: center; margin-top: 8px; }
      .signs > div { width: 32%; }
      .signs p { margin: 0; }
      .space { height: 64px; }`);
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
        <div class="cms-icon"><FileText :size="20" /></div>
        <div>
          <h2>{{ mine ? 'Surat Keterangan Saya' : 'Surat Keterangan' }}</h2>
          <p>ACC berurutan: Sekretaris (nomor surat diberikan di sini), Bendahara, lalu Ketua.</p>
        </div>
      </div>
      <button v-if="mine || canManage" class="btn btn--primary" @click="open()"><Plus :size="18" /> Ajukan Surat</button>
    </div>
    <div class="cms-filters">
      <div class="cms-search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari nomor, nama, NIK, jenis, atau keperluan…" />
      </div>
      <select v-model="filters.status" class="input">
        <option value="">Semua status</option>
        <option v-for="(s, key) in STATUS" :key="key" :value="key">{{ s.label }}</option>
      </select>
    </div>
    <div class="cms-table-wrap">
      <table class="cms-table cms-table--compact">
        <thead>
          <tr>
            <th>No</th><th>Nomor &amp; Tanggal</th><th v-if="!mine">Pemohon</th><th>Jenis &amp; Keperluan</th>
            <th>ACC</th><th>Status</th><th class="right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Memuat data…</td></tr>
          <tr v-else-if="!rows.length"><td colspan="7" class="empty">Belum ada permohonan surat.</td></tr>
          <template v-else>
            <tr v-for="(l, i) in rows" :key="l.id">
              <td>{{ rowNumber(i) }}</td>
              <td class="nowrap">
                {{ l.nomor_surat || '—' }}
                <small>Diajukan {{ formatDate(l.tanggal_pengajuan, 'short') }}</small>
                <small v-if="l.tanggal_pelaksanaan">Pelaksanaan {{ formatDate(l.tanggal_pelaksanaan, 'short') }}</small>
              </td>
              <td v-if="!mine"><strong>{{ l.nama }}</strong><small>{{ l.nik }}</small></td>
              <td><strong>{{ l.jenis_surat }}</strong><small>{{ l.keperluan }}</small></td>
              <td>
                <div class="acc">
                  <span v-for="s in STEPS" :key="s.key" :class="{ done: l[`acc_${s.key}_at`] }" :title="l[`acc_${s.key}_nama`] || 'Belum ACC'">
                    <CircleCheck v-if="l[`acc_${s.key}_at`]" :size="13" /><Clock v-else :size="13" /> {{ s.label }}
                  </span>
                </div>
              </td>
              <td>
                <span class="badge" :class="STATUS[l.status].cls">{{ STATUS[l.status].label }}</span>
                <small v-if="l.status === 'ditolak'">{{ l.alasan_tolak }}</small>
              </td>
              <td class="right">
                <div class="cms-actions">
                  <button v-if="canAcc(l)" class="btn btn--icon btn--ghost text-green" :title="`ACC ${nextStep(l).label}`" @click="accing = l"><Check :size="15" /></button>
                  <button v-if="canReject(l)" class="btn btn--icon btn--ghost is-danger" title="Tolak" @click="rejecting = l"><Ban :size="15" /></button>
                  <button v-if="l.status === 'disetujui'" class="btn btn--icon btn--ghost" title="Cetak surat" @click="printLetter(l)"><Printer :size="15" /></button>
                  <button v-if="canEdit(l)" class="btn btn--icon btn--ghost" title="Ubah" @click="open(l)"><Pencil :size="15" /></button>
                  <button v-if="canDelete(l)" class="btn btn--icon btn--ghost is-danger" title="Hapus" @click="deleting = l"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <DataPager v-model:limit="filters.limit" :meta="meta" @go="goTo" />
  </div>

  <BaseModal v-if="editing" :title="editing.id ? 'Ubah Permohonan' : 'Ajukan Surat Keterangan'" width="680px" @close="editing = null">
    <form id="letter-form" class="form-grid" novalidate @submit.prevent="save">
      <div v-if="canManage && !editing.id" class="field span-2">
        <label class="field__label">Pemohon</label>
        <WargaPicker v-model="form.user_id" :invalid="Boolean(errors.user_id)" />
        <span class="field__hint">Kosongkan untuk mengajukan atas nama sendiri.</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Jenis Surat *</label>
        <input v-model="form.jenis_surat" class="input" list="letter-types" :class="{ 'input--invalid': errors.jenis_surat }" />
        <datalist id="letter-types"><option v-for="j in JENIS" :key="j" :value="j" /></datalist>
        <span v-if="errors.jenis_surat" class="field__error">{{ errors.jenis_surat }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Keperluan *</label>
        <textarea v-model="form.keperluan" class="input" rows="3" :class="{ 'input--invalid': errors.keperluan }" />
        <span v-if="errors.keperluan" class="field__error">{{ errors.keperluan }}</span>
      </div>
      <div class="field">
        <label class="field__label">Tanggal Pengajuan</label>
        <input v-model="form.tanggal_pengajuan" type="date" class="input" :disabled="Boolean(editing.id)" />
      </div>
      <div class="field">
        <label class="field__label">Tanggal Pelaksanaan</label>
        <input v-model="form.tanggal_pelaksanaan" type="date" class="input" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="letter-form" :disabled="saving"><span v-if="saving" class="spinner" /> Simpan</button>
    </template>
  </BaseModal>

  <BaseModal v-if="rejecting" title="Tolak Permohonan" width="480px" @close="rejecting = null">
    <div class="field">
      <label class="field__label">Alasan penolakan *</label>
      <textarea v-model="alasan" class="input" rows="3" :class="{ 'input--invalid': errors.alasan }" />
      <span v-if="errors.alasan" class="field__error">{{ errors.alasan }}</span>
    </div>
    <template #footer>
      <button class="btn btn--ghost" @click="rejecting = null">Batal</button>
      <button class="btn btn--danger" :disabled="saving" @click="runReject">Tolak Surat</button>
    </template>
  </BaseModal>

  <ConfirmDialog
    v-if="accing"
    :title="`ACC ${nextStep(accing).label}`"
    confirm-label="Ya, ACC"
    :danger="false"
    :action="runAcc"
    @close="accing = null"
  >
    Setujui <strong>{{ accing.jenis_surat }}</strong> untuk <strong>{{ accing.nama }}</strong>?
    <template v-if="nextStep(accing).key === 'sekretaris'"> Nomor surat akan diberikan otomatis.</template>
  </ConfirmDialog>
  <ConfirmDialog v-if="deleting" title="Hapus Permohonan" :action="() => remove(deleting.id)" @close="deleting = null">
    Permohonan <strong>{{ deleting.jenis_surat }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>

<style scoped>
.acc { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--subtle); }
.acc span { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.acc .done { color: var(--primary); font-weight: 600; }
</style>
