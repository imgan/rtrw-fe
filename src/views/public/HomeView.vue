<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ArrowDown, ArrowRight, ArrowUp, BookOpen, Building2, CalendarDays, ChevronRight, CircleCheck, Clock, Download,
  FileText, House, Images, Landmark, Megaphone, MapPin, Menu, MessageSquare, Phone, Shield, ShieldAlert, ShieldCheck,
  UserRound, UserCog, Users, Wallet, Wifi, X,
} from '@lucide/vue';
import PhotoLightbox from '@/components/PhotoLightbox.vue';
import api, { errorMessage } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { formatDate, formatMonth, formatNumber, formatRupiah, today } from '@/utils/format';

const auth = useAuthStore();
const home = ref(null);
const error = ref('');
const navOpen = ref(false);
const gallery = ref(null);
const conditions = { baik: { label: 'Kondisi Baik', cls: 'chip--green' }, perbaikan: { label: 'Dalam Perbaikan', cls: 'chip--amber' }, rusak: { label: 'Rusak', cls: 'chip--red' } };

const s = computed(() => home.value?.settings);
const kas = computed(() => home.value?.kas);

const nav = [
  { label: 'Beranda', hash: '#top' },
  { label: 'Profil', hash: '#profil' },
  { label: 'Layanan', hash: '#layanan' },
  { label: 'Pengumuman', hash: '#pengumuman' },
  { label: 'Kegiatan', hash: '#kegiatan' },
  { label: 'Kas', hash: '#kas' },
  { label: 'Fasilitas', hash: '#fasilitas' },
  { label: 'Kontak', hash: '#kontak' },
];

const services = [
  { icon: FileText, title: 'Pengajuan Surat', cta: 'Ajukan Sekarang', to: '/cms/surat-saya', featured: true,
    desc: 'Surat Pengantar KTP, Kartu Keluarga, Domisili Usaha, dan Keterangan Tidak Mampu (SKTM) langsung diparaf digital Ketua RT.' },
  { icon: Megaphone, title: 'Lapor & Aspirasi', cta: 'Kirimkan Aspirasi', to: '/login',
    desc: 'Aduan lampu jalan padam, saluran mampet, atau usulan kegiatan kerja bakti dapat disampaikan langsung secara transparan.' },
  { icon: Wallet, title: 'Laporan Kas Warga', cta: 'Lihat Buku Kas', to: '#kas',
    desc: 'Pantau rekapitulasi pemasukan iuran sampah & keamanan per gang serta realisasi belanja operasional lingkungan secara terbuka.' },
  { icon: CalendarDays, title: 'Agenda Kegiatan', cta: 'Lihat Kegiatan', to: '#kegiatan',
    desc: 'Jadwal Posyandu Balita & Lansia, pengajian bulanan warga, senam sehat bugar, hingga gotong royong saluran air RT.' },
];

const toneIcon = { green: CircleCheck, blue: ShieldCheck, red: ShieldAlert, amber: Megaphone };

function contactHref(c) {
  if (!c.telepon) return null;
  const digits = c.telepon.replace(/\D/g, '');
  return c.aksi === 'whatsapp' ? `https://wa.me/${digits.replace(/^0/, '62')}` : `tel:${digits}`;
}

const initial = (name) => (name || '?').trim()[0].toUpperCase();

function printKas() {
  document.body.classList.add('print-kas');
  window.print();
  document.body.classList.remove('print-kas');
}

onMounted(async () => {
  try {
    const { data } = await api.get('/public/home');
    home.value = data.data;
  } catch (err) {
    error.value = errorMessage(err);
  }
});
</script>

