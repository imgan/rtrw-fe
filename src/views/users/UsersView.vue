<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, KeyRound, Pencil, Plus, Search, Trash2, Users } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import UserFormModal from './UserFormModal.vue';
import { usersApi } from '@/services/users';
import { rolesApi, roleBadgeClass } from '@/services/roles';
import { errorMessage } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const toast = useToast();

const rows = ref([]);
const meta = ref({ page: 1, total: 0, total_pages: 1, limit: 10 });
const loading = ref(false);
const filters = reactive({ search: '', role_id: '', status: '', akun: '', keberadaan: '', page: 1, limit: 10 });
const keberadaanBadge = {
  netap: { label: 'Netap', cls: 'badge--green' },
  pindah: { label: 'Pindah', cls: 'badge--amber' },
  meninggal: { label: 'Meninggal', cls: 'badge--gray' },
};
const keluargaLabel = { suami: 'Suami', istri: 'Istri', anak: 'Anak', lainnya: 'Lainnya' };
const roles = ref([]);

const formOpen = ref(false);
const editing = ref(null);
const confirm = ref(null); // { type: 'delete' | 'reset', user }
const busy = ref(false);

const hunianLabel = { tetap: 'Tetap', kontrak: 'Kontrak', kost: 'Kost' };

async function load() {
  loading.value = true;
  try {
    const res = await usersApi.list(filters);
    rows.value = res.data;
    meta.value = res.meta;
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    loading.value = false;
  }
}

let debounce;
watch(() => filters.search, () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    filters.page = 1;
    load();
  }, 350);
});
watch(() => [filters.role_id, filters.status, filters.akun, filters.keberadaan, filters.limit], () => {
  filters.page = 1;
  load();
});

function goTo(page) {
  if (page < 1 || page > meta.value.total_pages) return;
  filters.page = page;
  load();
}

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}
function openEdit(user) {
  editing.value = user;
  formOpen.value = true;
}
function onSaved() {
  formOpen.value = false;
  load();
}

// Sama dengan aturan backend: hanya boleh mengelola akun yang hak aksesnya tidak melebihi milik sendiri.
const canManage = (user) =>
  auth.isAdmin || (!user.permissions.includes('*') && user.permissions.every((p) => auth.permissions.includes(p)));
const isSelf = (user) => user.id === auth.user?.id;

async function runConfirm() {
  const { type, user } = confirm.value;
  busy.value = true;
  try {
    const res = type === 'delete' ? await usersApi.remove(user.id) : await usersApi.resetPin(user.id);
    toast.success(res.message);
    confirm.value = null;
    if (type === 'delete' && rows.value.length === 1 && filters.page > 1) filters.page--;
    load();
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    busy.value = false;
  }
}

