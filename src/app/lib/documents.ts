// Printable booking documents. Each opens in a new tab with a
// "Print / Save as PDF" button, filled from live CRM data.
import { getDataStore, Booking, Payment, ScheduleItem, Agreement, Project, Unit, Lead, Cancellation } from './dataStore';
import { inr, fmtDate, amountInWords, escapeHtml as e, printDocument, addDays } from './format';
import { bookingFinance, unitFor, unitPrice, interestOn } from './crm';

const s = () => getDataStore();
const company = () => s().setting('company_name', 'GENXA Developers');
const projectOf = (name: string) => s().getProjects().find(p => p.name === name) as Project | undefined;

function partyBlock(b: Booking) {
  const p = projectOf(b.project);
  const u = unitFor(b);
  return `<table>
    <tr><th>Customer</th><td>${e(b.customer)}</td><th>Booking ID</th><td>${e(b.id)}</td></tr>
    <tr><th>Mobile</th><td>${e(b.mobile)}</td><th>Booking date</th><td>${e(fmtDate(b.bookingDate))}</td></tr>
    <tr><th>Project</th><td>${e(b.project)}${p ? `, ${e(p.location)}` : ''}</td><th>RERA No.</th><td>${e(p?.reraNumber || '—')}</td></tr>
    <tr><th>Unit</th><td>${e(b.unit)} (${e(b.unitType)})</td><th>Carpet area</th><td>${u ? `${u.carpetArea} sq ft, floor ${u.floor}, ${e(u.facing || '')}` : '—'}</td></tr>
  </table>`;
}

function scheduleTable(items: ScheduleItem[], withPaid = true) {
  const rows = items.map(i => `<tr><td>${i.seq}</td><td>${e(i.stageName)}</td><td class="r">${i.percent}%</td><td class="r">${inr(i.amount)}</td><td class="r">${inr(i.gst)}</td><td class="r">${inr(i.amount + i.gst)}</td>${withPaid ? `<td>${e(i.dueDate ? fmtDate(i.dueDate) : 'On stage completion')}</td><td class="r">${inr(i.paid)}</td><td>${e(i.status)}</td>` : ''}</tr>`).join('');
  const tot = items.reduce((a, i) => ({ amt: a.amt + i.amount, gst: a.gst + i.gst, paid: a.paid + i.paid }), { amt: 0, gst: 0, paid: 0 });
  return `<table><tr><th>#</th><th>Milestone</th><th class="r">%</th><th class="r">Amount</th><th class="r">GST</th><th class="r">Total</th>${withPaid ? '<th>Due</th><th class="r">Paid</th><th>Status</th>' : ''}</tr>${rows}
  <tr><th colspan="3">Total</th><th class="r">${inr(tot.amt)}</th><th class="r">${inr(tot.gst)}</th><th class="r">${inr(tot.amt + tot.gst)}</th>${withPaid ? `<th></th><th class="r">${inr(tot.paid)}</th><th></th>` : ''}</tr></table>`;
}

export function printReceipt(p: Payment) {
  const b = s().getBookings().find(x => x.id === p.bookingId);
  if (!b) return;
  const refund = p.type === 'Refund';
  printDocument(`${p.receiptNo}`, `
    <h1>${refund ? 'Refund Voucher' : 'Payment Receipt'}</h1>
    <table><tr><th>${refund ? 'Voucher' : 'Receipt'} No.</th><td>${e(p.receiptNo)}</td><th>Date</th><td>${e(fmtDate(p.receivedDate))}</td></tr></table>
    ${partyBlock(b)}
    <div class="box">${refund ? 'Paid to' : 'Received with thanks from'} <b>${e(b.customer)}</b> the sum of <b>${inr(p.amount)}</b>
    (${e(amountInWords(p.amount))}) by <b>${e(p.mode)}</b>${p.reference ? `, reference <b>${e(p.reference)}</b>` : ''},
    ${refund ? 'towards refund on cancellation of' : 'towards'} unit ${e(b.unit)} in ${e(b.project)}.${p.remarks ? `<br><span class="muted">Remarks: ${e(p.remarks)}</span>` : ''}</div>
    <p class="muted">Amounts include GST where applicable. ${refund ? '' : 'Cheque receipts are subject to realisation.'}</p>
    <div class="sig"><div>Customer</div><div>For ${e(company())}<br>Authorised signatory</div></div>`, company());
}

