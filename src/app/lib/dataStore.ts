// Supabase-backed data store for the Builder CRM.
//
// Screens read synchronously from an in-memory cache that is loaded from
// Supabase on start-up. Every write goes to Supabase first for inserts (the
// database generates IDs, validates input and runs the business rules), and
// optimistically for updates. Changes made elsewhere, including rows created
// by database triggers, arrive through Supabase Realtime and a short
// follow-up reload of the affected tables.

import { toast } from 'sonner';
import { supabase, setActor } from './supabase';

// ======================= Models =======================

export interface Project {
  id: string;
  name: string;
  location: string;
  towers: number;
  units: number;
  status: 'Active' | 'Planning' | 'Completed';
  createdAt: string;
  latitude?: number;
  longitude?: number;
  reraNumber?: string;
  possessionDate?: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Inactive';
  target: number;
  mobile?: string;
  projectAccess?: string[];
  reportsTo?: string;
}

/** The person whose view of the CRM is currently shown (picked in the role switcher). */
export interface Persona {
  name: string;
  role: string;
  /** Channel partner id (role 'Channel Partner') or booking id (role 'Buyer'). */
  refId?: string;
}

export const ADMIN_PERSONA: Persona = { name: 'Admin', role: 'Admin' };
const PERSONA_KEY = 'buildercrm_persona';

/** Roles that see the whole team instead of only their own records. */
export const isManagerRole = (role: string) =>
  ['Admin', 'MIS Head', 'Team Leader'].includes(role);

export interface LeadSource {
  id: string;
  name: string;
  type: 'Digital' | 'Portal' | 'CP' | 'Offline';
  costPerLead: number;
  status: 'Active' | 'Inactive';
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Follow-up' | 'Visit Scheduled' | 'Booked' | 'Dead';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  project: string;
  status: LeadStatus;
  assignedTo: string | null;
  priority: 'Hot' | 'Warm' | 'Cold';
  createdAt: string;
  lastContactedAt?: string;
  budget?: string;
  notes?: string;
  callAttempts?: number;
  nextFollowUp?: string;
  cpId?: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  customer: string;
  mobile: string;
  project: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show' | 'Tentative';
  telecaller: string;
  salesExec: string;
  confirmationSent: boolean;
  outcome?: 'Very Interested' | 'Interested' | 'Not Interested';
  unitsShown?: string;
  notes?: string;
  createdAt: string;
  checkinLat?: number;
  checkinLng?: number;
  checkinAt?: string;
  checkinDistanceM?: number;
  photoUrl?: string;
}

export type BookingStage = 'Token Paid' | 'Agreement Pending' | 'Agreement Done' | 'Documentation' | 'Fully Paid' | 'Possession Done' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  leadId: string;
  customer: string;
  mobile: string;
  project: string;
  unit: string;
  unitType: string;
  price: number;
  discount: number;
  tokenAmount: number;
  totalPaid: number;
  stage: BookingStage;
  salesExec: string;
  crmExec?: string;
  bookingDate: string;
  createdAt: string;
  unitId?: string;
  cpId?: string;
  gstRate?: number;
  discountStatus?: 'Approved' | 'Pending' | 'Rejected';
  paymentPlan?: string;
}

export interface ChannelPartner {
  id: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  location: string;
  status: 'Active' | 'Inactive';
  rating: number;
  commissionRate: number;
  commissionType: string;
  paymentTerms?: string;
  reraNumber?: string;
  bankDetails?: string;
  remarks?: string;
  onboardedDate: string;
  createdAt: string;
}

export interface BlockedUnit {
  id: string;
  project: string;
  unit: string;
  customer: string;
  salesExec: string;
  blockedDate: string;
  expiryDate: string;
  notes?: string;
  status: 'Active' | 'Expired' | 'Converted';
}

export interface Unit {
  id: string;
  project: string;
  tower: string;
  floor: number;
  unitNumber: string;
  unitType: string;
  carpetArea: number;
  basePrice: number;
  facing?: string;
  status: 'Available' | 'Blocked' | 'Booked' | 'Not for Sale';
}