const formatDate = (v) =>
  v ? new Date(v.replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

onMounted(async () => {
  load();
  try {
    roles.value = await rolesApi.list();
  } catch (err) {
    toast.error(errorMessage(err));
  }
});
</script>

<template>
  <div class="card">
    <div class="toolbar">
      <div class="toolbar__title">
        <div class="icon"><Users :size="20" /></div>
        <div>
          <h2>Master User</h2>
          <p>{{ meta.total }} pengguna terdaftar · warga &amp; akun pengurus</p>
        </div>
      </div>
      <button class="btn btn--primary" :disabled="!roles.length" @click="openCreate"><Plus :size="18" /> Tambah Pengguna</button>
    </div>

    <div class="filters">
      <div class="search">
        <Search :size="18" />
        <input v-model="filters.search" class="input" placeholder="Cari nama, NIK, No. KK, username, atau blok…" />
      </div>
      <select v-model="filters.role_id" class="input">
        <option value="">Semua role</option>
        <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nama }}</option>
      </select>
      <select v-model="filters.keberadaan" class="input">
        <option value="">Semua keberadaan</option>
        <option value="netap">Netap</option>
        <option value="pindah">Pindah</option>
        <option value="meninggal">Meninggal</option>
      </select>
      <select v-model="filters.akun" class="input">
        <option value="">Semua akun</option>
        <option value="staff">Punya username</option>
      </select>
      <select v-model="filters.status" class="input">
        <option value="">Semua status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nama / NIK</th>
            <th>Kontak</th>
            <th>Alamat</th>
            <th>Role / Username</th>
            <th>Status</th>
            <th>Login Terakhir</th>
            <th class="right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty">Memuat data…</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td colspan="7" class="empty">Belum ada data warga yang sesuai.</td>
          </tr>
          <template v-else>
          <tr v-for="u in rows" :key="u.id">
            <td>
              <strong>{{ u.nama }}</strong>
              <small class="mono">NIK {{ u.nik }}</small>
              <small v-if="u.no_kk" class="mono">KK {{ u.no_kk }}</small>
              <small v-if="u.status_keluarga">{{ keluargaLabel[u.status_keluarga] }}</small>
            </td>
            <td>
              {{ u.no_wa || '—' }}
              <small>{{ u.email }}</small>
            </td>
            <td>
              {{ u.blok ? `Blok ${u.blok} No. ${u.no_rumah || '-'}` : '—' }}
              <small>{{ hunianLabel[u.status_hunian] }}</small>
            </td>
            <td>
              <span class="badge" :class="roleBadgeClass(u.role.slug)">{{ u.role.nama }}</span>
              <small v-if="u.username" class="mono">@{{ u.username }}</small>
              <small v-if="u.jabatan">{{ u.jabatan }}</small>
            </td>
            <td>
              <span class="badge" :class="u.is_active ? 'badge--green' : 'badge--red'">
                <span class="dot" /> {{ u.is_active ? 'Aktif' : 'Nonaktif' }}
              </span>
              <small><span class="badge" :class="keberadaanBadge[u.keberadaan].cls">{{ keberadaanBadge[u.keberadaan].label }}</span></small>
            </td>
            <td class="muted">{{ formatDate(u.last_login_at) }}</td>
            <td class="right">
              <div v-if="canManage(u)" class="actions">
                <button class="btn btn--icon btn--ghost" title="Ubah" @click="openEdit(u)"><Pencil :size="15" /></button>
                <button class="btn btn--icon btn--ghost" title="Reset PIN" @click="confirm = { type: 'reset', user: u }">
                  <KeyRound :size="15" />
                </button>
                <button
                  class="btn btn--icon btn--ghost danger"
                  title="Hapus"
                  :disabled="isSelf(u)"
                  @click="confirm = { type: 'delete', user: u }"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <div class="pager__size">
        Tampilkan
        <select v-model.number="filters.limit" class="input">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        baris
      </div>
      <div class="pager__nav">
        <span>Halaman {{ meta.page }} dari {{ meta.total_pages }}</span>
        <button class="btn btn--icon btn--ghost" :disabled="meta.page <= 1" @click="goTo(meta.page - 1)">
          <ChevronLeft :size="16" />
        </button>
        <button class="btn btn--icon btn--ghost" :disabled="meta.page >= meta.total_pages" @click="goTo(meta.page + 1)">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>

  <UserFormModal v-if="formOpen" :user="editing" :roles="roles" @close="formOpen = false" @saved="onSaved" />

  <BaseModal
    v-if="confirm"
    :title="confirm.type === 'delete' ? 'Hapus Data Warga' : 'Reset PIN Warga'"
    width="440px"
    @close="confirm = null"
  >
    <p v-if="confirm.type === 'delete'" class="confirm-text">
      Data <strong>{{ confirm.user.nama }}</strong> beserta akun portalnya akan dihapus permanen. Lanjutkan?
    </p>
    <p v-else class="confirm-text">
      PIN <strong>{{ confirm.user.nama }}</strong> akan direset ke tanggal lahir (DDMMYY), atau 123456 bila tanggal
      lahir belum diisi.
    </p>
    <template #footer>
      <button class="btn btn--ghost" @click="confirm = null">Batal</button>
      <button
        class="btn"
        :class="confirm.type === 'delete' ? 'btn--danger' : 'btn--primary'"
        :disabled="busy"
        @click="runConfirm"
      >
        <span v-if="busy" class="spinner" />
        {{ confirm.type === 'delete' ? 'Ya, Hapus' : 'Reset PIN' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
}
.toolbar__title { display: flex; align-items: center; gap: 12px; }
.toolbar h2 { font-size: 17px; }
.toolbar p { color: var(--muted); font-size: 13px; margin-top: 2px; }
.icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  display: grid;
  place-items: center;
}

.filters { display: grid; grid-template-columns: 2fr repeat(4, 1fr); gap: 12px; padding: 16px 22px; }
.search { position: relative; }
.search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--subtle); }
.search .input { padding-left: 40px; }

.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th {
  text-align: left;
  padding: 12px 22px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.table td { padding: 14px 22px; border-top: 1px solid var(--border); vertical-align: top; }
.table td small { display: block; color: var(--muted); font-size: 12.5px; margin-top: 3px; }
.table tbody tr:hover { background: #fafbfd; }
.mono { font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
.muted { color: var(--muted); white-space: nowrap; }
.right { text-align: right; }
.empty { text-align: center; color: var(--muted); padding: 40px !important; }
.actions { display: inline-flex; gap: 6px; }
.danger { color: var(--danger); }
.danger:hover:not(:disabled) { background: var(--danger-soft); }

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  font-size: 14px;
  color: var(--muted);
}
.pager__size, .pager__nav { display: flex; align-items: center; gap: 8px; }
.pager__size .input { width: 74px; height: 34px; padding: 0 8px; }

.confirm-text { line-height: 1.6; color: var(--muted); }
.confirm-text strong { color: var(--text); }

@media (max-width: 720px) {
  .filters { grid-template-columns: 1fr; padding: 14px 16px; }
  .toolbar { padding: 16px; }
}
</style>