export function printDemandLetter(b: Booking, item: ScheduleItem) {
  const f = bookingFinance(b);
  const interest = f.schedule.filter(x => x.status === 'Overdue').reduce((a, x) => a + interestOn(x).amount, 0);
  const due = item.dueDate || addDays(item.demandDate || new Date().toISOString().slice(0, 10), 15);
  const balance = item.amount + item.gst - item.paid;
  printDocument(`Demand letter ${b.id} ${item.stageName}`, `
    <p>Date: ${e(fmtDate(item.demandDate || new Date().toISOString()))}</p>
    <p>To,<br><b>${e(b.customer)}</b><br>Unit ${e(b.unit)}, ${e(b.project)}</p>
    <h1>Demand Letter: ${e(item.stageName)}</h1>
    <p>Dear ${e(b.customer)},</p>
    <p>We are pleased to inform you that the <b>${e(item.stageName)}</b> milestone of ${e(b.project)} has been reached. As per the
    payment schedule in your agreement, the following instalment is now payable on or before <b>${e(fmtDate(due))}</b>.</p>
    <table><tr><th>Milestone</th><th class="r">Amount</th><th class="r">GST</th><th class="r">Already paid</th><th class="r">Payable now</th></tr>
    <tr><td>${e(item.stageName)} (${item.percent}%)</td><td class="r">${inr(item.amount)}</td><td class="r">${inr(item.gst)}</td><td class="r">${inr(item.paid)}</td><td class="r"><b>${inr(balance)}</b></td></tr></table>
    ${f.overdue > 0 ? `<div class="box">Earlier instalments overdue: <b>${inr(f.overdue)}</b>. Interest accrued at ${s().settingNumber('late_interest_pct', 10.5)}% a year: <b>${inr(interest)}</b>.</div>` : ''}
    <h2>Account summary</h2>
    <table><tr><th>Agreement value</th><td class="r">${inr(f.net)}</td><th>GST</th><td class="r">${inr(f.gstTotal)}</td></tr>
    <tr><th>Total received</th><td class="r">${inr(f.paid)}</td><th>Balance (all milestones)</th><td class="r">${inr(f.grandTotal - f.paid)}</td></tr></table>
    <p>Please pay by NEFT/RTGS to the project collection account, quoting booking ID <b>${e(b.id)}</b>. Late payments attract interest
    at ${s().settingNumber('late_interest_pct', 10.5)}% a year as per the agreement.</p>
    <div class="sig"><div></div><div>For ${e(company())}<br>Authorised signatory</div></div>`, company());
}

export function printCostSheet(b: Booking) {
  const f = bookingFinance(b);
  const u = unitFor(b);
  const price = u ? unitPrice(u) : null;
  const ag = s().list<Agreement>('agreements').find(a => a.bookingId === b.id);
  const stamp = ag?.stampDuty ?? Math.round(f.net * 0.06);
  const reg = ag?.registrationFee ?? Math.min(Math.round(f.net * 0.01), 30000);
  printDocument(`Cost sheet ${b.id}`, `
    <h1>Cost Sheet</h1>${partyBlock(b)}
    <table>
      ${price ? `<tr><td>Base price (${u!.carpetArea} sq ft @ ${inr(price.rate)})</td><td class="r">${inr(price.base)}</td></tr>
      <tr><td>Floor rise</td><td class="r">${inr(price.floorRise)}</td></tr>` : ''}
      <tr><td>Agreed price</td><td class="r">${inr(b.price)}</td></tr>
      <tr><td>Less discount ${b.discountStatus && b.discountStatus !== 'Approved' ? `(${e(b.discountStatus)})` : ''}</td><td class="r">- ${inr(b.discount)}</td></tr>
      <tr><th>Agreement value</th><th class="r">${inr(f.net)}</th></tr>
      <tr><td>GST @ ${b.gstRate ?? 5}%</td><td class="r">${inr(f.gstTotal)}</td></tr>
      <tr><td>Stamp duty (6%, payable at registration)</td><td class="r">${inr(stamp)}</td></tr>
      <tr><td>Registration fee</td><td class="r">${inr(reg)}</td></tr>
      <tr><th>All-inclusive cost</th><th class="r">${inr(f.grandTotal + stamp + reg)}</th></tr>
    </table>
    <h2>Payment schedule (${e(b.paymentPlan || 'Construction Linked')})</h2>${scheduleTable(f.schedule, false)}
    <p class="muted">Stamp duty and registration are payable to the government at registration. Prices are subject to the terms of the agreement.</p>`, company());
}

