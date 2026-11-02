<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { Building2, CalendarDays, FileText, Globe, Hammer, House, KeyRound, ReceiptText, Megaphone, PhoneCall, UserCog, Users, Wallet } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const allModules = [
  { icon: FileText, title: 'Surat Saya', desc: 'Ajukan surat keterangan dan pantau proses ACC-nya.', to: 'my-letters' },
  { icon: ReceiptText, title: 'Pembayaran Saya', desc: 'Lihat dan cetak riwayat pembayaran iuran Anda.', to: 'my-payments' },
  { icon: FileText, title: 'Surat Keterangan', desc: 'Proses ACC, tolak, dan cetak surat keterangan warga.', to: 'cms-letters', permission: ['letters.manage', 'letters.acc_sekretaris', 'letters.acc_bendahara', 'letters.acc_ketua'] },
  { icon: ReceiptText, title: 'Pembayaran Warga', desc: 'Catat, cari, dan cetak pembayaran bulanan warga.', to: 'cms-payments', permission: 'payments.manage' },
  { icon: Hammer, title: 'Pembangunan Lingkungan', desc: 'Catat kegiatan pembangunan, SK, jadwal, dan nilai projek.', to: 'cms-projects', permission: 'projects.manage' },
  { icon: House, title: 'Pengaturan Beranda', desc: 'Ubah sambutan, statistik warga, kartu siaga, denah wilayah, dan footer.', to: 'cms-home', permission: 'home.manage' },
  { icon: Megaphone, title: 'Pengumuman', desc: 'Terbitkan woro-woro kerja bakti, kesehatan, dan keamanan lingkungan.', to: 'cms-announcements', permission: 'announcements.manage' },
  { icon: CalendarDays, title: 'Kegiatan Warga', desc: 'Catat agenda dan dokumentasi foto kegiatan untuk beranda.', to: 'cms-activities', permission: 'activities.manage' },
  { icon: Building2, title: 'Fasilitas Umum', desc: 'Kelola daftar, kondisi, dan foto fasilitas lingkungan.', to: 'cms-facilities', permission: 'facilities.manage' },
  { icon: Wallet, title: 'Kas RT', desc: 'Catat pemasukan iuran & pengeluaran; saldo berjalan dihitung otomatis.', to: 'cms-cash', permission: 'cash.manage' },
  { icon: PhoneCall, title: 'Kontak Pengurus', desc: 'Atur daftar kontak pengurus dan nomor darurat di beranda.', to: 'cms-contacts', permission: 'contacts.manage' },
  { icon: UserCog, title: 'Struktur Pengurus', desc: 'Kelola pejabat RT/RW, SK kelurahan, dan riwayat mutasi jabatan.', to: 'cms-struktur', permission: 'struktur.manage' },
  { icon: Users, title: 'Master User', desc: 'Kelola data warga, akun login pengurus, dan role pengguna.', to: 'users', permission: 'users.manage' },
  { icon: KeyRound, title: 'Role & Hak Akses', desc: 'Atur modul CMS yang boleh dikelola oleh setiap role.', to: 'cms-roles', permission: 'roles.manage' },
];
const modules = computed(() => allModules.filter((m) => !m.permission || auth.can(...[].concat(m.permission))));
</script>

<template>
  <section class="welcome card">
    <div>
      <span class="badge badge--green"><span class="dot" /> {{ auth.isStaff ? 'Panel Pengurus' : 'Portal Warga' }}</span>
      <h2>Halo, {{ auth.user?.nama }} 👋</h2>
      <p>
        Selamat datang di Sistem Warga Harmoni RT 04 / RW 08 Sukamaju.
        <template v-if="auth.user?.blok">Alamat terdaftar: Blok {{ auth.user.blok }} No. {{ auth.user.no_rumah }}.</template>
      </p>
    </div>
    <a href="/" target="_blank" class="btn btn--primary"><Globe :size="18" /> Lihat Beranda Publik</a>
  </section>

  <div v-if="modules.length" class="grid">
    <RouterLink v-for="m in modules" :key="m.title" :to="{ name: m.to }" class="module card">
      <div class="module__icon"><component :is="m.icon" :size="22" /></div>
      <h3>{{ m.title }}</h3>
      <p>{{ m.desc }}</p>
    </RouterLink>
  </div>
</template>

<style scoped>
.welcome {
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: linear-gradient(120deg, #fff 40%, var(--primary-soft));
}
.welcome h2 { margin-top: 12px; font-size: 24px; }
.welcome p { margin-top: 6px; color: var(--muted); }

.grid { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.module { padding: 22px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; color: var(--text); transition: border-color 0.15s; }
.module:hover { border-color: var(--primary); }
.module__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  display: grid;
  place-items: center;
  margin-bottom: 4px;
}
.module h3 { font-size: 16px; }
.module p { color: var(--muted); font-size: 14px; line-height: 1.5; }
</style>
