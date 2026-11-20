import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkBook } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LEAD_FIELDS, reviewLeads, sheetGrid, type LeadField } from '@/lib/loan-import';

export function LoanImportPanel() {
  const qc = useQueryClient();
  const [book, setBook] = useState<WorkBook | null>(null);
  const [filename, setFilename] = useState('');
  const [sheet, setSheet] = useState('');
  const [grid, setGrid] = useState<unknown[][]>([]);
  const [firstRow, setFirstRow] = useState(1);
  const [headers, setHeaders] = useState(true);
  const [mapping, setMapping] = useState<Partial<Record<LeadField, number>>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [run, setRun] = useState<{ ids: string[]; next: number; imported: number; duplicates: number; invalid: number } | null>(null);
  const inventory = useQuery({ queryKey: ['loan-inventory'], queryFn: async () => { const r = await supabase.rpc('admin_loan_inventory'); if (r.error) throw r.error; return r.data as Record<string, number>; } });
  const history = useQuery({ queryKey: ['admin-lead-history'], queryFn: async () => {
    const r = await supabase.from('lead_allocations').select('id,user_id,allocated_at,leads(lead_code,name,loan_type)').order('allocated_at', { ascending: false }).limit(100);
    if (r.error) throw r.error; return r.data;
  } });
  const imports = useQuery({ queryKey: ['loan-imports'], queryFn: async () => { const r = await supabase.from('lead_import_batches').select('*').order('created_at', { ascending: false }).limit(10); if (r.error) throw r.error; return r.data; } });
  const preview = useMemo(() => reviewLeads(grid, mapping, firstRow, headers), [grid, mapping, firstRow, headers]);
  async function chooseSheet(workbook: WorkBook, name: string) {
    const xlsx = await import('xlsx');
    const worksheet = workbook.Sheets[name]; if (!worksheet) return;
    const next = sheetGrid(worksheet, xlsx.utils.decode_range);
    setGrid(next); setSheet(name); setFirstRow(1); setRun(null);
    const first = next[0] ?? [];
    const cellText = (c: unknown) => String(c && typeof c === 'object' && 'v' in c ? c.v : '').toLowerCase();
    const aliases: Record<LeadField, RegExp> = { phone: /phone|mobile|contact.*no/, name: /name|customer/, location: /location|city|district|address/, loan_type: /loan.*type|category/, requirement: /requirement|enquiry/, estimated_amount: /amount|estimate/, eligibility: /eligibility/ };
    const m: Partial<Record<LeadField, number>> = {};
    LEAD_FIELDS.forEach(field => { const i = first.findIndex(c => aliases[field].test(cellText(c))); if (i >= 0) m[field] = i; });
    const hasHeader = m.phone != null;
    if (!hasHeader) m.phone = 0;
    setHeaders(hasHeader); setMapping(m);
  }
  async function load(file: File) {
    if (file.size > 60 * 1024 * 1024) { toast.error('Upload an Excel file smaller than 60 MB.'); return; }
    setBusy(true); setProgress('Reading workbook…');
    try { const xlsx = await import('xlsx'); const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array', cellDates: false, dense: false }); setBook(workbook); setFilename(file.name); await chooseSheet(workbook, workbook.SheetNames[0] ?? ''); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to read workbook'); }
    finally { setBusy(false); setProgress(''); }
  }
  async function confirm() {
    setBusy(true);
    const state = run ?? { ids: Array.from({ length: Math.ceil(preview.valid.length / 500) }, () => crypto.randomUUID()), next: 0, imported: 0, duplicates: 0, invalid: 0 };
    try {
      for (let b = state.next; b < state.ids.length; b++) {
        setProgress(`Importing ${Math.min((b + 1) * 500, preview.valid.length)} / ${preview.valid.length}`);
        const rows = preview.valid.slice(b * 500, (b + 1) * 500).map(r => r.lead);
        const r = await supabase.rpc('import_loan_leads', { _batch_id: state.ids[b] ?? '', _filename: `${filename} · ${sheet}`, _offset: b * 500, _rows: rows });
        if (r.error) throw r.error;
        const result = r.data as Record<string, number>;
        state.imported += result.imported ?? 0; state.duplicates += result.duplicates ?? 0; state.invalid += result.invalid ?? 0; state.next = b + 1;
        setRun({ ...state });
      }
      setProgress(`Saved ${state.imported} · Duplicates ${state.duplicates + preview.duplicates} · Invalid ${state.invalid + preview.errors.length}`);
      toast.success(`${state.imported} leads saved.`); qc.invalidateQueries();
    } catch (e) { setRun({ ...state }); toast.error(e instanceof Error ? e.message : 'Import interrupted. Retry to continue.'); }
    finally { setBusy(false); }
  }
  const columns = Math.max(1, ...grid.slice(0, 20).map(r => r.length));
  return <div className="space-y-6 py-4">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[['Total unique leads', 'total'], ['Available for rotation', 'available'], ['Fresh leads', 'fresh'], ['Lifetime allocations', 'distributed']].map(([title, key]) => <div key={key} className="rounded-lg border border-primary/10 bg-card p-4"><p className="text-sm text-foreground/80">{title}</p><p className="mt-2 text-2xl font-bold text-primary">{inventory.data?.[key ?? ''] ?? '—'}</p></div>)}</div>
    {inventory.error && <p role="alert" className="text-destructive">{inventory.error.message}</p>}
    <h2 className="text-xl font-semibold text-primary">Upload loan leads</h2>
    <Input aria-label="Excel lead file" type="file" accept=".xlsx,.xls" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (f) void load(f); }} />
    {book && <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label>Worksheet</Label><Select value={sheet} disabled={busy || !!run} onValueChange={v => void chooseSheet(book, v)}><SelectTrigger aria-label="Worksheet"><SelectValue /></SelectTrigger><SelectContent>{book.SheetNames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="first-row">First row</Label><Input id="first-row" type="number" min={1} max={grid.length} value={firstRow} disabled={busy || !!run} onChange={e => setFirstRow(Math.max(1, Number(e.target.value)))} /></div>
        <Label className="flex items-center gap-2"><Checkbox checked={headers} disabled={busy || !!run} onCheckedChange={v => setHeaders(v === true)} />First row contains headings</Label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{LEAD_FIELDS.map(field => <div key={field}><Label className="capitalize">{field.replaceAll('_', ' ')}{field === 'phone' ? ' *' : ''}</Label><Select disabled={busy || !!run} value={mapping[field] == null ? 'none' : String(mapping[field])} onValueChange={v => setMapping(m => ({ ...m, [field]: v === 'none' ? undefined : Number(v) }))}><SelectTrigger aria-label={`Map ${field}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not mapped</SelectItem>{Array.from({ length: columns }, (_, i) => { const c = grid[firstRow - 1]?.[i]; const value = c && typeof c === 'object' && 'v' in c ? c.v : ''; return <SelectItem key={i} value={String(i)}>Column {i + 1}{headers && value ? ` · ${String(value)}` : ''}</SelectItem>; })}</SelectContent></Select></div>)}</div>
      <p className="font-medium text-primary">{preview.total} records · {preview.valid.length} valid · {preview.duplicates} duplicate · {preview.errors.length} invalid</p>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Loan type</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader><TableBody>{preview.valid.slice(0, 8).map(r => <TableRow key={r.record}><TableCell>{r.record}</TableCell><TableCell>{r.lead.name}</TableCell><TableCell>{r.lead.phone}</TableCell><TableCell>{r.lead.loan_type || '—'}</TableCell><TableCell>{r.lead.estimated_amount ?? '—'}</TableCell></TableRow>)}</TableBody></Table></div>
      {preview.errors.slice(0, 5).map(r => <p key={r.record} className="text-sm text-destructive">Row {r.record}: {r.error}</p>)}
      <Button variant="hero" disabled={busy || !preview.valid.length || (run != null && run.next === run.ids.length)} onClick={() => void confirm()}>{run?.next === run?.ids.length && run ? <CheckCircle2 className="size-4" /> : <Upload className="size-4" />}{busy ? 'Importing…' : run ? 'Continue import' : 'Import reviewed leads'}</Button>
    </>}
    {progress && <p role="status" className="font-medium text-primary">{progress}</p>}
    <h2 className="text-xl font-semibold text-primary">Executive allocations</h2>
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Executive ID</TableHead><TableHead>Lead</TableHead><TableHead>Loan type</TableHead><TableHead>Allocated</TableHead></TableRow></TableHeader><TableBody>{history.data?.map(r => <TableRow key={r.id}><TableCell className="font-mono text-xs">{r.user_id}</TableCell><TableCell>{r.leads?.lead_code}</TableCell><TableCell>{r.leads?.loan_type ?? '—'}</TableCell><TableCell>{new Date(r.allocated_at).toLocaleDateString()}</TableCell></TableRow>)}</TableBody></Table></div>
    <h2 className="text-xl font-semibold text-primary">Recent imports</h2>
    {imports.data?.map(r => <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm"><span>{r.filename}</span><span>{r.imported} saved · {r.duplicates} duplicates · {r.invalid} invalid</span></div>)}
  </div>;
}