export function printStatement(b: Booking) {
  const f = bookingFinance(b);
  const rows = f.payments.map(p => `<tr><td>${e(fmtDate(p.receivedDate))}</td><td>${e(p.receiptNo)}</td><td>${e(p.type)}</td><td>${e(p.mode)}</td><td>${e(p.reference || '')}</td><td class="r">${p.type === 'Refund' ? '- ' : ''}${inr(p.amount)}</td></tr>`).join('');
  printDocument(`Statement ${b.id}`, `
    <h1>Statement of Account</h1>${partyBlock(b)}
    <h2>Payment schedule</h2>${scheduleTable(f.schedule)}
    <h2>Receipts</h2><table><tr><th>Date</th><th>Receipt</th><th>Type</th><th>Mode</th><th>Reference</th><th class="r">Amount</th></tr>${rows || '<tr><td colspan="6">No payments yet</td></tr>'}</table>
    <table><tr><th>Total payable (incl. GST)</th><td class="r">${inr(f.grandTotal)}</td><th>Paid</th><td class="r">${inr(f.paid)}</td></tr>
    <tr><th>Overdue</th><td class="r">${inr(f.overdue)}</td><th>Interest accrued</th><td class="r">${inr(f.interest)}</td></tr></table>`, company());
}

export function printAllotmentLetter(b: Booking) {
  const f = bookingFinance(b);
  printDocument(`Allotment letter ${b.id}`, `
    <p>Date: ${e(fmtDate(new Date().toISOString()))}</p>
    <p>To,<br><b>${e(b.customer)}</b><br>Mobile ${e(b.mobile)}</p>
    <h1>Allotment Letter</h1>
    <p>Dear ${e(b.customer)},</p>
    <p>Thank you for choosing ${e(b.project)}. We are pleased to allot you the following unit, subject to the terms and conditions of
    the agreement for sale and timely payment of instalments.</p>
    ${partyBlock(b)}
    <table><tr><th>Agreement value</th><td class="r">${inr(f.net)}</td></tr><tr><th>GST</th><td class="r">${inr(f.gstTotal)}</td></tr>
    <tr><th>Booking amount received</th><td class="r">${inr(b.tokenAmount)}</td></tr></table>
    <h2>Payment schedule</h2>${scheduleTable(f.schedule, false)}
    <p>The agreement for sale must be executed and registered within 30 days of this letter.</p>
    <div class="sig"><div>Accepted by<br>${e(b.customer)}</div><div>For ${e(company())}<br>Authorised signatory</div></div>`, company());
}

export function printAgreement(b: Booking, ag: Agreement) {
  const f = bookingFinance(b);
  const p = projectOf(b.project);
  printDocument(`Agreement ${ag.id}`, `
    <h1>Agreement for Sale</h1>
    <p>This Agreement for Sale is made on ${e(fmtDate(ag.generatedAt || new Date().toISOString()))} between <b>${e(company())}</b>
    (the "Promoter") and <b>${e(b.customer)}</b> (the "Allottee").</p>
    ${partyBlock(b)}
    <h2>1. Consideration</h2>
    <p>The total price of the unit is <b>${inr(f.net)}</b> (${e(amountInWords(f.net))}) plus GST of ${inr(f.gstTotal)}, payable as per
    the schedule below. Stamp duty of ${inr(ag.stampDuty)} and registration fee of ${inr(ag.registrationFee)} are payable by the Allottee.</p>
    ${scheduleTable(f.schedule, false)}
    <h2>2. Possession</h2>
    <p>The Promoter shall hand over possession on or before ${e(fmtDate(p?.possessionDate))}, subject to receipt of the occupancy
    certificate and payment of all dues. Project registered under RERA No. ${e(p?.reraNumber || '—')}.</p>
    <h2>3. Delayed payment</h2>
    <p>Any delay in payment shall attract interest at ${s().settingNumber('late_interest_pct', 10.5)}% a year from the due date until payment.</p>
    <h2>4. Cancellation</h2>
    <p>On cancellation by the Allottee, the Promoter may deduct 10% of amounts paid within 30 days of booking, 20% within 90 days, and 25%
    thereafter, and refund the balance without interest.</p>
    <div class="sig">
      <div>${ag.signatureUrl ? `<img src="${e(ag.signatureUrl)}" alt="signature">` : ''}Allottee: ${e(ag.signerName || b.customer)}${ag.signedAt ? `<br><span class="muted">e-signed ${e(fmtDate(ag.signedAt))}</span>` : ''}</div>
      <div>For ${e(company())}<br>Authorised signatory</div>
    </div>
    ${ag.registrationNumber ? `<p class="muted">Registered on ${e(fmtDate(ag.registeredDate))}, document no. ${e(ag.registrationNumber)}</p>` : ''}`, company());
}

