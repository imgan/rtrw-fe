<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  CalendarDays, Building2, FileText, Globe, Hammer, House, KeyRound, ReceiptText, LayoutDashboard, LogOut, Menu, Megaphone, PhoneCall, ShieldCheck, UserCog, Users,
  Wallet, X,
} from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const open = ref(false);

// Menu per section; item tampil hanya bila pengguna memiliki hak aksesnya, section kosong disembunyikan.
const sections = [
  {
    items: [
      { label: 'Dasbor', icon: LayoutDashboard, to: { name: 'dashboard' } },
      { label: 'Lihat Beranda Publik', icon: Globe, href: '/' },
    ],
  },
  {
    title: 'Layanan Saya',
    items: [
      { label: 'Surat Saya', icon: FileText, to: { name: 'my-letters' } },
      { label: 'Pembayaran Saya', icon: ReceiptText, to: { name: 'my-payments' } },
    ],
  },
  {
    title: 'Layanan Warga',
    items: [
      { label: 'Surat Keterangan', icon: FileText, to: { name: 'cms-letters' }, permission: ['letters.manage', 'letters.acc_sekretaris', 'letters.acc_bendahara', 'letters.acc_ketua'] },
      { label: 'Pembayaran Warga', icon: ReceiptText, to: { name: 'cms-payments' }, permission: 'payments.manage' },
      { label: 'Pembangunan Lingkungan', icon: Hammer, to: { name: 'cms-projects' }, permission: 'projects.manage' },
    ],
  },
  {
    title: 'Konten Beranda',
    items: [
      { label: 'Pengaturan Beranda', icon: House, to: { name: 'cms-home' }, permission: 'home.manage' },
      { label: 'Pengumuman', icon: Megaphone, to: { name: 'cms-announcements' }, permission: 'announcements.manage' },
      { label: 'Kegiatan Warga', icon: CalendarDays, to: { name: 'cms-activities' }, permission: 'activities.manage' },
      { label: 'Fasilitas Umum', icon: Building2, to: { name: 'cms-facilities' }, permission: 'facilities.manage' },
      { label: 'Kas RT', icon: Wallet, to: { name: 'cms-cash' }, permission: 'cash.manage' },
      { label: 'Kontak Pengurus', icon: PhoneCall, to: { name: 'cms-contacts' }, permission: 'contacts.manage' },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'Struktur Pengurus RT/RW', icon: UserCog, to: { name: 'cms-struktur' }, permission: 'struktur.manage' },
      { label: 'Master User', icon: Users, to: { name: 'users' }, permission: 'users.manage' },
      { label: 'Role & Hak Akses', icon: KeyRound, to: { name: 'cms-roles' }, permission: 'roles.manage' },
    ],
  },
];

const menu = computed(() =>
  sections.flatMap((s) => {
    const items = s.items.filter((i) => !i.permission || auth.can(...[].concat(i.permission)));
    if (!items.length) return [];
    return s.title ? [{ section: s.title }, ...items] : items;
  })
);
const initials = computed(() =>
  (auth.user?.nama || '?').split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase()
);

function logout() {
  auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <div class="app" :class="{ 'app--open': open }">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="logo"><ShieldCheck :size="20" /></div>
        <div>
          <strong>Warga Harmoni</strong>
          <small>RT 04 / RW 08 Sukamaju</small>
        </div>
        <button class="sidebar__close" aria-label="Tutup menu" @click="open = false"><X :size="20" /></button>
      </div>

      <nav class="nav">
        <template v-for="(item, i) in menu" :key="i">
          <div v-if="item.section" class="nav__section">{{ item.section }}</div>
          <a v-else-if="item.href" :href="item.href" target="_blank" class="nav__item">
            <component :is="item.icon" :size="18" /> {{ item.label }}
          </a>
          <RouterLink v-else :to="item.to" class="nav__item" @click="open = false">
            <component :is="item.icon" :size="18" /> {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <div class="sidebar__user">
        <div class="avatar">{{ initials }}</div>
        <div class="sidebar__who">
          <strong>{{ auth.user?.nama }}</strong>
          <small>{{ auth.user?.role?.nama }}<template v-if="auth.user?.username"> · @{{ auth.user.username }}</template></small>
        </div>
        <button class="btn btn--icon btn--ghost" title="Keluar" @click="logout"><LogOut :size="16" /></button>
      </div>
    </aside>

    <div class="backdrop" @click="open = false" />

    <div class="main">
      <header class="header">
        <button class="header__menu" aria-label="Buka menu" @click="open = true"><Menu :size="22" /></button>
        <h1>{{ route.meta.title }}</h1>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app { display: flex; min-height: 100vh; }

.sidebar {
  width: 264px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px;
  border-bottom: 1px solid var(--border);
}
.sidebar__brand strong { display: block; color: var(--primary); font-size: 16px; }
.sidebar__brand small { color: var(--muted); font-size: 12px; }
.logo {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
}
.sidebar__close { display: none; margin-left: auto; color: var(--muted); }

.nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav__section {
  margin: 16px 10px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--subtle);
  text-transform: uppercase;
}
.nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}
.nav__item:hover { background: var(--surface-muted); color: var(--text); }
.nav__item.router-link-exact-active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  font-size: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.sidebar__who { flex: 1; min-width: 0; }
.sidebar__who strong, .sidebar__who small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar__who strong { font-size: 14px; }
.sidebar__who small { font-size: 12px; color: var(--muted); }

.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.header {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 28px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.header h1 { font-size: 18px; font-weight: 700; }
.header__menu { display: none; color: var(--text); }
.content { padding: 28px; }

.backdrop { display: none; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }
  .app--open .sidebar { transform: none; }
  .app--open .backdrop { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 30; }
  .sidebar__close, .header__menu { display: flex; }
  .header { padding: 0 16px; }
  .content { padding: 16px; }
}
</style>
