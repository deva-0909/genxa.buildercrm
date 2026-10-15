// Supabase-backed data store for the Builder CRM.
//
// All screens read synchronously from an in-memory cache (the original Figma
// design used localStorage the same way). The cache is loaded from Supabase
// once after sign-in, and every change is written through to Supabase in the
// background. Changes made by other users arrive through Supabase Realtime.

import { toast } from 'sonner';
import { supabase } from './supabase';

export interface Project {
  id: string;
  name: string;
  location: string;
  towers: number;
  units: number;
  status: 'Active' | 'Planning' | 'Completed';
  createdAt: string;
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
}

export interface LeadSource {
  id: string;
  name: string;
  type: 'Digital' | 'Portal' | 'CP' | 'Offline';
  costPerLead: number;
  status: 'Active' | 'Inactive';
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  project: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Follow-up' | 'Visit Scheduled' | 'Dead';
  assignedTo: string | null;
  priority: 'Hot' | 'Warm' | 'Cold';
  createdAt: string;
  lastContactedAt?: string;
  budget?: string;
  notes?: string;
  callAttempts?: number;
  nextFollowUp?: string;
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
}

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
  stage: 'Token Paid' | 'Agreement Pending' | 'Agreement Done' | 'Documentation' | 'Fully Paid' | 'Possession Done' | 'Completed';
  salesExec: string;
  crmExec?: string;
  bookingDate: string;
  createdAt: string;
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

type CollectionKey =
  | 'projects' | 'users' | 'sources' | 'leads' | 'visits'
  | 'bookings' | 'channelPartners' | 'blockedUnits';

// Maps each in-memory collection to its Supabase table and ID prefix
const TABLES: Record<CollectionKey, { table: string; prefix: string; pad: number; start: number }> = {
  projects: { table: 'projects', prefix: 'PRJ', pad: 3, start: 1 },
  users: { table: 'team_members', prefix: 'USR', pad: 3, start: 1 },
  sources: { table: 'lead_sources', prefix: 'SRC', pad: 3, start: 1 },
  leads: { table: 'leads', prefix: 'LD', pad: 4, start: 2848 },
  visits: { table: 'site_visits', prefix: 'SV', pad: 3, start: 124 },
  bookings: { table: 'bookings', prefix: 'BK', pad: 3, start: 127 },
  channelPartners: { table: 'channel_partners', prefix: 'CP', pad: 3, start: 1 },
  blockedUnits: { table: 'blocked_units', prefix: 'BL', pad: 3, start: 1 },
};

// camelCase <-> snake_case helpers
const toSnake = (s: string) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function rowToModel<T>(row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null && k !== 'assigned_to') continue; // keep optional fields undefined
    const key = toCamel(k);
    out[key] = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && ['price', 'discount', 'tokenAmount', 'totalPaid', 'costPerLead', 'rating', 'commissionRate'].includes(key)
      ? Number(v)
      : v;
  }
  return out as T;
}

function modelToRow(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toSnake(k)] = v === '' && (k === 'nextFollowUp' || k === 'lastContactedAt') ? null : v;
  }
  return out;
}

type Listener = () => void;

class DataStore {
  private data: {
    projects: Project[];
    users: User[];
    sources: LeadSource[];
    leads: Lead[];
    visits: SiteVisit[];
    bookings: Booking[];
    channelPartners: ChannelPartner[];
    blockedUnits: BlockedUnit[];
    lastUpdated: string;
  } = {
    projects: [], users: [], sources: [], leads: [], visits: [],
    bookings: [], channelPartners: [], blockedUnits: [],
    lastUpdated: new Date().toISOString(),
  };

  private listeners = new Set<Listener>();
  private loaded = false;
  private realtimeStarted = false;

  // ---------- lifecycle ----------

  isLoaded() {
    return this.loaded;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    this.data.lastUpdated = new Date().toISOString();
    this.listeners.forEach(fn => fn());
  }

  /** Load every table from Supabase into memory. */
  async load(): Promise<void> {
    const entries = Object.entries(TABLES) as [CollectionKey, typeof TABLES[CollectionKey]][];
    const results = await Promise.all(entries.map(([, cfg]) => {
      let q = supabase.from(cfg.table).select('*');
      if (cfg.table === 'leads') q = q.order('created_at', { ascending: false });
      else q = q.order('id', { ascending: true });
      return q;
    }));

    results.forEach((res, i) => {
      const [key] = entries[i];
      if (res.error) throw res.error;
      (this.data as any)[key] = (res.data || []).map(r => rowToModel(r));
    });

    this.loaded = true;
    this.startRealtime();
    this.notify();
  }

  clear() {
    this.loaded = false;
    (Object.keys(TABLES) as CollectionKey[]).forEach(k => { (this.data as any)[k] = []; });
    supabase.removeAllChannels();
    this.realtimeStarted = false;
  }