/** Proposal / quotation for a prospect, for one or more units. */
export function printProposal(lead: Pick<Lead, 'name' | 'mobile' | 'project'>, units: Unit[], discount = 0, validDays = 7) {
  const p = projectOf(lead.project);
  const rows = units.map(u => {
    const pr = unitPrice(u);
    const net = pr.total - discount;
    const gst = Math.round(net * (net <= 4500000 ? 1 : 5) / 100);
    return `<tr><td>${e(u.unitNumber)}</td><td>${e(u.unitType)}</td><td>${u.carpetArea} sq ft</td><td>${u.floor}</td><td>${e(u.facing || '')}</td>
      <td class="r">${inr(pr.total)}</td><td class="r">${discount ? '- ' + inr(discount) : '—'}</td><td class="r">${inr(gst)}</td><td class="r"><b>${inr(net + gst)}</b></td></tr>`;
  }).join('');
  const stages = s().list<any>('projectStages').filter(x => x.project === lead.project).sort((a, b) => a.seq - b.seq);
  printDocument(`Proposal ${lead.name}`, `
    <p>Date: ${e(fmtDate(new Date().toISOString()))}</p>
    <p>To,<br><b>${e(lead.name)}</b><br>Mobile ${e(lead.mobile)}</p>
    <h1>Proposal: ${e(lead.project)}</h1>
    <p>Thank you for your interest in ${e(lead.project)}${p ? `, ${e(p.location)}` : ''}. Please find our offer below.</p>
    <table><tr><th>Unit</th><th>Type</th><th>Carpet</th><th>Floor</th><th>Facing</th><th class="r">Price</th><th class="r">Discount</th><th class="r">GST</th><th class="r">Total</th></tr>${rows}</table>
    ${stages.length ? `<h2>Payment plan (construction linked)</h2><table><tr>${stages.map(x => `<th>${e(x.stageName)}</th>`).join('')}</tr><tr>${stages.map(x => `<td>${x.percent}%</td>`).join('')}</tr></table>` : ''}
    <p>RERA No. ${e(p?.reraNumber || '—')}. Possession by ${e(fmtDate(p?.possessionDate))}. Stamp duty and registration extra as applicable.
    This offer is valid until <b>${e(fmtDate(addDays(new Date().toISOString().slice(0, 10), validDays)))}</b>.</p>
    <div class="sig"><div></div><div>For ${e(company())}</div></div>`, company());
}

export function printCancellationLetter(c: Cancellation) {
  const b = s().getBookings().find(x => x.id === c.bookingId);
  if (!b) return;
  printDocument(`Cancellation ${c.id}`, `
    <h1>Cancellation &amp; Refund Statement</h1>${partyBlock(b)}
    <table><tr><th>Request date</th><td>${e(fmtDate(c.requestDate))}</td><th>Status</th><td>${e(c.status)}</td></tr>
    <tr><th>Reason</th><td colspan="3">${e(c.reason)}</td></tr>
    <tr><th>Amount paid</th><td class="r">${inr(c.paidAmount)}</td><th>Deduction (${c.deductionPct}%)</th><td class="r">${inr(c.deductionAmount)}</td></tr>
    <tr><th>Refund payable</th><td class="r"><b>${inr(c.refundAmount)}</b></td><th>Refund reference</th><td>${e(c.refundReference || '—')}</td></tr></table>
    <div class="sig"><div>${e(b.customer)}</div><div>For ${e(company())}</div></div>`, company());
}
