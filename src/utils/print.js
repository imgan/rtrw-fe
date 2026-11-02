export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; color: #000; font-size: 12pt; margin: 0; line-height: 1.5; }
  h1 { font-size: 14pt; margin: 0; text-align: center; }
  .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 18px; }
  .kop p { margin: 0; font-size: 10.5pt; }
  table.data { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-top: 12px; }
  table.data th, table.data td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  table.data th { background: #eee; }
  .right { text-align: right; }
  .center { text-align: center; }
  .nowrap { white-space: nowrap; }
  @page { margin: 2cm; }
`;

/** Kop surat dari profil RT/RW (settings.site). */
export const kopHtml = (site) => `
  <div class="kop">
    <h1>${escapeHtml(site.nama)}</h1>
    <p>${escapeHtml(site.wilayah)}</p>
    <p>${escapeHtml(site.alamat)} · Telp. ${escapeHtml(site.telepon)}</p>
  </div>`;

/** Cetak HTML lewat iframe tersembunyi, tanpa membawa tampilan aplikasi. */
export function printDocument(title, bodyHtml, extraStyle = '') {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${BASE_STYLE}${extraStyle}</style></head><body>${bodyHtml}</body></html>`);
  doc.close();
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => frame.remove(), 1000);
}

/** Ambil semua halaman data agar yang dicetak tidak terpotong oleh paginasi tampilan. */
export async function fetchAllPages(listFn, filters) {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await listFn({ ...filters, page, limit: 100 });
    rows.push(...res.data);
    totalPages = res.meta.total_pages;
    page++;
  } while (page <= totalPages);
  return rows;
}