<template>
  <div id="top" class="site">
    <!-- Header -->
    <header class="site-header">
      <div class="container header-inner">
        <RouterLink to="/" class="brand">
          <span class="brand__logo"><ShieldCheck :size="20" /></span>
          <span>
            <strong>{{ s?.site.nama || 'RT 04 / RW 08 Sukamaju' }}</strong>
            <small>{{ s?.site.wilayah }}</small>
          </span>
        </RouterLink>

        <nav class="nav" :class="{ 'nav--open': navOpen }">
          <a v-for="(n, i) in nav" :key="n.hash" :href="n.hash" :class="{ active: i === 0 }" @click="navOpen = false">
            {{ n.label }}
          </a>
        </nav>

        <RouterLink :to="auth.isAuthenticated ? '/cms' : '/login'" class="btn btn--primary header-cta">
          <UserCog :size="18" /> Portal Pengurus RT
        </RouterLink>
        <button class="nav-toggle" aria-label="Menu" @click="navOpen = !navOpen">
          <X v-if="navOpen" :size="22" /><Menu v-else :size="22" />
        </button>
      </div>
    </header>

    <div v-if="error" class="container state">
      <ShieldAlert :size="28" />
      <p>Gagal memuat beranda: {{ error }}</p>
    </div>
    <div v-else-if="!home" class="container state"><span class="loader" /> Memuat informasi warga…</div>

    <main v-else>
      <!-- Hero -->
      <section id="profil" class="container hero">
        <div class="card hero__main">
          <span class="pill"><span class="dot" /> {{ s.hero.badge }}</span>
          <h1>{{ s.hero.judul }}</h1>
          <p class="hero__quote">“{{ s.hero.kutipan }}”</p>
          <div class="hero__leader">
            <span class="avatar"><UserRound :size="20" /></span>
            <div>
              <strong>{{ s.hero.nama_ketua }}</strong>
              <small>{{ s.hero.jabatan_ketua }}</small>
            </div>
          </div>
          <div class="hero__actions">
            <RouterLink to="/cms/surat-saya" class="btn btn--primary"><FileText :size="17" /> Buat Surat Pengantar</RouterLink>
            <a href="#kas" class="btn btn--ghost"><Wallet :size="17" /> Cek Saldo Kas</a>
          </div>
        </div>

        <aside class="card siaga">
          <div class="siaga__img">
            <img v-if="s.siaga.gambar" :src="s.siaga.gambar" alt="" />
            <span class="siaga__tag">{{ s.siaga.tag }}</span>
          </div>
          <div class="siaga__body">
            <span class="eyebrow eyebrow--amber">{{ s.siaga.label }}</span>
            <h3>{{ s.siaga.judul }}</h3>
            <p>{{ s.siaga.deskripsi }}</p>
          </div>
          <div class="siaga__foot">
            <span>{{ s.siaga.piket }}</span>
            <strong>{{ s.siaga.personel }}</strong>
          </div>
        </aside>
      </section>

      <!-- Statistik -->
      <section class="container stats">
        <div class="card stat">
          <div class="stat__head">Total Kepala Keluarga <span class="stat__icon"><House :size="16" /></span></div>
          <div class="stat__value">{{ formatNumber(s.statistik.total_kk) }} <small>Kepala Keluarga (KK)</small></div>
          <div class="stat__note stat__note--green"><CircleCheck :size="14" /> {{ s.statistik.catatan_kk }}</div>
        </div>
        <div class="card stat">
          <div class="stat__head">Jumlah Warga Penduduk <span class="stat__icon"><Users :size="16" /></span></div>
          <div class="stat__value">{{ formatNumber(s.statistik.total_warga) }} <small>Jiwa Terdaftar</small></div>
          <div class="stat__note">
            {{ s.statistik.laki_laki }} Laki-laki • {{ s.statistik.perempuan }} Perempuan
          </div>
        </div>
        <div class="card stat">
          <div class="stat__head">Saldo Kas RT Terbuka <span class="stat__icon"><Wallet :size="16" /></span></div>
          <div class="stat__value stat__value--green">{{ formatRupiah(kas.saldo) }}</div>
          <div class="stat__note"><CircleCheck :size="14" /> Audit Terakhir: {{ formatDate(s.kas.audit_terakhir) }}</div>
        </div>
        <div class="card stat">
          <div class="stat__head">Status Keamanan Wilayah <span class="stat__icon"><Shield :size="16" /></span></div>
          <div class="stat__value">{{ s.statistik.keamanan }} <small>{{ s.statistik.keamanan_sub }}</small></div>
          <div class="stat__note stat__note--green"><Wifi :size="14" /> {{ s.statistik.keamanan_catatan }}</div>
        </div>
      </section>

      <!-- Layanan -->
      <section id="layanan" class="container section">
        <div class="section__head">
          <div>
            <span class="eyebrow">Layanan Mandiri</span>
            <h2>Layanan Administrasi &amp; Keperluan Warga</h2>
            <p>Urus dokumen kependudukan, laporkan masalah fasilitas, dan cek kas tanpa perlu menunggu jam kerja tatap muka.</p>
          </div>
          <a href="#kontak" class="link">Buku Panduan Layanan Warga <ArrowRight :size="15" /></a>
        </div>
        <div class="services">
          <article v-for="sv in services" :key="sv.title" class="card service">
            <span class="service__icon" :class="{ 'service__icon--solid': sv.featured }">
              <component :is="sv.icon" :size="20" />
            </span>
            <h3>{{ sv.title }}</h3>
            <p>{{ sv.desc }}</p>
            <component
              :is="sv.to.startsWith('#') ? 'a' : RouterLink"
              v-bind="sv.to.startsWith('#') ? { href: sv.to } : { to: sv.to }"
              class="service__cta"
            >
              {{ sv.cta }} <ChevronRight :size="15" />
            </component>
          </article>
        </div>
      </section>

      <!-- Pengumuman -->
      <section id="pengumuman" class="container section">
        <div class="section__head">
          <div>
            <span class="eyebrow">Informasi Resmi</span>
            <h2>Warta Pengumuman &amp; Woro-Woro Lingkungan</h2>
          </div>
          <span class="muted-inline"><Clock :size="15" /> Diperbarui secara berkala</span>
        </div>
        <div v-if="home.announcements.length" class="news">
          <article v-for="a in home.announcements" :key="a.id" class="card news__item" :class="`tone-${a.warna}`">
            <div class="news__meta">
              <span class="chip">{{ a.kategori }}</span>
              <span>{{ formatDate(a.tanggal) }}</span>
            </div>
            <h3>{{ a.judul }}</h3>
            <p>{{ a.isi }}</p>
            <div class="news__foot">
              <span>{{ a.penanggung_jawab }}</span>
              <component :is="toneIcon[a.warna]" :size="16" />
            </div>
          </article>
        </div>
        <p v-else class="empty">Belum ada pengumuman terbaru.</p>
      </section>

      <!-- Kegiatan -->
      <section id="kegiatan" class="container section">
        <div class="section__head">
          <div>
            <span class="eyebrow">Agenda &amp; Dokumentasi</span>
            <h2>Kegiatan Warga</h2>
            <p>Agenda terdekat dan dokumentasi kegiatan bersama warga. Klik foto untuk melihat galeri.</p>
          </div>
        </div>
        <div v-if="home.activities.length" class="gallery">
          <article v-for="a in home.activities" :key="a.id" class="card tile">
            <component :is="a.fotos.length ? 'button' : 'div'" class="tile__media" :aria-label="a.fotos.length ? `Lihat foto ${a.judul}` : undefined" @click="a.fotos.length && (gallery = { photos: a.fotos, title: a.judul })">
              <img v-if="a.fotos.length" :src="a.fotos[0]" :alt="a.judul" loading="lazy" />
              <CalendarDays v-else :size="32" />
              <span v-if="a.tanggal >= today()" class="tile__flag">Akan Datang</span>
              <span v-if="a.fotos.length > 1" class="tile__count"><Images :size="13" /> {{ a.fotos.length }} foto</span>
            </component>
            <div class="tile__body">
              <span class="chip chip--green">{{ a.kategori }}</span>
              <h3>{{ a.judul }}</h3>
              <p>{{ a.deskripsi }}</p>
              <ul class="tile__meta">
                <li><CalendarDays :size="14" /> {{ formatDate(a.tanggal) }}<template v-if="a.waktu">, {{ a.waktu }}</template></li>
                <li v-if="a.lokasi"><MapPin :size="14" /> {{ a.lokasi }}</li>
              </ul>
            </div>
          </article>
        </div>
        <p v-else class="empty">Belum ada kegiatan warga.</p>
      </section>

      <!-- Kas -->
      <section id="kas" class="container section kas-section">
        <div class="section__head">
          <div>
            <span class="eyebrow">Keterbukaan Anggaran</span>
            <h2>Transparansi Keuangan Kas RT Bulan Berjalan</h2>
            <p>Setiap rupiah iuran warga dicatat secara terbuka dan dapat dipantau bersama oleh seluruh kepala keluarga.</p>
          </div>
          <button class="btn btn--ghost btn--sm no-print" @click="printKas"><Download :size="15" /> Unduh Laporan PDF</button>
        </div>

        <div class="kas-cards">
          <div class="card kas-card">
            <div>
              <small>Total Penerimaan ({{ formatMonth(kas.bulan) }})</small>
              <strong class="green">{{ formatRupiah(kas.pemasukan) }}</strong>
            </div>
            <span class="kas-card__icon kas-card__icon--green"><ArrowDown :size="18" /></span>
          </div>
          <div class="card kas-card">
            <div>
              <small>Total Pengeluaran ({{ formatMonth(kas.bulan) }})</small>
              <strong class="red">{{ formatRupiah(kas.pengeluaran) }}</strong>
            </div>
            <span class="kas-card__icon kas-card__icon--red"><ArrowUp :size="18" /></span>
          </div>
          <div class="card kas-card">
            <div>
              <small>Saldo Akhir di Rekening Kas</small>
              <strong class="green">{{ formatRupiah(kas.saldo) }}</strong>
            </div>
            <span class="kas-card__icon"><Landmark :size="18" /></span>
          </div>
        </div>

        <div class="card mutasi">
          <div class="mutasi__head">
            <strong>{{ kas.mutasi.length }} Mutasi Terakhir Kas Lingkungan</strong>
            <span>Status Bendahara: {{ s.kas.status_bendahara }}</span>
          </div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th><th>Uraian Transaksi</th><th>Kategori</th>
                  <th class="right">Debit / Kredit</th><th class="right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in kas.mutasi" :key="m.id">
                  <td class="nowrap">{{ formatDate(m.tanggal, 'short') }}</td>
                  <td>{{ m.uraian }}</td>
                  <td><span class="chip" :class="m.jenis === 'masuk' ? 'chip--green' : 'chip--blue'">{{ m.kategori }}</span></td>
                  <td class="right nowrap" :class="m.jenis === 'masuk' ? 'green' : 'red'">
                    {{ m.jenis === 'masuk' ? '+' : '–' }} {{ formatRupiah(m.nominal) }}
                  </td>
                  <td class="right nowrap">{{ formatRupiah(m.saldo) }}</td>
                </tr>
                <tr v-if="!kas.mutasi.length"><td colspan="5" class="empty">Belum ada transaksi kas.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Fasilitas -->
      <section id="fasilitas" class="container section">
        <div class="section__head">
          <div>
            <span class="eyebrow">Sarana Lingkungan</span>
            <h2>Fasilitas Umum</h2>
            <p>Sarana bersama warga beserta lokasi, jam buka, dan kondisinya saat ini.</p>
          </div>
        </div>
        <div v-if="home.facilities.length" class="gallery">
          <article v-for="f in home.facilities" :key="f.id" class="card tile">
            <component :is="f.fotos.length ? 'button' : 'div'" class="tile__media" :aria-label="f.fotos.length ? `Lihat foto ${f.nama}` : undefined" @click="f.fotos.length && (gallery = { photos: f.fotos, title: f.nama })">
              <img v-if="f.fotos.length" :src="f.fotos[0]" :alt="f.nama" loading="lazy" />
              <Building2 v-else :size="32" />
              <span v-if="f.fotos.length > 1" class="tile__count"><Images :size="13" /> {{ f.fotos.length }} foto</span>
            </component>
            <div class="tile__body">
              <div class="tile__chips">
                <span class="chip">{{ f.kategori }}</span>
                <span class="chip" :class="conditions[f.kondisi].cls">{{ conditions[f.kondisi].label }}</span>
              </div>
              <h3>{{ f.nama }}</h3>
              <p>{{ f.deskripsi }}</p>
              <ul class="tile__meta">
                <li v-if="f.lokasi"><MapPin :size="14" /> {{ f.lokasi }}</li>
                <li v-if="f.jam_operasional"><Clock :size="14" /> {{ f.jam_operasional }}</li>
              </ul>
            </div>
          </article>
        </div>
        <p v-else class="empty">Belum ada data fasilitas umum.</p>
      </section>

      <!-- Denah & kontak -->
      <section id="kontak" class="container section split">
        <div class="card wilayah">
          <span class="eyebrow">Denah &amp; Lokasi</span>
          <h3>{{ s.wilayah.judul }}</h3>
          <p>{{ s.wilayah.deskripsi }}</p>
          <div class="map">
            <img v-if="s.wilayah.gambar_denah" :src="s.wilayah.gambar_denah" alt="Denah wilayah RT" />
            <span v-if="s.wilayah.posko" class="map__label"><MapPin :size="14" /> Titik Posko Utama: <b>{{ s.wilayah.posko }}</b></span>
          </div>
          <div class="batas">
            <span>Batas Utara: {{ s.wilayah.batas_utara }}</span>
            <span>Batas Selatan: {{ s.wilayah.batas_selatan }}</span>
            <span>Batas Barat: {{ s.wilayah.batas_barat }}</span>
          </div>
        </div>

        <div class="card kontak">
          <span class="eyebrow">Siaga Cepat</span>
          <h3>Kontak Pengurus &amp; Darurat</h3>
          <p>{{ s.kontak.deskripsi }}</p>
          <div class="kontak__list">
            <a
              v-for="c in home.contacts"
              :key="c.id"
              class="kontak__item"
              :class="`kontak__item--${c.tone}`"
              :href="contactHref(c)"
              :target="c.aksi === 'whatsapp' ? '_blank' : undefined"
              rel="noopener"
            >
              <span class="kontak__avatar">
                <ShieldAlert v-if="c.tone === 'danger'" :size="16" />
                <template v-else>{{ initial(c.nama) }}</template>
              </span>
              <span class="kontak__text">
                <strong>{{ c.nama }}</strong>
                <small>{{ c.keterangan }}<template v-if="c.telepon"> ({{ c.telepon }})</template></small>
              </span>
              <MessageSquare v-if="c.aksi === 'whatsapp'" :size="17" />
              <Phone v-else :size="17" />
            </a>
          </div>
          <div class="darurat">{{ s.kontak.darurat }}</div>
        </div>
      </section>
    </main>

    <PhotoLightbox v-if="gallery" :photos="gallery.photos" :title="gallery.title" @close="gallery = null" />

    <!-- Footer -->
    <footer v-if="s" class="site-footer">
      <div class="container footer-grid">
        <div>
          <div class="brand brand--footer">
            <span class="brand__logo"><ShieldCheck :size="18" /></span>
            <strong>{{ s.site.nama }}</strong>
          </div>
          <p>{{ s.footer.deskripsi }}</p>
          <p class="footer__addr"><b>Alamat:</b> {{ s.site.alamat }}<br /><b>No. Telepon:</b> {{ s.site.telepon }}</p>
          <p class="footer__addr"><b>Sekretariat:</b> {{ s.footer.sekretariat }}</p>
        </div>
        <div>
          <h4>Layanan Digital</h4>
          <ul>
            <li><RouterLink to="/login">Pengantar SKCK &amp; KTP</RouterLink></li>
            <li><RouterLink to="/login">Surat Keterangan Domisili</RouterLink></li>
            <li><RouterLink to="/login">Pengaduan Fasilitas Umum</RouterLink></li>
            <li><a href="#kas">Laporan Audit Kas Bulanan</a></li>
          </ul>
        </div>
        <div>
          <h4>Pelayanan Sekretariat</h4>
          <ul class="hours">
            <li><b>Senin – Jumat:</b> {{ s.footer.jam_senin_jumat }}</li>
            <li><b>Sabtu:</b> {{ s.footer.jam_sabtu }}</li>
            <li><b>Minggu &amp; Hari Libur:</b> {{ s.footer.jam_minggu }}</li>
          </ul>
          <p class="green footer__online"><BookOpen :size="14" /> Portal Warga Beroperasi Penuh 24/7</p>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© {{ new Date().getFullYear() }} Pengurus {{ s.site.nama }}. Hak Cipta Dilindungi.</span>
        <span class="footer-bottom__tags"><span>Inklusif &amp; Ramah Warga</span><span>• Birokrasi Bersih Melayani</span></span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site { background: #f7f9fb; min-height: 100vh; }
.container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 24px; }
.green { color: var(--primary); }
.red { color: var(--danger); }
.right { text-align: right; }
.nowrap { white-space: nowrap; }

