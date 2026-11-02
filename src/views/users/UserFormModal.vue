<script setup>
import { computed, reactive, ref } from 'vue';
import { Eye, EyeOff } from '@lucide/vue';
import BaseModal from '@/components/BaseModal.vue';
import { usersApi } from '@/services/users';
import { errorMessage, fieldErrors } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  user: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
});
const emit = defineEmits(['close', 'saved']);

const auth = useAuthStore();
const toast = useToast();
const isEdit = computed(() => Boolean(props.user));
const saving = ref(false);
const showPassword = ref(false);
const errors = ref({});

const wargaRole = props.roles.find((r) => r.slug === 'warga');
const blank = {
  username: '', password: '', role_id: wargaRole?.id || '', nik: '', no_kk: '', nama: '', no_wa: '', email: '',
  jenis_kelamin: '', tanggal_lahir: '', alamat: '', blok: '', no_rumah: '', status_hunian: 'tetap', jabatan: '',
  status_keluarga: '', keberadaan: 'netap', is_active: true, pin: '',
};
const form = reactive({ ...blank });
if (props.user) {
  for (const key of Object.keys(blank)) {
    if (key !== 'pin' && key !== 'password') form[key] = props.user[key] ?? blank[key];
  }
}

// Hanya role yang seluruh hak aksesnya juga dimiliki aktor yang bisa diberikan (sama dengan aturan backend).
const grantable = (role) =>
  auth.isAdmin || (!role.permissions.includes('*') && role.permissions.every((p) => auth.permissions.includes(p)));
const roleOptions = computed(() => props.roles.filter((r) => grantable(r) || r.id === form.role_id));
const selectedRole = computed(() => props.roles.find((r) => r.id === form.role_id));
const hasCmsAccess = computed(() => (selectedRole.value?.permissions.length || 0) > 0);
const isSelf = computed(() => props.user?.id === auth.user?.id);

const onlyDigits = (key, max) => (e) => {
  form[key] = e.target.value.replace(/\D/g, '').slice(0, max);
  e.target.value = form[key];
};

