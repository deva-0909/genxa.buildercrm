// Formatting, export and messaging helpers shared by every screen.
import { localDate } from './dataStore';

const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹12,34,567 */
export const inr = (n: number | undefined | null) => `₹${inrFmt.format(Math.round(Number(n) || 0))}`;

/** ₹1.25 Cr / ₹45.6 L / ₹12,000 */
export function inrShort(n: number | undefined | null): string {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 16 Oct 2026 */
export function fmtDate(s?: string | null): string {
  if (!s) return '—';
  const d = s.length === 10 ? new Date(`${s}T00:00:00`) : new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 16 Oct, 3:45 pm */
export function fmtDateTime(s?: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

export const today = () => localDate();

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a.length === 10 ? `${a}T00:00:00` : a);
  const db = new Date(b.length === 10 ? `${b}T00:00:00` : b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** The last n calendar months as { key: '2026-10', label: 'Oct' }, oldest first. */
export function lastMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, label: `${MONTHS[m.getMonth()]}${m.getMonth() === 0 ? ` ${String(m.getFullYear()).slice(2)}` : ''}` });
  }
  return out;
}

/** '2026-10' month key for a date or timestamp string (local time). */
export function monthKey(s?: string | null): string {
  if (!s) return '';
  if (s.length === 10) return s.slice(0, 7);
  return localDate(new Date(s)).slice(0, 7);
}

// ---------------- validation ----------------

export const digitsOnly = (s: string) => (s || '').replace(/\D/g, '');

/** Indian mobile: 10 digits starting 6-9 (a leading 0 or +91 is ignored). */
export function normaliseMobile(s: string): string {
  const d = digitsOnly(s);
  return d.length > 10 ? d.slice(-10) : d;
}
export const isValidMobile = (s: string) => /^[6-9]\d{9}$/.test(normaliseMobile(s));
export const isValidEmail = (s: string) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

// ---------------- contact links ----------------

export function waLink(mobile: string, text = ''): string {
  const d = normaliseMobile(mobile);
  return `https://wa.me/91${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const telLink = (mobile: string) => `tel:+91${normaliseMobile(mobile)}`;

// ---------------- CSV export ----------------

export function toCSV(rows: Record<string, any>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([type.startsWith('text/csv') ? '﻿' + text : text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCSV(filename: string, rows: Record<string, any>[], columns?: string[]) {
  downloadText(filename, toCSV(rows, columns));
}

/** Parse CSV text (handles quoted values) into objects keyed by the header row. */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === '\t') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// ---------------- printable documents (Save as PDF) ----------------

/** Amount in words, Indian system (for receipts and letters). */
export function amountInWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`;
  const three = (x: number) => x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ' ' + two(x % 100) : ''}` : two(x);
  let v = Math.round(Math.abs(n));
  if (v === 0) return 'Zero Rupees Only';
  const parts: string[] = [];
  const cr = Math.floor(v / 1e7); v %= 1e7;
  const lk = Math.floor(v / 1e5); v %= 1e5;
  const th = Math.floor(v / 1e3); v %= 1e3;
  if (cr) parts.push(`${three(cr)} Crore`);
  if (lk) parts.push(`${two(lk)} Lakh`);
  if (th) parts.push(`${two(th)} Thousand`);
  if (v) parts.push(three(v));
  return `${parts.join(' ')} Rupees Only`;
}

const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export { esc as escapeHtml };

/**
 * Open a printable document in a new tab. The browser's print dialog can
 * save it as a PDF. `body` is trusted HTML built by the caller with escapeHtml.
 */
export function printDocument(title: string, body: string, company = 'GENXA Developers') {
  const w = window.open('', '_blank');
  if (!w) { alert('Allow pop-ups for this site to open the document.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:0;padding:32px 40px;font-size:13px;line-height:1.55}
  header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1e3a8a;padding-bottom:10px;margin-bottom:18px}
  header .co{font-size:20px;font-weight:bold;color:#1e3a8a;font-family:Helvetica,Arial,sans-serif} header .meta{text-align:right;font-size:11px;color:#555;font-family:Helvetica,Arial,sans-serif}
  h1{font-size:17px;text-align:center;letter-spacing:.06em;text-transform:uppercase;margin:6px 0 16px}
  h2{font-size:14px;margin:18px 0 6px;font-family:Helvetica,Arial,sans-serif}
  table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:12px}
  th,td{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top} th{background:#eef2ff}
  td.r,th.r{text-align:right} .muted{color:#666} .box{border:1px solid #bbb;padding:10px 12px;margin:10px 0}
  .sig{display:flex;justify-content:space-between;margin-top:56px} .sig div{width:40%;border-top:1px solid #333;padding-top:6px;text-align:center}
  .sig img{max-height:60px;display:block;margin:0 auto 4px}
  .toolbar{position:fixed;top:10px;right:10px;font-family:Helvetica,Arial,sans-serif} .toolbar button{padding:8px 14px;background:#1e3a8a;color:#fff;border:0;border-radius:6px;cursor:pointer}
  @media print{.toolbar{display:none} body{padding:0 8px}}
</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<header><div class="co">${esc(company)}</div><div class="meta">Generated ${esc(fmtDateTime(new Date().toISOString()))}</div></header>
${body}
</body></html>`);
  w.document.close();
}
