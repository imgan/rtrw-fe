<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  CircleAlert, Eye, EyeOff, FileText, Headset, House, IdCard, Info, Lock, LockKeyhole,
  LogIn, Megaphone, MessageSquareText, PhoneCall, Shield, ShieldCheck, TreePine, UserCog, UserRound, Wallet,
} from '@lucide/vue';
import BrandHeader from '@/components/BrandHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import api, { errorMessage, fieldErrors } from '@/services/api';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const portal = ref('warga');
const showPin = ref(false);
const loading = ref(false);
const serverOnline = ref(true);
// Foto lingkungan di public/images/lingkungan.jpg; bila tidak ada, tampil gradien hijau + caption.
const heroImage = '/images/lingkungan.jpg';
const imageFailed = ref(false);
const formError = ref('');
const errors = ref({});
const form = reactive({ identifier: '', pin: '', username: '', password: '', remember: true });
const isStaff = computed(() => portal.value === 'pengurus');

const features = [
  { icon: FileText, title: 'Surat Mandiri', desc: 'Pengantar RT kilat dengan QR Code resmi.' },
  { icon: Wallet, title: 'Transparansi Kas', desc: 'Laporan iuran warga terbuka dan akuntabel.' },
  { icon: Shield, title: 'Siskamling & Ronda', desc: 'Jadwal pos ronda dan tombol panik darurat.' },
  { icon: Megaphone, title: 'Woro-Woro & Lapor', desc: 'Pengumuman warga dan forum aspirasi cepat.' },
];

function validate() {
  const e = {};
  if (isStaff.value) {
    if (!form.username.trim()) e.username = 'Username wajib diisi';
    if (!form.password) e.password = 'Password wajib diisi';
  } else {
    const id = form.identifier.trim();
    if (!id) e.identifier = 'NIK atau No. WhatsApp wajib diisi';
    else if (!/^\d{16}$/.test(id) && !/^(\+?62|0)8\d{7,12}$/.test(id.replace(/[\s-]/g, '')))
      e.identifier = 'Masukkan 16 digit NIK atau nomor WhatsApp yang valid';
    if (!/^\d{6}$/.test(form.pin)) e.pin = 'PIN harus 6 digit angka';
  }
  errors.value = e;
  return Object.keys(e).length === 0;
}

function switchPortal(value) {
  portal.value = value;
  errors.value = {};
  formError.value = '';
}