/* Header */
.site-header { position: sticky; top: 0; z-index: 20; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
.header-inner { display: flex; align-items: center; gap: 24px; height: 72px; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--text); min-width: 0; }
.brand strong { display: block; color: var(--primary); font-size: 17px; letter-spacing: -0.01em; }
.brand small { display: block; color: var(--muted); font-size: 12px; max-width: 220px; line-height: 1.35; }
.brand__logo { width: 38px; height: 38px; border-radius: 9px; background: var(--primary); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
.nav { display: flex; gap: 4px; margin-left: auto; }
.nav a { padding: 8px 12px; white-space: nowrap; font-size: 14px; color: var(--muted); font-weight: 500; border-bottom: 2px solid transparent; }
.nav a:hover { color: var(--text); }
.nav a.active { color: var(--primary); border-bottom-color: var(--primary); }
.header-cta { height: 44px; }
.nav-toggle { display: none; color: var(--text); }

.state { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 50vh; color: var(--muted); flex-direction: column; }
.loader { width: 28px; height: 28px; border: 3px solid var(--primary-soft); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }

/* Hero */
.hero { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr); gap: 24px; margin-top: 28px; }
.hero__main { padding: 32px 36px; }
.pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 600; }
.pill .dot { width: 6px; height: 6px; }
.hero h1 { margin-top: 18px; font-size: 38px; line-height: 1.2; font-weight: 800; max-width: 680px; }
.hero__quote { margin-top: 16px; color: var(--muted); line-height: 1.7; max-width: 720px; padding-bottom: 22px; border-bottom: 1px solid var(--border); }
.hero__leader { display: flex; align-items: center; gap: 12px; margin-top: 18px; }
.hero__leader strong { display: block; font-size: 15px; }
.hero__leader small { color: var(--muted); font-size: 13px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--surface-muted); color: var(--primary); display: grid; place-items: center; border: 1px solid var(--border); }
.hero__actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
.hero__actions .btn--ghost { border: 1.5px solid var(--primary); color: var(--primary); }

