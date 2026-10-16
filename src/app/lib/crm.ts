// Business calculations shared by several screens: booking finances,
// late-payment interest, lead scoring and the pipeline forecast.
import {
  getDataStore, Booking, ScheduleItem, Payment, Lead, SiteVisit, PriceListItem, Unit, Approval, Persona, isManagerRole, localDate,
} from './dataStore';
import { daysBetween, addDays } from './format';

const store = () => getDataStore();

export const PAYMENT_MODES = ['NEFT', 'RTGS', 'UPI', 'Cheque', 'DD', 'Cash', 'Home Loan'];

// ---------------- bookings & payments ----------------

export function scheduleFor(bookingId: string): ScheduleItem[] {
  return store().list<ScheduleItem>('paymentSchedule').filter(s => s.bookingId === bookingId).sort((a, b) => a.seq - b.seq);
}

export function paymentsFor(bookingId: string): Payment[] {
  return store().list<Payment>('payments').filter(p => p.bookingId === bookingId)
    .sort((a, b) => (a.receivedDate || '').localeCompare(b.receivedDate || '') || a.createdAt.localeCompare(b.createdAt));
}

/** Interest on an overdue instalment at the yearly rate in settings, simple interest per day late. */
export function interestOn(item: ScheduleItem, onDate = localDate()): { days: number; amount: number } {
  if (!item.dueDate || item.status === 'Paid') return { days: 0, amount: 0 };
  const days = daysBetween(item.dueDate, onDate);
  if (days <= 0) return { days: 0, amount: 0 };
  const rate = store().settingNumber('late_interest_pct', 10.5);
  const balance = Math.max(0, item.amount + item.gst - item.paid);
  return { days, amount: Math.round(balance * rate / 100 * days / 365) };
}

export interface BookingFinance {
  net: number;            // agreement value: price less discount
  gstTotal: number;
  grandTotal: number;     // net + GST
  demanded: number;       // instalments raised so far, incl. GST
  received: number;       // receipts
  refunded: number;
  paid: number;           // receipts - refunds
  outstanding: number;    // demanded but unpaid
  overdue: number;        // past due date and unpaid
  interest: number;       // late-payment interest accrued
  nextDue?: ScheduleItem;
  schedule: ScheduleItem[];
  payments: Payment[];
  percentPaid: number;
}

export function bookingFinance(b: Booking): BookingFinance {
  const schedule = scheduleFor(b.id);
  const payments = paymentsFor(b.id);
  const net = (b.price || 0) - (b.discount || 0);
  const gstTotal = schedule.length ? schedule.reduce((s, x) => s + x.gst, 0) : Math.round(net * (b.gstRate ?? 5) / 100);
  const grandTotal = net + gstTotal;
  const raised = schedule.filter(s => s.status !== 'Not Due');
  const demanded = raised.reduce((s, x) => s + x.amount + x.gst, 0);
  const received = payments.filter(p => p.type === 'Receipt').reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter(p => p.type === 'Refund').reduce((s, p) => s + p.amount, 0);
  const outstanding = raised.reduce((s, x) => s + Math.max(0, x.amount + x.gst - x.paid), 0);
  const overdueItems = schedule.filter(s => s.status === 'Overdue');
  const overdue = overdueItems.reduce((s, x) => s + Math.max(0, x.amount + x.gst - x.paid), 0);
  const interest = overdueItems.reduce((s, x) => s + interestOn(x).amount, 0);
  const nextDue = schedule.find(s => s.status === 'Due' || s.status === 'Overdue' || s.status === 'Partially Paid');
  return {
    net, gstTotal, grandTotal, demanded, received, refunded, paid: received - refunded, outstanding, overdue, interest,
    nextDue, schedule, payments, percentPaid: grandTotal ? Math.min(100, Math.round((received - refunded) / grandTotal * 100)) : 0,
  };
}

export const liveBookings = () => store().getBookings().filter(b => b.stage !== 'Cancelled');

// ---------------- units & pricing ----------------

export function unitFor(b: Booking): Unit | undefined {
  const units = store().list<Unit>('units');
  return units.find(u => u.id === b.unitId) || units.find(u => u.project === b.project && u.unitNumber === b.unit);
}