async function submit() {
  formError.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    const payload = isStaff.value
      ? { portal: 'pengurus', username: form.username.trim(), password: form.password, remember: form.remember }
      : { portal: 'warga', identifier: form.identifier.trim(), pin: form.pin, remember: form.remember };
    const res = await auth.login(payload);
    toast.success(res.message);
    router.replace(route.query.redirect || '/cms');
  } catch (err) {
    errors.value = fieldErrors(err);
    formError.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

function onPinInput(e) {
  form.pin = e.target.value.replace(/\D/g, '').slice(0, 6);
  e.target.value = form.pin;
}

const comingSoon = (feature) => toast.info(`${feature} segera hadir. Hubungi pengurus RT untuk bantuan.`);

onMounted(async () => {
  if (route.query.expired) toast.info('Sesi Anda telah berakhir, silakan masuk kembali.');
  try {
    await api.get('/health');
  } catch {
    serverOnline.value = false;
  }
});
</script>

<template>
  <div class="page">
    <header class="topbar">
      <BrandHeader />
      <div class="topbar__actions">
        <a class="pill pill--blue" href="tel:081234567890"><Headset :size="18" /> Sekretariat RT</a>
        <span class="pill" :class="serverOnline ? 'pill--ok' : 'pill--down'">
          <span class="dot" /> {{ serverOnline ? 'Server Aktif v2.4' : 'Server Offline' }}
        </span>
      </div>
    </header>

    <main class="shell">
      <!-- Panel informasi -->
      <section class="info">
        <div class="info__top">
          <span class="chip"><span class="dot" /> PORTAL RESMI WARGA</span>
          <span class="info__meta">Kanal Pelayanan 24 Jam</span>
        </div>

        <h1 class="info__title">Sistem Tata Kelola &amp; Hunian Harmonis</h1>
        <p class="info__lead">
          Selamat datang di anjungan digital warga RT 04 / RW 08 Sukamaju. Bersama mewujudkan kerukunan
          bertetangga yang tertib, transparan, dan saling peduli.
        </p>

        <figure class="hero">
          <img
            v-if="!imageFailed"
            :src="heroImage"
            alt="Suasana jalan lingkungan RT 04"
            @error="imageFailed = true"
          />
          <!-- Foto saat ini sudah memuat teks keterangan; caption hanya tampil bila foto gagal dimuat. -->
          <figcaption v-if="imageFailed">
            <strong><TreePine :size="20" /> Lingkungan Asri, Bersih &amp; Guyub</strong>
            <span>Pemenang RT Teladan Ketertiban Lingkungan Sukamaju</span>
          </figcaption>
        </figure>

        <div class="features">
          <div v-for="f in features" :key="f.title" class="feature">
            <div class="feature__icon"><component :is="f.icon" :size="20" /></div>
            <div>
              <div class="feature__title">{{ f.title }}</div>
              <div class="feature__desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <div class="info__help">
          <span><PhoneCall :size="18" /> Butuh bantuan akun? Hubungi Pak RT:</span>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener">0812-3456-7890</a>
        </div>
      </section>

      <!-- Form login -->
      <section class="auth">
        <span class="eyebrow"><span class="dot" /> AUTENTIKASI AMAN</span>
        <h2 class="auth__title">Selamat Datang di Portal Warga</h2>
        <p class="auth__lead">
          Silakan masuk untuk mengakses permohonan surat pengantar, rekap kas, atau data kepengurusan RT/RW.
        </p>

        <div class="tabs" role="tablist">
          <button
            role="tab"
            :aria-selected="portal === 'warga'"
            :class="{ active: portal === 'warga' }"
            @click="switchPortal('warga')"
          >
            <House :size="20" /> Warga Lingkungan
          </button>
          <button
            role="tab"
            :aria-selected="portal === 'pengurus'"
            :class="{ active: portal === 'pengurus' }"
            @click="switchPortal('pengurus')"
          >
            <UserCog :size="20" /> Pengurus RT / RW
          </button>
        </div>

        <form class="form" novalidate @submit.prevent="submit">
          <div v-if="formError" class="alert-error"><CircleAlert :size="18" /> {{ formError }}</div>

          <template v-if="isStaff">
            <div class="field">
              <label class="field__label" for="username">Username Pengurus</label>
              <div class="input-icon">
                <UserRound :size="20" />
                <input
                  id="username"
                  v-model="form.username"
                  class="input"
                  :class="{ 'input--invalid': errors.username }"
                  autocomplete="username"
                  autocapitalize="off"
                  placeholder="Masukkan username"
                />
              </div>
              <span v-if="errors.username" class="field__error">{{ errors.username }}</span>
              <span v-else class="field__hint">Username diberikan oleh administrator RT / RW.</span>
            </div>

            <div class="field">
              <div class="field__row">
                <label class="field__label" for="password">Password</label>
                <button type="button" class="link" @click="comingSoon('Reset password mandiri')">Lupa Password?</button>
              </div>
              <div class="input-icon">
                <Lock :size="20" />
                <input
                  id="password"
                  v-model="form.password"
                  class="input"
                  :class="{ 'input--invalid': errors.password }"
                  :type="showPin ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  class="input-icon__toggle"
                  :aria-label="showPin ? 'Sembunyikan password' : 'Tampilkan password'"
                  @click="showPin = !showPin"
                >
                  <EyeOff v-if="showPin" :size="20" /><Eye v-else :size="20" />
                </button>
              </div>
              <span v-if="errors.password" class="field__error">{{ errors.password }}</span>
            </div>
          </template>

          <template v-else>
          <div class="field">
            <label class="field__label" for="identifier">Nomor Induk Kependudukan (NIK) / No. WhatsApp</label>
            <div class="input-icon">
              <IdCard :size="20" />
              <input
                id="identifier"
                v-model="form.identifier"
                class="input"
                :class="{ 'input--invalid': errors.identifier }"
                inputmode="numeric"
                autocomplete="username"
                placeholder="Masukkan 16 digit NIK atau 08xxxxxxxx"
              />
            </div>
            <span v-if="errors.identifier" class="field__error">{{ errors.identifier }}</span>
            <span v-else class="field__hint">
              Contoh: 3276xxxxxxxxxxxx (Sesuai tercantum pada Kartu Tanda Penduduk / KK)
            </span>
          </div>

          <div class="field">
            <div class="field__row">
              <label class="field__label" for="pin">PIN Warga (6 Digit)</label>
              <button type="button" class="link" @click="comingSoon('Reset PIN mandiri')">Lupa PIN / Kata Sandi?</button>
            </div>
            <div class="input-icon">
              <Lock :size="20" />
              <input
                id="pin"
                :value="form.pin"
                class="input"
                :class="{ 'input--invalid': errors.pin }"
                :type="showPin ? 'text' : 'password'"
                inputmode="numeric"
                autocomplete="current-password"
                maxlength="6"
                placeholder="Masukkan PIN keamanan 6 digit"
                @input="onPinInput"
              />
              <button
                type="button"
                class="input-icon__toggle"
                :aria-label="showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'"
                @click="showPin = !showPin"
              >
                <EyeOff v-if="showPin" :size="20" /><Eye v-else :size="20" />
              </button>
            </div>
            <span v-if="errors.pin" class="field__error">{{ errors.pin }}</span>
            <span v-else class="field__hint">
              PIN bawaan awal adalah 6 digit tanggal &amp; bulan lahir Anda (DDMMYY) atau yang telah diubah.
            </span>
          </div>
          </template>

          <div class="form__row">
            <label class="checkbox">
              <input v-model="form.remember" type="checkbox" />
              <span>Ingat sesi saya di perangkat ini</span>
            </label>
            <span class="secure"><ShieldCheck :size="16" /> Koneksi Aman SSL</span>
          </div>

          <button class="btn btn--primary btn--block btn--lg" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <LogIn v-else :size="20" />
            {{ portal === 'warga' ? 'Masuk ke Portal Warga' : 'Masuk ke Panel Pengurus' }}
          </button>

          <template v-if="!isStaff">
            <div class="divider"><span>ATAU MASUK CEPAT</span></div>

            <button type="button" class="btn btn--outline btn--block btn--lg" @click="comingSoon('Masuk via OTP WhatsApp')">
              <MessageSquareText :size="20" /> Masuk via Kode OTP WhatsApp Warga
            </button>
          </template>
        </form>

        <div class="notice">
          <Info :size="20" />
          <div>
            <strong>Warga Baru Pindah / Belum Terdata?</strong>
            <p>
              Silakan laporkan data Kartu Keluarga Anda ke Rumah Ketua RT 04 (Bpk. Bambang Supriyadi) di No. 24 Blok B
              atau isi permohonan pendaftaran warga baru mandiri secara berkas fisik.
            </p>
          </div>
        </div>

        <div class="auth__foot">
          <span><LockKeyhole :size="18" /> Data Kependudukan Terenkripsi Kemenkominfo Standar RT</span>
          <span>© {{ new Date().getFullYear() }} RT 04 / RW 08 Sukamaju. Hak Cipta Dilindungi.</span>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer__left">
        <strong>Warga Harmoni Sukamaju</strong>
        <span>•</span><span>Jl. Kemuning Raya RT 04 RW 08 Sukamaju</span>
        <span>•</span><span>Pos Satpam: 0819-0808-0408</span>
      </div>
      <nav class="footer__nav">
        <a href="#">Privasi &amp; Keamanan Data</a>
        <a href="#">Panduan Warga</a>
        <a href="#" class="strong">Kontak Pengurus</a>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }

/* Top bar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 50px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.topbar__actions { display: flex; gap: 20px; align-items: center; }
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
}
.pill--blue { background: #eef2fc; border-color: #c9d6f3; color: #1e3a8a; }
.pill--ok .dot { color: #22c55e; }
.pill--down .dot { color: var(--danger); }

/* Shell */
.shell {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.47fr);
  margin: 40px 50px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
}

/* Info panel */
.info {
  padding: 40px 40px 36px;
  background: linear-gradient(160deg, #e7eef8 0%, #f3f6fb 55%, #e9eefa 100%);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}
.info__top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: var(--shadow);
}
.chip .dot { width: 7px; height: 7px; }
.info__meta { font-size: 13px; color: var(--muted); }
.info__title { margin-top: 32px; font-size: 36px; line-height: 1.25; font-weight: 700; }
.info__lead { margin-top: 10px; color: var(--muted); line-height: 1.75; font-size: 16px; }

.hero {
  position: relative;
  margin: 32px 0 0;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.18), transparent 40%),
    linear-gradient(135deg, #2f7d4f, #1b5e46 50%, #0f3d2e);
  box-shadow: var(--shadow);
}
.hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero figcaption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 40px 20px 18px;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hero strong { display: flex; align-items: center; gap: 6px; font-size: 19px; }
.hero span { font-size: 14px; opacity: 0.9; }

