import type { WorkSheet } from 'xlsx';

export const LEAD_FIELDS = ['phone', 'name', 'location', 'loan_type', 'requirement', 'estimated_amount', 'eligibility'] as const;
export type LeadField = typeof LEAD_FIELDS[number];
export type LeadInput = { phone: string; name: string; location: string; loan_type: string; requirement: string; estimated_amount: number | null; eligibility: string; extra_details: Record<string, string> };
export function phoneKey(value: unknown) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}
export function sheetGrid(sheet: WorkSheet, decode: (address: string) => { s: { r: number; c: number }; e: { r: number; c: number } }) {
  const range = decode(sheet['!ref'] ?? 'A1');
  // Sparse cell iteration avoids a million formatted-but-empty rows in uploaded files.
  const rows = new Map<number, unknown[]>();
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith('!') || !cell || cell.v == null) continue;
    const pos = decode(address).s;
    const row = rows.get(pos.r) ?? [];
    row[pos.c] = cell;
    rows.set(pos.r, row);
  }
  let last = 0;
  for (const r of rows.keys()) last = Math.max(last, r);
  if (last > 1_100_000 || range.e.c > 200) throw new Error('Worksheet exceeds the supported range.');
  return Array.from({ length: last + 1 }, (_, r) => rows.get(r) ?? []);
}
export function reviewLeads(grid: unknown[][], mapping: Partial<Record<LeadField, number>>, firstRow: number, headers: boolean) {
  const start = firstRow - 1;
  const head = grid[start] ?? [];
  const text = (cell: unknown) => {
    if (cell && typeof cell === 'object' && 'v' in cell) {
      const c = cell as { v: unknown; w?: string };
      return String(c.w ?? c.v ?? '').trim();
    }
    return String(cell ?? '').trim();
  };
  const seen = new Set<string>();
  const valid: { record: number; lead: LeadInput }[] = [];
  const errors: { record: number; error: string }[] = [];
  let duplicates = 0;
  let total = 0;
  for (let i = start + (headers ? 1 : 0); i < grid.length; i++) {
    const row = grid[i] ?? [];
    if (!row.some(c => text(c))) continue;
    total++;
    const field = (key: LeadField) => mapping[key] == null ? '' : text(row[mapping[key]]);
    const phone = phoneKey(field('phone'));
    if (mapping.phone == null || !/^\d{10,15}$/.test(phone)) { errors.push({ record: i + 1, error: 'Valid phone number required' }); continue; }
    const amountCell = mapping.estimated_amount == null ? null : row[mapping.estimated_amount];
    const amountRaw = amountCell && typeof amountCell === 'object' && 'v' in amountCell ? amountCell.v : amountCell;
    const amount = amountRaw == null || amountRaw === '' ? null : Number(String(amountRaw).replace(/[,₹\s]/g, ''));
    if (amount != null && (!Number.isFinite(amount) || amount < 0)) { errors.push({ record: i + 1, error: 'Invalid loan amount' }); continue; }
    if (seen.has(phone)) { duplicates++; continue; }
    seen.add(phone);
    const extra: Record<string, string> = {};
    row.forEach((cell, column) => { if (!Object.values(mapping).includes(column) && text(cell)) extra[`${column + 1}: ${headers ? text(head[column]) : 'Column'}`] = text(cell); });
    valid.push({ record: i + 1, lead: { phone, name: field('name') || 'Loan enquiry', location: field('location'), loan_type: field('loan_type'), requirement: field('requirement'), eligibility: field('eligibility'), estimated_amount: amount, extra_details: extra } });
  }
  return { total, valid, errors, duplicates };
}