export interface PriceListItem {
  id: string;
  project: string;
  unitType: string;
  carpetArea: number;
  ratePerSqft: number;
  basePrice: number;
  floorRisePerSqft: number;
  status: 'Active' | 'Inactive';
}

export interface ProjectStage {
  id: string;
  project: string;
  seq: number;
  stageName: string;
  percent: number;
  completed: boolean;
  completedDate?: string;
}

export interface ScheduleItem {
  id: string;
  bookingId: string;
  seq: number;
  stageName: string;
  percent: number;
  amount: number;
  gst: number;
  dueDate?: string;
  demandDate?: string;
  status: 'Not Due' | 'Due' | 'Overdue' | 'Partially Paid' | 'Paid';
  paid: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  scheduleId?: string;
  type: 'Receipt' | 'Refund';
  amount: number;
  mode: string;
  reference?: string;
  receivedDate: string;
  receiptNo: string;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Agreement {
  id: string;
  bookingId: string;
  status: 'Draft' | 'Generated' | 'Sent for Signature' | 'Signed' | 'Registered';
  agreementValue: number;
  stampDuty: number;
  registrationFee: number;
  generatedAt?: string;
  sentAt?: string;
  signedAt?: string;
  signerName?: string;
  signatureUrl?: string;
  registeredDate?: string;
  registrationNumber?: string;
}

export interface Loan {
  id: string;
  bookingId: string;
  bank: string;
  loanAmount: number;
  sanctionedAmount?: number;
  disbursedAmount?: number;
  status: string;
  applicationDate?: string;
  sanctionDate?: string;
  disbursementDate?: string;
  loanOfficer?: string;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  bookingId?: string;
  leadId?: string;
  customer: string;
  docType: string;
  fileName?: string;
  fileUrl?: string;
  status: string;
  uploadedBy?: string;
  uploadedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface Possession {
  id: string;
  bookingId: string;
  scheduledDate?: string;
  status: string;
  inspectionDate?: string;
  snagsCount?: number;
  snagNotes?: string;
  ocReceived?: boolean;
  handedOverDate?: string;
  keysHandedBy?: string;
}

export interface Cancellation {
  id: string;
  bookingId: string;
  reason: string;
  requestDate: string;
  paidAmount: number;
  deductionPct: number;
  deductionAmount: number;
  refundAmount: number;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded';
  requestedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  refundDate?: string;
  refundReference?: string;
}

export interface SupportTicket {
  id: string;
  bookingId?: string;
  customer: string;
  mobile?: string;
  project?: string;
  unit?: string;
  category: string;
  issue: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  raisedBy?: string;
  notes?: { at: string; by: string; text: string }[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  channel: string;
  recipientName?: string;
  recipientContact?: string;
  template?: string;
  message: string;
  status: string;
  relatedType?: string;
  relatedId?: string;
  sentBy?: string;
  sentAt?: string;
  scheduledFor?: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  type: 'Discount' | 'Cancellation' | string;
  refId: string;
  title: string;
  amount?: number;
  requestedBy?: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedBy?: string;
  decidedAt?: string;
  remarks?: string;
}

export interface CommissionPayout {
  id: string;
  cpId: string;
  bookingId?: string;
  amount: number;
  mode?: string;
  reference?: string;
  paidDate: string;
}

export interface ProjectUpdate {
  id: string;
  project: string;
  title: string;
  body?: string;
  stage?: string;
  photoUrl?: string;
  postedBy?: string;
  postedAt: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  caller?: string;
  direction?: string;
  outcome?: string;
  durationSec?: number;
  notes?: string;
  recordingUrl?: string;
  provider?: string;
  calledAt: string;
}

export interface AuditEntry {
  id: number;
  tableName: string;
  rowId: string;
  action: string;
  actor: string;
  changes: Record<string, any>;
  createdAt: string;
}

// ======================= Table map =======================

export type CollectionKey =
  | 'projects' | 'users' | 'sources' | 'leads' | 'visits' | 'bookings' | 'channelPartners' | 'blockedUnits'
  | 'units' | 'priceList' | 'projectStages' | 'paymentSchedule' | 'payments' | 'agreements' | 'loans'
  | 'documents' | 'possessions' | 'cancellations' | 'supportTickets' | 'notifications' | 'approvals'
  | 'commissionPayouts' | 'projectUpdates' | 'callLogs';

const TABLES: Record<CollectionKey, { table: string; order: string; desc?: boolean }> = {
  projects: { table: 'projects', order: 'id' },
  users: { table: 'team_members', order: 'id' },
  sources: { table: 'lead_sources', order: 'id' },
  leads: { table: 'leads', order: 'created_at', desc: true },
  visits: { table: 'site_visits', order: 'id' },
  bookings: { table: 'bookings', order: 'id' },
  channelPartners: { table: 'channel_partners', order: 'id' },
  blockedUnits: { table: 'blocked_units', order: 'id' },
  units: { table: 'units', order: 'id' },
  priceList: { table: 'price_list', order: 'id' },
  projectStages: { table: 'project_stages', order: 'seq' },
  paymentSchedule: { table: 'payment_schedule', order: 'seq' },
  payments: { table: 'payments', order: 'created_at' },
  agreements: { table: 'agreements', order: 'id' },
  loans: { table: 'loans', order: 'id' },
  documents: { table: 'documents', order: 'id' },
  possessions: { table: 'possessions', order: 'id' },
  cancellations: { table: 'cancellations', order: 'id' },
  supportTickets: { table: 'support_tickets', order: 'created_at', desc: true },
  notifications: { table: 'notifications', order: 'created_at', desc: true },
  approvals: { table: 'approvals', order: 'requested_at', desc: true },
  commissionPayouts: { table: 'commission_payouts', order: 'id' },
  projectUpdates: { table: 'project_updates', order: 'posted_at', desc: true },
  callLogs: { table: 'call_logs', order: 'called_at', desc: true },
};

// Database triggers change other tables when these are written. After a
// write we reload those collections so the screen is right even if a
// realtime message is missed.
const SIDE_EFFECTS: Partial<Record<CollectionKey, CollectionKey[]>> = {
  bookings: ['units', 'blockedUnits', 'paymentSchedule', 'payments', 'agreements', 'approvals', 'leads', 'bookings'],
  blockedUnits: ['units', 'blockedUnits'],
  payments: ['paymentSchedule', 'bookings', 'payments'],
  projectStages: ['paymentSchedule', 'notifications'],
  loans: ['payments', 'paymentSchedule', 'bookings'],
  agreements: ['bookings'],
  possessions: ['bookings'],
  cancellations: ['approvals', 'bookings', 'leads', 'payments', 'paymentSchedule', 'units', 'cancellations'],
  approvals: ['bookings', 'cancellations', 'leads', 'payments', 'paymentSchedule', 'units'],
  units: ['units'],
};

const NUMERIC = new Set([
  'price', 'discount', 'tokenAmount', 'totalPaid', 'costPerLead', 'rating', 'commissionRate', 'gstRate',
  'amount', 'gst', 'paid', 'percent', 'carpetArea', 'basePrice', 'ratePerSqft', 'floorRisePerSqft',
  'agreementValue', 'stampDuty', 'registrationFee', 'loanAmount', 'sanctionedAmount', 'disbursedAmount',
  'paidAmount', 'deductionPct', 'deductionAmount', 'refundAmount', 'latitude', 'longitude', 'checkinLat',
  'checkinLng', 'checkinDistanceM',
]);

// camelCase <-> snake_case helpers
const toSnake = (s: string) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function rowToModel<T>(row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null && k !== 'assigned_to') continue; // keep optional fields undefined
    const key = toCamel(k);
    out[key] = typeof v === 'string' && NUMERIC.has(key) && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  return out as T;
}

const NULL_IF_EMPTY = new Set(['nextFollowUp', 'lastContactedAt', 'email', 'dueDate', 'scheduledDate', 'inspectionDate',
  'handedOverDate', 'sanctionDate', 'disbursementDate', 'registeredDate', 'reportsTo', 'cpId', 'expiryDate', 'possessionDate']);

function modelToRow(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toSnake(k)] = v === '' && NULL_IF_EMPTY.has(k) ? null : v;
  }
  return out;
}