.features { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 36px; }
.feature {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  box-shadow: var(--shadow);
}
.feature__icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--surface-muted);
  color: var(--primary);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.feature__title { font-weight: 600; font-size: 16px; }
.feature__desc { font-size: 14px; color: var(--muted); line-height: 1.45; margin-top: 2px; }

.info__help {
  margin-top: auto;
  padding-top: 22px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--muted);
}
.features { margin-bottom: 36px; }
.info__help span { display: inline-flex; align-items: center; gap: 10px; }
.info__help a { color: var(--primary); font-weight: 700; letter-spacing: 0.05em; }

/* Auth panel */
.auth { padding: 40px 40px 36px 70px; display: flex; flex-direction: column; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--primary);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.08em;
}
.eyebrow .dot { width: 10px; height: 10px; }
.auth__title { margin-top: 8px; font-size: 36px; font-weight: 700; }
.auth__lead { margin-top: 8px; color: var(--muted); line-height: 1.7; font-size: 16px; max-width: 680px; }

.tabs {
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-muted);
}
.tabs button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: 50px;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  color: var(--text);
  transition: background 0.15s, color 0.15s;
}
.tabs button.active { background: var(--primary); color: #fff; box-shadow: var(--shadow); }
.tabs button:not(.active):hover { background: #e7ebf2; }

.form { margin-top: 32px; display: flex; flex-direction: column; gap: 22px; }
.form .field__label { font-size: 17px; }
.form .field__hint, .form .field__error { font-size: 14px; }
.field__row { display: flex; justify-content: space-between; align-items: baseline; }
.link { color: var(--link); font-weight: 600; font-size: 15px; }
.link:hover { text-decoration: underline; }

.input-icon { position: relative; }
.input-icon > svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.input-icon .input { height: 58px; padding-left: 54px; font-size: 16px; }
.input-icon__toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  display: flex;
}
.input-icon:has(.input-icon__toggle) .input { padding-right: 54px; }

.form__row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.checkbox { display: inline-flex; align-items: center; gap: 12px; font-size: 17px; cursor: pointer; }
.checkbox input { width: 22px; height: 22px; accent-color: var(--primary); cursor: pointer; }
.secure { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 15px; }
.secure svg { color: var(--primary); }

.divider { display: flex; align-items: center; gap: 18px; color: var(--muted); font-size: 14px; font-weight: 600; letter-spacing: 0.04em; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.form .btn--lg { font-size: 17px; }

.alert-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
  font-weight: 500;
}

.notice {
  margin-top: 30px;
  display: flex;
  gap: 14px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-muted);
}
.notice > svg { color: var(--warning); flex-shrink: 0; margin-top: 2px; }
.notice strong { font-size: 17px; font-weight: 600; }
.notice p { margin-top: 4px; color: var(--muted); font-size: 15px; line-height: 1.55; }

.auth__foot {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.55;
}
.notice { margin-bottom: 40px; }
.auth__foot span:first-child { display: flex; gap: 12px; align-items: flex-start; }
.auth__foot svg { flex-shrink: 0; margin-top: 3px; }

/* Footer */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 20px 50px;
  background: #fff;
  border-top: 1px solid var(--border);
  font-size: 15px;
  color: var(--muted);
}
.footer__left { display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: center; }
.footer__left strong { color: var(--primary); font-weight: 600; }
.footer__nav { display: flex; gap: 30px; }
.footer__nav a { color: var(--text); font-weight: 500; }
.footer__nav a.strong { color: var(--primary); font-weight: 700; }

/* Responsive */
@media (max-width: 1100px) {
  .shell { grid-template-columns: 1fr; }
  .info { border-right: 0; border-bottom: 1px solid var(--border); }
  .auth { padding: 40px; }
}
@media (max-width: 720px) {
  .topbar { padding: 12px 16px; flex-wrap: wrap; }
  .topbar__actions { gap: 8px; }
  .shell { margin: 16px; }
  .info, .auth { padding: 24px 18px; }
  .info__title, .auth__title { font-size: 26px; }
  .features { grid-template-columns: 1fr; }
  .tabs button { font-size: 14px; height: 46px; }
  .form__row, .info__help { flex-direction: column; align-items: flex-start; }
  .auth__foot { grid-template-columns: 1fr; }
  .footer { padding: 16px; }
  .footer__nav { gap: 16px; flex-wrap: wrap; }
}
</style>