.siaga { overflow: hidden; display: flex; flex-direction: column; }
.siaga__img { position: relative; height: 170px; background: linear-gradient(135deg, #2f7d4f, #0f3d2e); }
.siaga__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.siaga__tag { position: absolute; top: 10px; right: 10px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
.siaga__body { padding: 18px 20px 10px; flex: 1; }
.siaga__body h3 { font-size: 17px; margin-top: 6px; }
.siaga__body p { margin-top: 8px; color: var(--muted); font-size: 13.5px; line-height: 1.6; }
.siaga__foot { margin: 8px 20px 20px; padding: 12px 14px; border-radius: 10px; background: var(--surface-muted); display: flex; justify-content: space-between; font-size: 13px; }
.siaga__foot strong { color: var(--primary); }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
.stat { padding: 20px; }
.stat__head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--muted); }
.stat__icon { width: 30px; height: 30px; border-radius: 8px; background: var(--surface-muted); color: var(--primary); display: grid; place-items: center; }
.stat__value { margin-top: 12px; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.stat__value small { font-size: 13px; font-weight: 500; color: var(--muted); letter-spacing: 0; }
.stat__value--green { color: var(--primary); }
.stat__note { margin-top: 6px; font-size: 12.5px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.stat__note--green { color: var(--primary); }

/* Sections */
.section { margin-top: 64px; scroll-margin-top: 88px; }
.section__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
.section__head h2 { font-size: 28px; font-weight: 700; margin-top: 4px; }
.section__head p { color: var(--muted); margin-top: 6px; font-size: 14.5px; }
.eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); }
.eyebrow--amber { color: var(--warning); }
.link { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-weight: 600; font-size: 14px; }
.muted-inline { display: inline-flex; gap: 6px; align-items: center; color: var(--muted); font-size: 13px; }
.empty { text-align: center; color: var(--muted); padding: 28px; }

.services { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.service { padding: 24px; display: flex; flex-direction: column; }
.service__icon { width: 44px; height: 44px; border-radius: 10px; background: var(--surface-muted); color: var(--primary); display: grid; place-items: center; }
.service__icon--solid { background: var(--primary); color: #fff; }
.service h3 { font-size: 16px; margin-top: 18px; }
.service p { margin-top: 8px; color: var(--muted); font-size: 13.5px; line-height: 1.6; flex: 1; }
.service__cta { margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 9px; border-radius: 8px; background: var(--surface-muted); color: var(--primary); font-weight: 600; font-size: 13.5px; }
.service__cta:hover { background: var(--primary-soft); }

/* News */
.news { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.news__item { padding: 22px; border-left: 4px solid var(--tone); display: flex; flex-direction: column; --tone: var(--primary); --tone-soft: var(--primary-soft); }
.tone-blue { --tone: var(--link); --tone-soft: #e8effd; }
.tone-red { --tone: var(--danger); --tone-soft: var(--danger-soft); }
.tone-amber { --tone: var(--warning); --tone-soft: var(--warning-soft); }
.news__meta { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; }
.news__item .chip { background: var(--tone-soft); color: var(--tone); }
.news__item h3 { font-size: 16.5px; margin-top: 14px; line-height: 1.4; }
.news__item p { margin-top: 10px; color: var(--muted); font-size: 13.5px; line-height: 1.6; flex: 1; }
.news__foot { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--muted); }
.news__foot svg { color: var(--tone); }

.chip { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background: var(--surface-muted); white-space: nowrap; }
.chip--green { background: var(--primary-soft); color: var(--primary); }
.chip--blue { background: #e8effd; color: #1e3a8a; }
.chip--amber { background: var(--warning-soft); color: var(--warning); }
.chip--red { background: var(--danger-soft); color: var(--danger); }

/* Kegiatan & fasilitas */
.gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.tile { overflow: hidden; display: flex; flex-direction: column; }
.tile__media { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 10; background: var(--surface-muted); color: var(--subtle); overflow: hidden; }
.tile__media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.25s; }
button.tile__media:hover img { transform: scale(1.04); }
.tile__flag { position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 6px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; }
.tile__count { position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 6px; background: rgba(15, 23, 42, 0.75); color: #fff; font-size: 12px; font-weight: 600; }
.tile__body { padding: 18px 20px 20px; display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
.tile__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.tile__body h3 { font-size: 16.5px; margin-top: 12px; line-height: 1.4; }
.tile__body p { margin-top: 8px; color: var(--muted); font-size: 13.5px; line-height: 1.6; flex: 1; }
.tile__meta { list-style: none; padding: 12px 0 0; margin: 14px 0 0; width: 100%; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); }
.tile__meta li { display: flex; gap: 7px; align-items: flex-start; }
.tile__meta svg { flex-shrink: 0; margin-top: 2px; color: var(--primary); }

/* Kas */
.kas-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.kas-card { padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; }
.kas-card small { color: var(--muted); font-size: 13px; }
.kas-card strong { display: block; margin-top: 6px; font-size: 22px; font-weight: 700; }
.kas-card__icon { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-muted); color: var(--text); }
.kas-card__icon--green { background: var(--primary-soft); color: var(--primary); }
.kas-card__icon--red { background: var(--danger-soft); color: var(--danger); }
.mutasi { margin-top: 20px; overflow: hidden; }
.mutasi__head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 18px 22px; font-size: 14px; }
.mutasi__head span { color: var(--muted); font-size: 13px; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th { text-align: left; padding: 11px 22px; background: var(--surface-muted); color: var(--muted); font-weight: 600; font-size: 12.5px; white-space: nowrap; }
td { padding: 15px 22px; border-top: 1px solid var(--border); }

/* Denah & kontak */
.split { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px; }
.wilayah, .kontak { padding: 26px; }
.wilayah h3, .kontak h3 { font-size: 20px; margin-top: 6px; }
.wilayah > p, .kontak > p { margin-top: 8px; color: var(--muted); font-size: 14px; line-height: 1.6; }
.map { position: relative; margin-top: 18px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); background: #eef2ee; min-height: 160px; }
.map img { width: 100%; display: block; }
.map__label { position: absolute; left: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 6px; background: #fff; box-shadow: var(--shadow); font-size: 12.5px; color: var(--primary); }
.map__label b { color: var(--text); font-weight: 600; }
.batas { display: flex; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 12.5px; color: var(--muted); }

.kontak__list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
.kontak__item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-muted); color: var(--primary); transition: border-color 0.15s; }
.kontak__item:hover { border-color: var(--primary); }
.kontak__avatar { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; background: #fff; color: var(--text); border: 1px solid var(--border); flex-shrink: 0; }
.kontak__item--primary .kontak__avatar { background: var(--primary); color: #fff; border: 0; }
.kontak__item--danger { background: var(--danger-soft); border-color: #f6caca; color: var(--danger); }
.kontak__item--danger .kontak__avatar { background: var(--danger); color: #fff; border: 0; }
.kontak__text { flex: 1; min-width: 0; }
.kontak__text strong { display: block; color: var(--text); font-size: 14.5px; }
.kontak__text small { color: var(--muted); font-size: 12.5px; }
.kontak__item--danger .kontak__text small { color: var(--danger); }
.darurat { margin-top: 18px; padding: 12px; text-align: center; border: 1px solid var(--border); border-radius: 10px; font-size: 13px; font-weight: 600; }

/* Footer */
.site-footer { margin-top: 72px; background: #fff; border-top: 1px solid var(--border); padding-top: 40px; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
.footer-grid p { color: var(--muted); font-size: 13.5px; line-height: 1.65; margin-top: 12px; max-width: 460px; }
.footer__addr b { color: var(--text); }
.brand--footer strong { font-size: 17px; }
.site-footer h4 { font-size: 14px; }
.site-footer ul { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; }
.site-footer ul a { color: var(--muted); }
.site-footer ul a:hover { color: var(--primary); }
.hours li { color: var(--muted); }
.hours b { color: var(--text); font-weight: 600; }
.footer__online { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 32px; padding-top: 18px; padding-bottom: 22px; border-top: 1px solid var(--border); font-size: 12.5px; color: var(--muted); }
.footer-bottom__tags { display: flex; gap: 12px; color: var(--text); font-weight: 500; }

/* Responsive */
@media (max-width: 1100px) {
  .nav { display: none; }
  .nav--open { display: flex; flex-direction: column; position: absolute; top: 72px; left: 0; right: 0; background: #fff; padding: 12px 24px; border-bottom: 1px solid var(--border); box-shadow: var(--shadow-lg); }
  .nav-toggle { display: flex; margin-left: auto; }
  .header-cta { margin-left: auto; }
  .nav-toggle { margin-left: 0; }
  .stats, .services, .gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .hero, .split, .news, .kas-cards, .footer-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .container { padding: 0 16px; }
  .header-cta { display: none; }
  .nav-toggle { margin-left: auto; }
  .brand small { display: none; }
  .hero__main { padding: 24px 20px; }
  .hero h1 { font-size: 28px; }
  .section__head h2 { font-size: 22px; }
  .stats, .services, .gallery { grid-template-columns: 1fr; }
}
</style>

<style>
/* Cetak hanya bagian kas saat tombol "Unduh Laporan PDF" ditekan. */
@media print {
  body.print-kas .site-header,
  body.print-kas .site-footer,
  body.print-kas main > section:not(#kas),
  body.print-kas .no-print { display: none !important; }
  body.print-kas .section { margin-top: 0; }
}
</style>
