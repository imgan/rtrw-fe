import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/public/HomeView.vue'),
    meta: { title: 'Beranda' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Masuk' },
  },
  {
    path: '/cms',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dasbor' },
      },
      {
        path: 'beranda',
        name: 'cms-home',
        component: () => import('@/views/cms/HomeSettingsView.vue'),
        meta: { title: 'Konten Beranda', permission: 'home.manage' },
      },
      {
        path: 'pengumuman',
        name: 'cms-announcements',
        component: () => import('@/views/cms/AnnouncementsView.vue'),
        meta: { title: 'Pengumuman & Woro-Woro', permission: 'announcements.manage' },
      },
      {
        path: 'kegiatan',
        name: 'cms-activities',
        component: () => import('@/views/cms/ActivitiesView.vue'),
        meta: { title: 'Kegiatan Warga', permission: 'activities.manage' },
      },
      {
        path: 'fasilitas',
        name: 'cms-facilities',
        component: () => import('@/views/cms/FacilitiesView.vue'),
        meta: { title: 'Fasilitas Umum', permission: 'facilities.manage' },
      },
      {
        path: 'kas',
        name: 'cms-cash',
        component: () => import('@/views/cms/CashView.vue'),
        meta: { title: 'Transaksi Kas RT', permission: 'cash.manage' },
      },
      {
        path: 'kontak',
        name: 'cms-contacts',
        component: () => import('@/views/cms/ContactsView.vue'),
        meta: { title: 'Kontak Pengurus & Darurat', permission: 'contacts.manage' },
      },
      {
        path: 'struktur',
        name: 'cms-struktur',
        component: () => import('@/views/cms/struktur/StrukturView.vue'),
        meta: { title: 'Struktur Pengurus', permission: 'struktur.manage' },
      },
      {
        path: 'pembangunan',
        name: 'cms-projects',
        component: () => import('@/views/layanan/ProjectsView.vue'),
        meta: { title: 'Pembangunan Lingkungan', permission: 'projects.manage' },
      },
      {
        path: 'pembayaran',
        name: 'cms-payments',
        component: () => import('@/views/layanan/PaymentsView.vue'),
        meta: { title: 'Pembayaran Warga', permission: 'payments.manage' },
      },
      {
        path: 'pembayaran-saya',
        name: 'my-payments',
        component: () => import('@/views/layanan/PaymentsView.vue'),
        props: { mine: true },
        meta: { title: 'Pembayaran Saya' },
      },
      {
        path: 'surat',
        name: 'cms-letters',
        component: () => import('@/views/layanan/LettersView.vue'),
        meta: { title: 'Surat Keterangan', permission: ['letters.manage', 'letters.acc_sekretaris', 'letters.acc_bendahara', 'letters.acc_ketua'] },
      },
      {
        path: 'surat-saya',
        name: 'my-letters',
        component: () => import('@/views/layanan/LettersView.vue'),
        props: { mine: true },
        meta: { title: 'Surat Saya' },
      },
      {
        path: 'role',
        name: 'cms-roles',
        component: () => import('@/views/roles/RolesView.vue'),
        meta: { title: 'Role & Hak Akses', permission: 'roles.manage' },
      },
      {
        path: 'user',
        name: 'users',
        component: () => import('@/views/users/UsersView.vue'),
        meta: { title: 'Master User', permission: 'users.manage' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' };
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'dashboard' };
  if (!to.matched.some((r) => r.meta.requiresAuth)) return true;
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };

  if (!auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      auth.logout();
      return { name: 'login' };
    }
  }
  if (to.meta.permission && !auth.can(...[].concat(to.meta.permission))) return { name: 'dashboard' };
  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.title ? to.meta.title + ' · ' : ''}Warga Harmoni RT 04 / RW 08`;
});

export default router;