/** Price for a unit: base price from the price list plus floor rise. */
export function unitPrice(u: Unit): { base: number; floorRise: number; total: number; rate: number } {
  const pl = store().list<PriceListItem>('priceList').find(p => p.project === u.project && p.unitType === u.unitType && p.status !== 'Inactive');
  const rate = pl?.ratePerSqft || (u.carpetArea ? Math.round(u.basePrice / u.carpetArea) : 0);
  const floorRise = pl ? Math.round(Math.max(0, u.floor - 1) * pl.floorRisePerSqft * u.carpetArea) : 0;
  const base = u.basePrice || Math.round(rate * u.carpetArea);
  return { base, floorRise, total: base + floorRise, rate };
}

// ---------------- approvals ----------------

/** Who may decide an approval of this type. */
export function canApprove(p: Persona, a: Pick<Approval, 'type'>): boolean {
  if (p.role === 'Admin' || p.role === 'MIS Head') return true;
  if (a.type === 'Discount') return p.role === 'Team Leader';
  if (a.type === 'Cancellation') return p.role === 'Finance';
  return false;
}

// ---------------- lead scoring ----------------

/** Parse a budget label like "50L - 75L", "1Cr - 1.5Cr", "Below 50L" into rupees. */
export function parseBudget(s?: string): { min: number; max: number } | null {
  if (!s) return null;
  const nums = Array.from(s.matchAll(/(\d+(?:\.\d+)?)\s*(Cr|L)/gi)).map(m => Number(m[1]) * (m[2].toLowerCase() === 'cr' ? 1e7 : 1e5));
  if (nums.length === 0) return null;
  if (/below/i.test(s)) return { min: 0, max: nums[0] };
  if (/above/i.test(s)) return { min: nums[0], max: nums[0] * 1.5 };
  return { min: nums[0], max: nums[nums.length - 1] };
}

const SOURCE_POINTS: Record<string, number> = {
  Referral: 20, 'Walk-In': 18, Website: 15, 'Channel Partners': 14, 'Google Ads': 12, '99acres': 10, MagicBricks: 10, 'Housing.com': 10, 'Facebook Ads': 7,
};
const STATUS_POINTS: Record<string, number> = { New: 0, Contacted: 8, 'Follow-up': 12, Qualified: 20, 'Visit Scheduled': 25, Booked: 40, Dead: 0 };

export interface LeadScore { score: number; band: 'Hot' | 'Warm' | 'Cold'; reasons: string[] }