  /** Keep the cache in sync with changes made by other signed-in users. */
  private startRealtime() {
    if (this.realtimeStarted) return;
    this.realtimeStarted = true;
    const channel = supabase.channel('crm-sync');
    (Object.entries(TABLES) as [CollectionKey, typeof TABLES[CollectionKey]][]).forEach(([key, cfg]) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: cfg.table }, (payload: any) => {
        const list = (this.data as any)[key] as any[];
        if (payload.eventType === 'DELETE') {
          const idx = list.findIndex(x => x.id === payload.old?.id);
          if (idx !== -1) list.splice(idx, 1);
        } else {
          const model = rowToModel<any>(payload.new);
          const idx = list.findIndex(x => x.id === model.id);
          if (idx === -1) {
            if (key === 'leads') list.unshift(model); else list.push(model);
          } else {
            list[idx] = { ...list[idx], ...model };
          }
        }
        this.notify();
      });
    });
    channel.subscribe();
  }

  // ---------- persistence helpers ----------

  private nextId(key: CollectionKey): string {
    const cfg = TABLES[key];
    const list = (this.data as any)[key] as { id: string }[];
    let max = cfg.start - 1;
    for (const item of list) {
      const n = parseInt(String(item.id).replace(cfg.prefix, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    }
    return `${cfg.prefix}${String(max + 1).padStart(cfg.pad, '0')}`;
  }

  private persistInsert(key: CollectionKey, item: Record<string, any>) {
    const cfg = TABLES[key];
    supabase.from(cfg.table).insert(modelToRow(item)).then(({ error }) => {
      if (error) {
        console.error(`Failed to save to ${cfg.table}`, error);
        toast.error(`Could not save ${item.id}: ${error.message}`);
      }
    });
  }

  private persistUpdate(key: CollectionKey, id: string, updates: Record<string, any>) {
    const cfg = TABLES[key];
    const row = modelToRow(updates);
    delete row.id;
    if (Object.keys(row).length === 0) return;
    supabase.from(cfg.table).update(row).eq('id', id).then(({ error }) => {
      if (error) {
        console.error(`Failed to update ${cfg.table}`, error);
        toast.error(`Could not update ${id}: ${error.message}`);
      }
    });
  }

  private add<T extends { id: string }>(key: CollectionKey, item: T, atStart = false): T {
    const list = (this.data as any)[key] as T[];
    if (atStart) list.unshift(item); else list.push(item);
    this.persistInsert(key, item as any);
    this.notify();
    return item;
  }

  private update<T extends { id: string }>(key: CollectionKey, id: string, updates: Partial<T>): T | null {
    const list = (this.data as any)[key] as T[];
    const index = list.findIndex(x => x.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    this.persistUpdate(key, id, updates as any);
    this.notify();
    return list[index];
  }

  // ---------- Projects ----------
  getProjects(): Project[] { return this.data.projects; }

  addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    return this.add('projects', { ...project, id: this.nextId('projects'), createdAt: new Date().toISOString() });
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    return this.update('projects', id, updates);
  }

  // ---------- Users ----------
  getUsers(): User[] { return this.data.users; }

  addUser(user: Omit<User, 'id'>): User {
    return this.add('users', { ...user, id: this.nextId('users') });
  }

  // ---------- Lead Sources ----------
  getSources(): LeadSource[] { return this.data.sources; }

  addSource(source: Omit<LeadSource, 'id'>): LeadSource {
    return this.add('sources', { ...source, id: this.nextId('sources') });
  }

  // ---------- Leads ----------
  getLeads(): Lead[] { return this.data.leads; }

  addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Lead {
    return this.add('leads', {
      callAttempts: 0,
      ...lead,
      id: this.nextId('leads'),
      createdAt: new Date().toISOString(),
    } as Lead, true);
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    return this.update('leads', id, updates);
  }

  assignLeads(leadIds: string[], telecallerId: string): number {
    let count = 0;
    leadIds.forEach(leadId => {
      if (this.updateLead(leadId, { assignedTo: telecallerId, status: 'New' })) count++;
    });
    return count;
  }

  // ---------- Site Visits ----------
  getVisits(): SiteVisit[] { return this.data.visits; }

  addVisit(visit: Omit<SiteVisit, 'id' | 'createdAt'>): SiteVisit {
    return this.add('visits', { ...visit, id: this.nextId('visits'), createdAt: new Date().toISOString() });
  }

  updateVisit(id: string, updates: Partial<SiteVisit>): SiteVisit | null {
    return this.update('visits', id, updates);
  }

  // ---------- Bookings ----------
  getBookings(): Booking[] { return this.data.bookings; }

  addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    return this.add('bookings', { ...booking, id: this.nextId('bookings'), createdAt: new Date().toISOString() });
  }

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    return this.update('bookings', id, updates);
  }

  // ---------- Channel Partners ----------
  getChannelPartners(): ChannelPartner[] { return this.data.channelPartners; }

  addChannelPartner(cp: Omit<ChannelPartner, 'id' | 'createdAt'>): ChannelPartner {
    return this.add('channelPartners', { ...cp, id: this.nextId('channelPartners'), createdAt: new Date().toISOString() });
  }

  updateChannelPartner(id: string, updates: Partial<ChannelPartner>): ChannelPartner | null {
    return this.update('channelPartners', id, updates);
  }

  // ---------- Blocked Units ----------
  getBlockedUnits(): BlockedUnit[] { return this.data.blockedUnits; }

  addBlockedUnit(blocked: Omit<BlockedUnit, 'id'>): BlockedUnit {
    return this.add('blockedUnits', { ...blocked, id: this.nextId('blockedUnits') });
  }

  unblockUnit(id: string): boolean {
    return this.update<BlockedUnit>('blockedUnits', id, { status: 'Expired' }) !== null;
  }

  // ---------- Statistics ----------
  getStats() {
    const { leads, visits, bookings } = this.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      totalLeads: leads.length,
      leadsToday: leads.filter(l => new Date(l.createdAt) >= today).length,
      leadsThisMonth: leads.filter(l => new Date(l.createdAt) >= thisMonth).length,
      unassignedLeads: leads.filter(l => !l.assignedTo).length,
      visitsToday: visits.filter(v => v.date === today.toISOString().split('T')[0]).length,
      visitsThisMonth: visits.filter(v => new Date(v.createdAt) >= thisMonth).length,
      bookingsThisMonth: bookings.filter(b => new Date(b.createdAt) >= thisMonth).length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.price - b.discount), 0),
    };
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
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
