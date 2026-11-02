const rupiah = new Intl.NumberFormat('id-ID');

export const formatRupiah = (n) => `Rp ${rupiah.format(Math.abs(Number(n) || 0))}`;
export const formatNumber = (n) => rupiah.format(Number(n) || 0);

// Tanggal dari API berformat 'YYYY-MM-DD'; diparse lokal agar tidak bergeser zona waktu.
function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function formatDate(value, style = 'long') {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('id-ID', style === 'short'
    ? { day: '2-digit', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatMonth(yyyyMm) {
  const d = parseDate(`${yyyyMm}-01`);
  return d ? d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '—';
}

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function sebut(n) {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) return `${SATUAN[Math.floor(n / 10)]} puluh ${SATUAN[n % 10]}`;
  if (n < 200) return `seratus ${sebut(n - 100)}`;
  if (n < 1000) return `${SATUAN[Math.floor(n / 100)]} ratus ${sebut(n % 100)}`;
  if (n < 2000) return `seribu ${sebut(n - 1000)}`;
  if (n < 1e6) return `${sebut(Math.floor(n / 1000))} ribu ${sebut(n % 1000)}`;
  if (n < 1e9) return `${sebut(Math.floor(n / 1e6))} juta ${sebut(n % 1e6)}`;
  if (n < 1e12) return `${sebut(Math.floor(n / 1e9))} miliar ${sebut(n % 1e9)}`;
  return `${sebut(Math.floor(n / 1e12))} triliun ${sebut(n % 1e12)}`;
}

/** 50000 → "Lima puluh ribu rupiah" */
export function terbilang(n) {
  const text = sebut(Math.abs(Math.trunc(Number(n) || 0))).replace(/\s+/g, ' ').trim() || 'nol';
  return `${text[0].toUpperCase()}${text.slice(1)} rupiah`;
}

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