// ======================= Errors =======================

/** An error from the database rules, with a message fit to show the user. */
export class CrmError extends Error {
  code: string;
  detail?: string;
  constructor(code: string, message: string, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

const FRIENDLY: Record<string, string> = {
  '23505': 'This record already exists.',
  '42501': 'You do not have permission to do that.',
  PGRST116: 'Record not found.',
};

export function toCrmError(err: any): CrmError {
  if (err instanceof CrmError) return err;
  const raw: string = err?.message || String(err || 'Unknown error');
  const m = raw.match(/^([A-Z][A-Z_]+):\s*(.*)$/s);
  if (m) return new CrmError(m[1], m[2], err?.details || undefined);
  if (/Failed to fetch|NetworkError/i.test(raw)) return new CrmError('NETWORK', 'Could not reach the server. Check your connection and try again.');
  return new CrmError(err?.code || 'ERROR', FRIENDLY[err?.code] || raw, err?.details || undefined);
}

/** Show a database error as a toast. */
export function toastError(err: any, prefix?: string) {
  const e = toCrmError(err);
  toast.error(prefix ? `${prefix}: ${e.message}` : e.message);
}

type Listener = () => void;
type Store = { [K in CollectionKey]: any[] } & { lastUpdated: string };

class DataStore {
  private data: Store = Object.fromEntries(
    (Object.keys(TABLES) as CollectionKey[]).map(k => [k, []]),
  ) as any;

  private settings: Record<string, string> = {};
  private listeners = new Set<Listener>();
  private loaded = false;
  private realtimeStarted = false;
  private persona: Persona = ADMIN_PERSONA;
  private pendingReload = new Set<CollectionKey>();
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;
  private notifyTimer: ReturnType<typeof setTimeout> | null = null;
  /** Result of the date refresh done on start-up (days shifted). */
  lastRefresh: { shifted?: number } = {};

  // ---------- current persona (role switcher) ----------

  getPersona(): Persona {
    return this.persona;
  }

  setPersona(persona: Persona) {
    this.persona = persona;
    setActor(persona.role === 'Admin' ? 'Admin' : `${persona.name} (${persona.role})`);
    try { localStorage.setItem(PERSONA_KEY, JSON.stringify(persona)); } catch { /* ignore */ }
    this.notifyNow();
  }

  private restorePersona() {
    try {
      const raw = localStorage.getItem(PERSONA_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Persona;
      const valid = saved.role === 'Admin'
        || (saved.role === 'Channel Partner' && this.data.channelPartners.some(c => c.id === saved.refId))
        || (saved.role === 'Buyer' && this.data.bookings.some(b => b.id === saved.refId))
        || this.data.users.some(u => u.name === saved.name && u.role === saved.role);
      if (valid) this.setPersona(saved);
    } catch { /* ignore */ }
  }

  // ---------- lifecycle ----------

  isLoaded() {
    return this.loaded;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notifyNow() {
    this.data.lastUpdated = new Date().toISOString();
    this.listeners.forEach(fn => fn());
  }

  /** Batch bursts of realtime events into one re-render. */
  private notify() {
    if (this.notifyTimer) return;
    this.notifyTimer = setTimeout(() => { this.notifyTimer = null; this.notifyNow(); }, 30);
  }

  private async fetchTable(key: CollectionKey) {
    const cfg = TABLES[key];
    const all: any[] = [];
    // PostgREST returns at most 1000 rows per request; page through larger tables
    for (let from = 0; ; from += 1000) {
      let q = supabase.from(cfg.table).select('*').order(cfg.order, { ascending: !cfg.desc });
      if (cfg.order !== 'id') q = q.order('id', { ascending: true });
      const { data, error } = await q.range(from, from + 999);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return all.map(r => rowToModel(r));
  }

  /** Load every table from Supabase into memory, after moving the demo dates up to today. */
  async load(): Promise<void> {
    try {
      const { data } = await supabase.rpc('refresh_demo_dates');
      if (data) this.lastRefresh = data as any;
    } catch { /* the CRM still works with the stored dates */ }

    const keys = Object.keys(TABLES) as CollectionKey[];
    const [results, settings] = await Promise.all([
      Promise.all(keys.map(k => this.fetchTable(k))),
      supabase.from('app_settings').select('*'),
    ]);
    keys.forEach((k, i) => { (this.data as any)[k] = results[i]; });
    (settings.data || []).forEach((r: any) => { this.settings[r.key] = r.value; });

    this.loaded = true;
    this.restorePersona();
    this.startRealtime();
    this.notifyNow();
  }

  /** Reload some collections from the database (used after writes with side effects). */
  async reload(keys: CollectionKey[]) {
    const unique = Array.from(new Set(keys));
    const results = await Promise.all(unique.map(k => this.fetchTable(k).catch(() => null)));
    unique.forEach((k, i) => { if (results[i]) (this.data as any)[k] = results[i]; });
    this.notifyNow();
  }

  private scheduleReload(key: CollectionKey) {
    const deps = SIDE_EFFECTS[key];
    if (!deps) return;
    deps.forEach(d => this.pendingReload.add(d));
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      const keys = Array.from(this.pendingReload);
      this.pendingReload.clear();
      this.reloadTimer = null;
      this.reload(keys);
    }, 400);
  }

  /** Keep the cache in sync with changes made by other users and by database triggers. */
  private startRealtime() {
    if (this.realtimeStarted) return;
    this.realtimeStarted = true;
    const channel = supabase.channel('crm-sync');
    (Object.entries(TABLES) as [CollectionKey, typeof TABLES[CollectionKey]][]).forEach(([key, cfg]) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: cfg.table }, (payload: any) => {
        const list = this.data[key];
        if (payload.eventType === 'DELETE') {
          const idx = list.findIndex(x => x.id === payload.old?.id);
          if (idx !== -1) list.splice(idx, 1);
        } else {
          this.upsertLocal(key, rowToModel<any>(payload.new));
        }
        this.notify();
      });
    });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
      if (payload.new?.key) { this.settings[payload.new.key] = payload.new.value; this.notify(); }
    });
    channel.subscribe();
  }

  private upsertLocal(key: CollectionKey, model: any) {
    const list = this.data[key];
    const idx = list.findIndex(x => x.id === model.id);
    if (idx === -1) {
      if (TABLES[key].desc) list.unshift(model); else list.push(model);
    } else {
      list[idx] = { ...list[idx], ...model };
    }
  }

  // ---------- generic CRUD ----------

  list<T = any>(key: CollectionKey): T[] {
    return this.data[key] as T[];
  }

  find<T = any>(key: CollectionKey, id: string | undefined | null): T | undefined {
    if (!id) return undefined;
    return (this.data[key] as any[]).find(x => x.id === id);
  }

  /**
   * Insert a row. The database generates the ID and validates the data; the
   * saved row is returned. Throws a CrmError with a readable message if the
   * database rejects it.
   */
  async insert<T = any>(key: CollectionKey, item: Record<string, any>): Promise<T> {
    const { id, createdAt, ...rest } = item as any;
    const { data, error } = await supabase.from(TABLES[key].table).insert(modelToRow(rest)).select().single();
    if (error) throw toCrmError(error);
    const model = rowToModel<T>(data);
    this.upsertLocal(key, model);
    this.scheduleReload(key);
    this.notifyNow();
    return model;
  }

  /** Insert several rows in one request. */
  async insertMany<T = any>(key: CollectionKey, items: Record<string, any>[]): Promise<T[]> {
    if (items.length === 0) return [];
    const rows = items.map(({ id, createdAt, ...rest }) => modelToRow(rest));
    const { data, error } = await supabase.from(TABLES[key].table).insert(rows).select();
    if (error) throw toCrmError(error);
    const models = (data || []).map(r => rowToModel<T>(r));
    models.forEach(m => this.upsertLocal(key, m));
    this.scheduleReload(key);
    this.notifyNow();
    return models;
  }

  /** Update a row and wait for the database. Throws a CrmError (and undoes the local change) on failure. */
  async patch<T = any>(key: CollectionKey, id: string, updates: Partial<T>): Promise<T> {
    const list = this.data[key];
    const index = list.findIndex(x => x.id === id);
    const before = index === -1 ? null : list[index];
    if (index !== -1) { list[index] = { ...before, ...updates }; this.notifyNow(); }
    const row = modelToRow(updates as any);
    delete row.id;
    const { data, error } = await supabase.from(TABLES[key].table).update(row).eq('id', id).select().single();
    if (error) {
      if (before) { const i = list.findIndex(x => x.id === id); if (i !== -1) list[i] = before; this.notifyNow(); }
      throw toCrmError(error);
    }
    const model = rowToModel<T>(data);
    this.upsertLocal(key, model);
    this.scheduleReload(key);
    this.notifyNow();
    return model;
  }

  /** Delete a row. Throws a CrmError on failure. */
  async remove(key: CollectionKey, id: string): Promise<void> {
    const { error } = await supabase.from(TABLES[key].table).delete().eq('id', id);
    if (error) throw toCrmError(error);
    const list = this.data[key];
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) list.splice(idx, 1);
    this.scheduleReload(key);
    this.notifyNow();
  }

  /** Optimistic update that does not need awaiting; errors are shown as a toast and rolled back. */
  private update<T extends { id: string }>(key: CollectionKey, id: string, updates: Partial<T>): T | null {
    const list = this.data[key] as T[];
    const index = list.findIndex(x => x.id === id);
    if (index === -1) return null;
    const next = { ...list[index], ...updates };
    this.patch(key, id, updates).catch(err => toastError(err, `Could not update ${id}`));
    return next;
  }

  async rpc<T = any>(fn: string, args?: Record<string, any>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) throw toCrmError(error);
    return data as T;
  }

  // ---------- settings ----------

  setting(key: string, fallback = ''): string {
    return this.settings[key] ?? fallback;
  }

  settingNumber(key: string, fallback: number): number {
    const n = Number(this.settings[key]);
    return isNaN(n) ? fallback : n;
  }

  async setSetting(key: string, value: string) {
    const { error } = await supabase.from('app_settings').upsert({ key, value });
    if (error) throw toCrmError(error);
    this.settings[key] = value;
    this.notifyNow();
  }

  // ---------- audit trail (fetched on demand) ----------

  async fetchAudit(opts: { table?: string; rowId?: string; actor?: string; limit?: number } = {}): Promise<AuditEntry[]> {
    let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(opts.limit ?? 200);
    if (opts.table) q = q.eq('table_name', opts.table);
    else if (!opts.rowId) q = q.neq('table_name', 'call_logs');
    if (opts.rowId) q = q.eq('row_id', opts.rowId);
    if (opts.actor) q = q.ilike('actor', `%${opts.actor}%`);
    const { data, error } = await q;
    if (error) throw toCrmError(error);
    return (data || []).map(r => rowToModel<AuditEntry>(r));
  }

  // ---------- file storage ----------

  /** Upload a file to the crm-files bucket and return its public URL. */
  async uploadFile(folder: string, file: File | Blob, name?: string): Promise<string> {
    const fileName = name || (file as File).name || 'file';
    const safe = fileName.replace(/[^\w.\-]+/g, '_');
    const path = `${folder}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from('crm-files').upload(path, file, { upsert: false, contentType: (file as File).type || undefined });
    if (error) throw toCrmError(error);
    return supabase.storage.from('crm-files').getPublicUrl(path).data.publicUrl;
  }

  // ======================= typed helpers (kept for existing screens) =======================

  getProjects(): Project[] { return this.data.projects; }
  addProject(project: Omit<Project, 'id' | 'createdAt'>) { return this.insert<Project>('projects', project); }
  updateProject(id: string, updates: Partial<Project>) { return this.update<Project>('projects', id, updates); }

  getUsers(): User[] { return this.data.users; }
  addUser(user: Omit<User, 'id'>) { return this.insert<User>('users', user); }
  updateUser(id: string, updates: Partial<User>) { return this.update<User>('users', id, updates); }

  getSources(): LeadSource[] { return this.data.sources; }
  addSource(source: Omit<LeadSource, 'id'>) { return this.insert<LeadSource>('sources', source); }

  getLeads(): Lead[] { return this.data.leads; }

  /** Create a lead. The database assigns the ID, checks the mobile/email and blocks duplicates. */
  addLead(lead: Omit<Lead, 'id' | 'createdAt'>) {
    return this.insert<Lead>('leads', { callAttempts: 0, ...lead });
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    return this.update('leads', id, updates);
  }

  assignLeads(leadIds: string[], telecallerId: string): number {
    let count = 0;
    leadIds.forEach(leadId => {
      if (this.updateLead(leadId, { assignedTo: telecallerId })) count++;
    });
    return count;
  }

  getVisits(): SiteVisit[] { return this.data.visits; }
  addVisit(visit: Omit<SiteVisit, 'id' | 'createdAt'>) { return this.insert<SiteVisit>('visits', visit); }
  updateVisit(id: string, updates: Partial<SiteVisit>): SiteVisit | null { return this.update('visits', id, updates); }

  getBookings(): Booking[] { return this.data.bookings; }
  addBooking(booking: Partial<Booking>) { return this.insert<Booking>('bookings', booking); }
  updateBooking(id: string, updates: Partial<Booking>): Booking | null { return this.update('bookings', id, updates); }

  getChannelPartners(): ChannelPartner[] { return this.data.channelPartners; }
  addChannelPartner(cp: Omit<ChannelPartner, 'id' | 'createdAt'>) { return this.insert<ChannelPartner>('channelPartners', cp); }
  updateChannelPartner(id: string, updates: Partial<ChannelPartner>): ChannelPartner | null { return this.update('channelPartners', id, updates); }

  getBlockedUnits(): BlockedUnit[] { return this.data.blockedUnits; }
  addBlockedUnit(blocked: Partial<BlockedUnit>) { return this.insert<BlockedUnit>('blockedUnits', blocked); }
  unblockUnit(id: string): boolean { return this.update<BlockedUnit>('blockedUnits', id, { status: 'Expired' }) !== null; }

  getUnits(): Unit[] { return this.data.units; }

  // ---------- Statistics ----------
  getStats() {
    const { leads, visits, bookings } = this.data as any as { leads: Lead[]; visits: SiteVisit[]; bookings: Booking[] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const live = bookings.filter(b => b.stage !== 'Cancelled');

    return {
      totalLeads: leads.length,
      leadsToday: leads.filter(l => new Date(l.createdAt) >= today).length,
      leadsThisMonth: leads.filter(l => new Date(l.createdAt) >= thisMonth).length,
      unassignedLeads: leads.filter(l => !l.assignedTo).length,
      visitsToday: visits.filter(v => v.date === localDate(today)).length,
      visitsThisMonth: visits.filter(v => new Date(v.createdAt) >= thisMonth).length,
      bookingsThisMonth: live.filter(b => new Date(b.createdAt) >= thisMonth).length,
      totalRevenue: live.reduce((sum, b) => sum + (b.price - b.discount), 0),
    };
  }

  exportData() {
    return JSON.stringify({ ...this.data, settings: this.settings }, null, 2);
  }
}

// Singleton instance
let storeInstance: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!storeInstance) {
    storeInstance = new DataStore();
  }
  return storeInstance;
}

export type { DataStore };

/** Calendar date (YYYY-MM-DD) in the user's local time zone, not UTC. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