export function leadScore(lead: Lead, ctx?: { visits?: SiteVisit[]; priceList?: PriceListItem[] }): LeadScore {
  if (lead.status === 'Dead') return { score: 0, band: 'Cold', reasons: ['Marked dead'] };
  const reasons: string[] = [];
  let score = 10;
  // budget fit against the cheapest unit in the project
  const priceList = ctx?.priceList || store().list<PriceListItem>('priceList');
  const budget = parseBudget(lead.budget);
  const prices = priceList.filter(p => p.project === lead.project).map(p => p.basePrice);
  if (budget && prices.length) {
    const cheapest = Math.min(...prices);
    if (budget.max >= cheapest) { score += 20; reasons.push('Budget fits the project'); }
    else if (budget.max >= cheapest * 0.85) { score += 10; reasons.push('Budget close to entry price'); }
    else reasons.push('Budget below entry price');
  } else if (!budget) reasons.push('Budget not captured');
  // source quality
  const sp = SOURCE_POINTS[lead.source] ?? 8;
  score += sp;
  if (sp >= 14) reasons.push(`Strong source (${lead.source})`);
  // engagement
  score += STATUS_POINTS[lead.status] ?? 0;
  const visits = (ctx?.visits || store().getVisits()).filter(v => v.leadId === lead.id);
  if (visits.some(v => v.outcome === 'Very Interested')) { score += 20; reasons.push('Very interested after site visit'); }
  else if (visits.some(v => v.outcome === 'Interested')) { score += 10; reasons.push('Interested after site visit'); }
  else if (visits.some(v => v.status === 'Completed')) { score += 5; reasons.push('Visited the site'); }
  if (lead.priority === 'Hot') { score += 8; reasons.push('Marked hot by telecaller'); }
  // recency
  const last = lead.lastContactedAt || lead.createdAt;
  const age = daysBetween(localDate(new Date(last)), localDate());
  if (age <= 3) { score += 7; reasons.push('Contacted in the last 3 days'); }
  else if (age > 21) { score -= 10; reasons.push(`No contact for ${age} days`); }
  if ((lead.callAttempts || 0) >= 5 && ['New', 'Contacted'].includes(lead.status)) { score -= 8; reasons.push('Many calls without progress'); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, band: score >= 65 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold', reasons };
}

// ---------------- forecasting ----------------

const STAGE_PROBABILITY: Record<string, number> = { New: 0.02, Contacted: 0.04, 'Follow-up': 0.07, Qualified: 0.12, 'Visit Scheduled': 0.22 };

/** Average ticket per project from live bookings, falling back to the price list. */
export function avgTicket(project: string): number {
  const b = liveBookings().filter(x => x.project === project);
  if (b.length) return b.reduce((s, x) => s + x.price - x.discount, 0) / b.length;
  const pl = store().list<PriceListItem>('priceList').filter(p => p.project === project);
  return pl.length ? pl.reduce((s, p) => s + p.basePrice, 0) / pl.length : 0;
}

export interface Forecast {
  expectedBookings: number;
  expectedRevenue: number;
  byProject: { project: string; open: number; expectedBookings: number; expectedRevenue: number }[];
  collections: { label: string; amount: number }[];
}

/** Pipeline forecast: each open lead weighted by its stage and score; collections due from the schedule. */
export function forecast(): Forecast {
  const s = store();
  const open = s.getLeads().filter(l => STAGE_PROBABILITY[l.status] !== undefined);
  const visits = s.getVisits();
  const priceList = s.list<PriceListItem>('priceList');
  const byProject = new Map<string, { project: string; open: number; expectedBookings: number; expectedRevenue: number }>();
  const tickets = new Map<string, number>();
  for (const l of open) {
    const sc = leadScore(l, { visits, priceList }).score;
    const p = STAGE_PROBABILITY[l.status] * (0.5 + sc / 100);
    if (!tickets.has(l.project)) tickets.set(l.project, avgTicket(l.project));
    const row = byProject.get(l.project) || { project: l.project, open: 0, expectedBookings: 0, expectedRevenue: 0 };
    row.open++;
    row.expectedBookings += p;
    row.expectedRevenue += p * (tickets.get(l.project) || 0);
    byProject.set(l.project, row);
  }
  const rows = Array.from(byProject.values()).sort((a, b) => b.expectedRevenue - a.expectedRevenue);
  const t = localDate();
  const sched = s.list<ScheduleItem>('paymentSchedule').filter(x => x.status !== 'Paid' && x.status !== 'Not Due');
  const live = new Set(liveBookings().map(b => b.id));
  const bal = (x: ScheduleItem) => live.has(x.bookingId) ? Math.max(0, x.amount + x.gst - x.paid) : 0;
  const notOverdue = sched.filter(x => x.status !== 'Overdue');
  const inWindow = (from: number, to: number) => notOverdue
    .filter(x => (x.dueDate || t) > (from < 0 ? '' : addDays(t, from)) && (x.dueDate || t) <= addDays(t, to))
    .reduce((a, x) => a + bal(x), 0);
  return {
    expectedBookings: rows.reduce((a, r) => a + r.expectedBookings, 0),
    expectedRevenue: rows.reduce((a, r) => a + r.expectedRevenue, 0),
    byProject: rows,
    collections: [
      { label: 'Overdue now', amount: sched.filter(x => x.status === 'Overdue').reduce((a, x) => a + bal(x), 0) },
      { label: 'Next 30 days', amount: inWindow(-1, 30) },
      { label: '31–60 days', amount: inWindow(30, 60) },
      { label: '61–90 days', amount: inWindow(60, 90) },
    ],
  };
}

// ---------------- lead SLA ----------------

/** New leads not called within the SLA window (default 15 minutes). */
export function slaBreaches(leads: Lead[] = store().getLeads()): Lead[] {
  const mins = store().settingNumber('lead_sla_minutes', 15);
  const now = Date.now();
  // Only recent leads count: anything older than a week is a stale lead, not a missed first call.
  return leads.filter(l => l.status === 'New' && !l.lastContactedAt && (l.callAttempts || 0) === 0
    && now - new Date(l.createdAt).getTime() > mins * 60000 && now - new Date(l.createdAt).getTime() < 7 * 86400000);
}

/** Leads visible to a persona: managers see everything, others only their own. */
export function visibleLeads(p: Persona): Lead[] {
  const leads = store().getLeads();
  if (isManagerRole(p.role) || p.role === 'Digital Team' || p.role === 'Front Desk') return leads;
  if (p.role === 'Channel Partner') return leads.filter(l => l.cpId === p.refId);
  return leads.filter(l => l.assignedTo === p.name);
}