async function submit() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = { ...form };
    if (!payload.pin) delete payload.pin;
    if (!payload.password) delete payload.password;
    if (isSelf.value) delete payload.role_id;
    const res = isEdit.value ? await usersApi.update(props.user.id, payload) : await usersApi.create(payload);
    toast.success(res.message);
    emit('saved', res.data);
  } catch (err) {
    errors.value = fieldErrors(err);
    toast.error(errorMessage(err));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :title="isEdit ? 'Ubah Pengguna' : 'Tambah Pengguna'" width="760px" @close="emit('close')">
    <form id="user-form" class="grid" novalidate @submit.prevent="submit">
      <div class="section">Akun &amp; Role</div>

      <div class="field">
        <label class="field__label">Role *</label>
        <select v-model.number="form.role_id" class="input" :disabled="isSelf" :class="{ 'input--invalid': errors.role_id }">
          <option v-for="r in roleOptions" :key="r.id" :value="r.id">{{ r.nama }}</option>
        </select>
        <span v-if="errors.role_id" class="field__error">{{ errors.role_id }}</span>
        <span v-else-if="isSelf" class="field__hint">Role akun sendiri tidak dapat diubah.</span>
        <span v-else-if="selectedRole" class="field__hint">{{ selectedRole.deskripsi }}</span>
      </div>
      <div class="field">
        <label class="field__label">Jabatan</label>
        <input v-model="form.jabatan" class="input" placeholder="mis. Bendahara RT 04" />
      </div>

      <div class="field">
        <label class="field__label">Username {{ hasCmsAccess ? '*' : '' }}</label>
        <input v-model="form.username" class="input" autocomplete="off" autocapitalize="off" placeholder="mis. bambang.rt04"
          :class="{ 'input--invalid': errors.username }" />
        <span v-if="errors.username" class="field__error">{{ errors.username }}</span>
        <span v-else class="field__hint">Untuk login panel pengurus. Kosongkan untuk mencabut akses login.</span>
      </div>
      <div class="field">
        <label class="field__label">{{ isEdit ? 'Password Baru' : 'Password' }} {{ hasCmsAccess && !user?.has_password ? '*' : '' }}</label>
        <div class="pw">
          <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="input" autocomplete="new-password"
            placeholder="min. 8 karakter" :class="{ 'input--invalid': errors.password }" />
          <button type="button" :aria-label="showPassword ? 'Sembunyikan' : 'Tampilkan'" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" />
          </button>
        </div>
        <span v-if="errors.password" class="field__error">{{ errors.password }}</span>
        <span v-else-if="isEdit" class="field__hint">{{ user.has_password ? 'Kosongkan bila tidak diubah.' : 'Akun ini belum punya password.' }}</span>
      </div>
      <p v-if="hasCmsAccess && !form.username" class="warn span-2">
        Role ini punya akses CMS, tetapi tanpa username &amp; password pengguna hanya bisa masuk ke portal warga.
      </p>

      <div class="field">
        <label class="field__label">{{ isEdit ? 'PIN Warga Baru' : 'PIN Warga' }}</label>
        <input :value="form.pin" class="input" :class="{ 'input--invalid': errors.pin }" inputmode="numeric" maxlength="6"
          placeholder="6 digit" @input="onlyDigits('pin', 6)($event)" />
        <span v-if="errors.pin" class="field__error">{{ errors.pin }}</span>
        <span v-else class="field__hint">
          {{ isEdit ? 'Kosongkan bila tidak diubah.' : 'Kosongkan untuk memakai tanggal lahir (DDMMYY).' }}
        </span>
      </div>
      <div class="field">
        <label class="field__label">Status Akun</label>
        <label class="switch">
          <input v-model="form.is_active" type="checkbox" :disabled="isSelf" />
          <span>{{ form.is_active ? 'Aktif' : 'Nonaktif' }}</span>
        </label>
      </div>

      <div class="section">Data Kependudukan</div>

      <div class="field">
        <label class="field__label">NIK <span class="req">*</span></label>
        <input :value="form.nik" class="input" :class="{ 'input--invalid': errors.nik }" inputmode="numeric"
          placeholder="16 digit NIK" @input="onlyDigits('nik', 16)($event)" />
        <span v-if="errors.nik" class="field__error">{{ errors.nik }}</span>
      </div>
      <div class="field">
        <label class="field__label">No. Kartu Keluarga</label>
        <input :value="form.no_kk" class="input" :class="{ 'input--invalid': errors.no_kk }" inputmode="numeric"
          placeholder="16 digit No. KK" @input="onlyDigits('no_kk', 16)($event)" />
        <span v-if="errors.no_kk" class="field__error">{{ errors.no_kk }}</span>
      </div>
      <div class="field span-2">
        <label class="field__label">Nama Lengkap <span class="req">*</span></label>
        <input v-model="form.nama" class="input" :class="{ 'input--invalid': errors.nama }" placeholder="Sesuai KTP" />
        <span v-if="errors.nama" class="field__error">{{ errors.nama }}</span>
      </div>
      <div class="field">
        <label class="field__label">Jenis Kelamin</label>
        <select v-model="form.jenis_kelamin" class="input">
          <option value="">— Pilih —</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Tanggal Lahir</label>
        <input v-model="form.tanggal_lahir" type="date" class="input" :class="{ 'input--invalid': errors.tanggal_lahir }" />
        <span v-if="errors.tanggal_lahir" class="field__error">{{ errors.tanggal_lahir }}</span>
      </div>

      <div class="field">
        <label class="field__label">Status dalam Keluarga</label>
        <select v-model="form.status_keluarga" class="input">
          <option value="">— Pilih —</option>
          <option value="suami">Suami</option>
          <option value="istri">Istri</option>
          <option value="anak">Anak</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      <div class="field">
        <label class="field__label">Keberadaan</label>
        <select v-model="form.keberadaan" class="input" :disabled="isSelf">
          <option value="netap">Netap</option>
          <option value="pindah">Pindah</option>
          <option value="meninggal">Meninggal</option>
        </select>
        <span class="field__hint">Warga pindah / meninggal tidak dapat login.</span>
      </div>

      <div class="section">Kontak &amp; Hunian</div>

      <div class="field">
        <label class="field__label">No. WhatsApp</label>
        <input v-model="form.no_wa" class="input" :class="{ 'input--invalid': errors.no_wa }" inputmode="tel" placeholder="08xxxxxxxxxx" />
        <span v-if="errors.no_wa" class="field__error">{{ errors.no_wa }}</span>
      </div>
      <div class="field">
        <label class="field__label">Email</label>
        <input v-model="form.email" type="email" class="input" :class="{ 'input--invalid': errors.email }" placeholder="opsional" />
        <span v-if="errors.email" class="field__error">{{ errors.email }}</span>
      </div>
      <div class="field">
        <label class="field__label">Blok</label>
        <input v-model="form.blok" class="input" maxlength="10" placeholder="mis. B" />
      </div>
      <div class="field">
        <label class="field__label">No. Rumah</label>
        <input v-model="form.no_rumah" class="input" maxlength="10" placeholder="mis. 24" />
      </div>
      <div class="field span-2">
        <label class="field__label">Alamat</label>
        <textarea v-model="form.alamat" class="input" rows="2" placeholder="Jl. Kemuning Raya ..." />
      </div>
      <div class="field">
        <label class="field__label">Status Hunian</label>
        <select v-model="form.status_hunian" class="input">
          <option value="tetap">Warga Tetap</option>
          <option value="kontrak">Kontrak</option>
          <option value="kost">Kost</option>
        </select>
      </div>
    </form>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('close')">Batal</button>
      <button class="btn btn--primary" type="submit" form="user-form" :disabled="saving">
        <span v-if="saving" class="spinner" />
        {{ isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 18px; }
.span-2 { grid-column: span 2; }
.section {
  grid-column: span 2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.section:not(:first-child) { margin-top: 8px; }
.req { color: var(--danger); }
.switch { display: inline-flex; align-items: center; gap: 10px; height: 44px; cursor: pointer; font-size: 14px; }
.switch input { width: 18px; height: 18px; accent-color: var(--primary); }
.pw { position: relative; }
.pw .input { padding-right: 42px; }
.pw button { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); display: flex; }
.warn { margin: -4px 0 0; padding: 10px 14px; border-radius: 8px; background: var(--warning-soft); color: var(--warning); font-size: 13px; }
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .span-2, .section { grid-column: span 1; }
}
</style>
