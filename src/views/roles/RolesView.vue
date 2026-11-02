<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { KeyRound, Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { rolesApi, roleBadgeClass } from '@/services/roles';
import { errorMessage, fieldErrors } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

const toast = useToast();
const auth = useAuthStore();

const roles = ref([]);
const catalog = ref([]);
const loading = ref(false);

const editing = ref(null);
const deleting = ref(null);
const saving = ref(false);
const errors = ref({});
const form = reactive({ nama: '', slug: '', deskripsi: '', permissions: [] });

const labelOf = computed(() => Object.fromEntries(catalog.value.flatMap((g) => g.items.map((i) => [i.key, i.label]))));
const isAdminRole = computed(() => editing.value?.slug === 'admin');
const isOwnRole = computed(() => editing.value?.id && editing.value.id === auth.user?.role?.id);
const locked = computed(() => isAdminRole.value || isOwnRole.value);

async function load() {
  loading.value = true;
  try {
    [roles.value, catalog.value] = await Promise.all([rolesApi.list(), rolesApi.permissions()]);
  } catch (err) {
    toast.error(errorMessage(err));
  } finally {
    loading.value = false;
  }
}

function open(role = {}) {
  Object.assign(form, {
    nama: role.nama || '',
    slug: role.slug || '',
    deskripsi: role.deskripsi || '',
    permissions: [...(role.permissions || [])],
  });
  errors.value = {};
  editing.value = role;
}

function toggleGroup(group, on) {
  const keys = group.items.map((i) => i.key);
  form.permissions = on
    ? [...new Set([...form.permissions, ...keys])]
    : form.permissions.filter((p) => !keys.includes(p));
}
const groupChecked = (group) => group.items.every((i) => form.permissions.includes(i.key));

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const res = editing.value.id ? await rolesApi.update(editing.value.id, form) : await rolesApi.create(form);
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

async function remove(id) {
  const res = await rolesApi.remove(id);
  toast.success(res.message);
  load();
}

onMounted(load);
</script>

<template>
  <div class="card">
    <div class="cms-toolbar">
      <div class="cms-toolbar__title">
        <div class="cms-icon"><ShieldCheck :size="20" /></div>
        <div>
          <h2>Role &amp; Hak Akses</h2>
          <p>Atur modul CMS yang boleh dikelola oleh setiap role. Perubahan langsung berlaku tanpa login ulang.</p>
        </div>
      </div>
      <button class="btn btn--primary" @click="open()"><Plus :size="18" /> Tambah Role</button>
    </div>

    <div class="cms-table-wrap">
      <table class="cms-table">
        <thead>
          <tr><th>Role</th><th>Hak Akses</th><th>Pengguna</th><th class="right">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="empty">Memuat data…</td></tr>
          <template v-else>
            <tr v-for="r in roles" :key="r.id">
              <td>
                <span class="badge" :class="roleBadgeClass(r.slug)">{{ r.nama }}</span>
                <span v-if="r.is_system" class="system" title="Role bawaan sistem"><Lock :size="12" /> Sistem</span>
                <small>{{ r.deskripsi }}</small>
                <small class="slug">slug: {{ r.slug }}</small>
              </td>
              <td class="perms">
                <span v-if="r.permissions.includes('*')" class="chip chip--all"><KeyRound :size="12" /> Semua akses</span>
                <span v-else-if="!r.permissions.length" class="muted">Tanpa akses CMS (portal warga)</span>
                <template v-else>
                  <span v-for="p in r.permissions" :key="p" class="chip">{{ labelOf[p] || p }}</span>
                </template>
              </td>
              <td class="nowrap"><Users :size="14" /> {{ r.user_count }}</td>
              <td class="right">
                <div class="cms-actions">
                  <button class="btn btn--icon btn--ghost" title="Ubah" @click="open(r)"><Pencil :size="15" /></button>
                  <button
                    class="btn btn--icon btn--ghost is-danger"
                    :title="r.is_system ? 'Role sistem tidak dapat dihapus' : r.user_count ? 'Masih dipakai pengguna' : 'Hapus'"
                    :disabled="r.is_system || r.user_count > 0"
                    @click="deleting = r"
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
  </div>

  <BaseModal v-if="editing" :title="editing.id ? `Ubah Role: ${editing.nama}` : 'Tambah Role'" width="640px" @close="editing = null">
    <form id="role-form" class="form-grid" novalidate @submit.prevent="save">
      <div class="field">
        <label class="field__label">Nama Role *</label>
        <input v-model="form.nama" class="input" placeholder="mis. Bendahara RT" :class="{ 'input--invalid': errors.nama }" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field">
        <label class="field__label">Slug</label>
        <input v-model="form.slug" class="input" :disabled="editing.is_system" placeholder="otomatis dari nama" :class="{ 'input--invalid': errors.slug }" />
        <span v-if="errors.slug" class="field__error">{{ errors.slug }}</span>
        <span v-else-if="editing.is_system" class="field__hint">Slug role sistem tidak dapat diubah.</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Deskripsi</label>
        <input v-model="form.deskripsi" class="input" />
      </div>

      <div class="field span-2">
        <label class="field__label">Hak Akses</label>
        <p v-if="isAdminRole" class="note">Administrator selalu memiliki akses penuh ke seluruh modul.</p>
        <p v-else-if="isOwnRole" class="note">Ini role yang sedang Anda pakai, hak aksesnya tidak dapat Anda ubah sendiri.</p>
        <div v-else class="perm-groups">
          <fieldset v-for="g in catalog" :key="g.group" class="perm-group">
            <legend>
              <label class="check">
                <input type="checkbox" :checked="groupChecked(g)" :disabled="locked" @change="toggleGroup(g, $event.target.checked)" />
                {{ g.group }}
              </label>
            </legend>
            <label v-for="item in g.items" :key="item.key" class="check perm">
              <input v-model="form.permissions" type="checkbox" :value="item.key" :disabled="locked" />
              <span>{{ item.label }} <small>{{ item.key }}</small></span>
            </label>
          </fieldset>
          <p class="field__hint">Role tanpa hak akses hanya dapat masuk ke portal warga (NIK + PIN).</p>
        </div>
      </div>
    </form>
    <template #footer>
      <button class="btn btn--ghost" @click="editing = null">Batal</button>
      <button class="btn btn--primary" type="submit" form="role-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Simpan
      </button>
    </template>
  </BaseModal>

  <ConfirmDialog v-if="deleting" title="Hapus Role" :action="() => remove(deleting.id)" @close="deleting = null">
    Role <strong>{{ deleting.nama }}</strong> akan dihapus permanen.
  </ConfirmDialog>
</template>

<style scoped>
.system { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; font-size: 11px; color: var(--muted); font-weight: 600; }
.slug { font-family: ui-monospace, Consolas, monospace; font-size: 11.5px !important; }
.perms { display: flex; flex-wrap: wrap; gap: 6px; max-width: 520px; }
.chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; background: var(--surface-muted); border: 1px solid var(--border); font-size: 12px; }
.chip--all { background: #e8effd; border-color: #c9d6f3; color: var(--link); font-weight: 600; }
.muted { color: var(--muted); font-size: 13px; }
.note { padding: 10px 14px; border-radius: 8px; background: var(--surface-muted); color: var(--muted); font-size: 13px; }
.perm-groups { display: flex; flex-direction: column; gap: 12px; }
.perm-group { border: 1px solid var(--border); border-radius: 10px; padding: 4px 16px 12px; margin: 0; }
.perm-group legend { padding: 0 6px; font-weight: 600; }
.perm-group legend .check { height: 32px; }
.perm { display: flex; height: auto; padding: 6px 0; }
.perm small { display: block; font-family: ui-monospace, Consolas, monospace; font-size: 11px; color: var(--subtle); }
</style>
