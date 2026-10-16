// Month-by-month figures for the dashboards and reports, all computed from live data.
import { getDataStore, Payment, ScheduleItem, LeadSource, localDate } from './dataStore';
import { lastMonths, monthKey } from './format';

export interface MonthRow {
  key: string;
  month: string;
  leads: number;
  visits: number;
  bookings: number;
  bookingValueCr: number;
  collectedL: number;
  demandedL: number;
  spendK: number;
}

export function monthlySeries(n = 6, project = ''): MonthRow[] {
  const s = getDataStore();
  const leads = s.getLeads().filter(l => !project || l.project === project);
  const visits = s.getVisits().filter(v => v.status === 'Completed' && (!project || v.project === project));
  const bookings = s.getBookings().filter(b => b.stage !== 'Cancelled' && (!project || b.project === project));
  const bookingIds = new Set(s.getBookings().filter(b => !project || b.project === project).map(b => b.id));
  const receipts = s.list<Payment>('payments').filter(p => p.type === 'Receipt' && bookingIds.has(p.bookingId));
  const schedule = s.list<ScheduleItem>('paymentSchedule').filter(x => bookingIds.has(x.bookingId));
  const cost = new Map(s.list<LeadSource>('sources').map(x => [x.name, x.costPerLead || 0]));
  return lastMonths(n).map(m => {
    const ml = leads.filter(l => monthKey(l.createdAt) === m.key);
    const mb = bookings.filter(b => monthKey(b.bookingDate) === m.key);
    return {
      key: m.key, month: m.label,
      leads: ml.length,
      visits: visits.filter(v => monthKey(v.date) === m.key).length,
      bookings: mb.length,
      bookingValueCr: +(mb.reduce((a, b) => a + b.price - b.discount, 0) / 1e7).toFixed(2),
      collectedL: Math.round(receipts.filter(p => monthKey(p.receivedDate) === m.key).reduce((a, p) => a + p.amount, 0) / 1e5),
      demandedL: Math.round(schedule.filter(x => monthKey(x.dueDate) === m.key).reduce((a, x) => a + x.amount + x.gst, 0) / 1e5),
      spendK: Math.round(ml.reduce((a, l) => a + (cost.get(l.source) || 0), 0) / 1000),
    };
  });
}

/** Per-source funnel: leads, visits done, bookings, spend and cost per booking. */
export function sourcePerformance(project = '') {
  const s = getDataStore();
  const leads = s.getLeads().filter(l => !project || l.project === project);
  const visited = new Set(s.getVisits().filter(v => v.status === 'Completed').map(v => v.leadId));
  const booked = new Map(s.getBookings().filter(b => b.stage !== 'Cancelled' && b.leadId).map(b => [b.leadId, b]));
  return s.getSources().map(src => {
    const sl = leads.filter(l => l.source === src.name);
    const bookings = sl.filter(l => booked.has(l.id));
    const value = bookings.reduce((a, l) => { const b = booked.get(l.id)!; return a + b.price - b.discount; }, 0);
    const spend = sl.length * (src.costPerLead || 0);
    return {
      source: src.name, type: src.type, leads: sl.length, visits: sl.filter(l => visited.has(l.id)).length, bookings: bookings.length,
      value, spend, cpl: src.costPerLead || 0, cpb: bookings.length ? spend / bookings.length : 0,
      conversion: sl.length ? bookings.length / sl.length * 100 : 0, roi: spend ? value / spend : 0,
    };
  }).filter(r => r.leads > 0).sort((a, b) => b.leads - a.leads);
}

/** Per-person activity for the team leaderboard. */
export function teamPerformance(monthOnly = true) {
  const s = getDataStore();
  const month = localDate().slice(0, 7);
  const inMonth = (d?: string) => !monthOnly || monthKey(d) === month;
  return s.getUsers().filter(u => u.status === 'Active' && ['Telecaller', 'Sales Executive'].includes(u.role)).map(u => {
    if (u.role === 'Telecaller') {
      const leads = s.getLeads().filter(l => l.assignedTo === u.name);
      const visits = s.getVisits().filter(v => v.telecaller === u.name && inMonth(v.createdAt));
      const calls = s.list<any>('callLogs').filter(c => c.caller === u.name && inMonth(c.calledAt));
      return { name: u.name, role: u.role, target: u.target, a: calls.length, aLabel: 'Calls', b: visits.length, bLabel: 'Visits booked', c: leads.filter(l => l.status !== 'Dead').length, cLabel: 'Open leads' };
    }
    const visits = s.getVisits().filter(v => v.salesExec === u.name && v.status === 'Completed' && inMonth(v.date));
    const bookings = s.getBookings().filter(b => b.salesExec === u.name && b.stage !== 'Cancelled' && inMonth(b.bookingDate));
    return { name: u.name, role: u.role, target: u.target, a: visits.length, aLabel: 'Visits done', b: bookings.length, bLabel: 'Bookings', c: Math.round(bookings.reduce((x, b) => x + b.price - b.discount, 0) / 1e5), cLabel: 'Value (₹L)' };
  });
}
