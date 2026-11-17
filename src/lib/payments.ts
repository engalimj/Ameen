import "server-only";
// Payment links. One link per monthly bill covers the full total (owner money
// plus Ameen money); the split stays on the bill lines for reporting.
// PAYMENT_GATEWAY=mock serves a local test checkout at /pay/<token>.
// PAYMENT_GATEWAY=moyasar creates a hosted Moyasar invoice (mada, Apple Pay,
// STC Pay) and confirms it through /api/payments/webhook.
import { randomBytes } from "crypto";
import { db } from "./db";
import { LINE_PAYEE, type LineKind } from "./constants";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";
export const gatewayName = () => (process.env.PAYMENT_GATEWAY ?? "mock").toLowerCase();

export const billTotal = (lines: { amount: number }[]) => lines.reduce((s, l) => s + l.amount, 0);

export function splitTotals(lines: { amount: number; payee: string }[]) {
  return {
    owner: lines.filter((l) => l.payee === "OWNER").reduce((s, l) => s + l.amount, 0),
    ameen: lines.filter((l) => l.payee === "AMEEN").reduce((s, l) => s + l.amount, 0),
  };
}

/** The link sent to the tenant. Always our own URL so it never expires; it hands over to the gateway. */
export const payLink = (payToken: string) => `${appUrl()}/pay/${payToken}`;

export function periodOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Create this month's bill for every unit that has a tenant. Safe to run more than once. */
export async function generateBills(period: string) {
  const [y, m] = period.split("-").map(Number);
  const units = await db.unit.findMany({ where: { tenants: { some: { role: "TENANT", active: true } } } });
  let created = 0;
  for (const u of units) {
    const exists = await db.bill.findUnique({ where: { unitId_period: { unitId: u.id, period } } });
    if (exists) continue;
    const lines: { kind: LineKind; amount: number }[] = [
      { kind: "RENT", amount: u.monthlyRent },
      { kind: "SERVICE_CHARGE", amount: u.serviceCharge },
      { kind: "AMEEN_FEE", amount: u.ameenFee },
    ];
    const kept = lines.filter((l) => l.amount > 0);
    if (!kept.length) continue;
    await db.bill.create({
      data: {
        unitId: u.id,
        period,
        dueDate: new Date(Date.UTC(y, m - 1, Math.min(u.dueDay, 28), 9)),
        payToken: randomBytes(16).toString("base64url"),
        lines: { create: kept.map((l) => ({ ...l, payee: LINE_PAYEE[l.kind] })) },
      },
    });
    created++;
  }
  return created;
}

export async function addBillLine(billId: string, kind: LineKind, amount: number, note?: string) {
  await db.billLine.create({ data: { billId, kind, amount, note, payee: LINE_PAYEE[kind] } });
}

/** Marks a bill paid. Reminders stop because they only go to bills in DUE status. */
export async function markBillPaid(billId: string, opts: { gateway: string; ref?: string; method?: string }) {
  const bill = await db.bill.findUnique({ where: { id: billId }, include: { unit: { include: { tenants: true } } } });
  if (!bill || bill.status === "PAID") return bill;
  const updated = await db.bill.update({
    where: { id: billId },
    data: { status: "PAID", paidAt: new Date(), gateway: opts.gateway, gatewayRef: opts.ref, paidMethod: opts.method },
  });
  for (const tenant of bill.unit.tenants) {
    await db.notification.create({
      data: {
        userId: tenant.id,
        kind: "PAYMENT_RECEIVED",
        title: tenant.locale === "ar" ? "تم استلام دفعتك" : "Payment received",
        body: tenant.locale === "ar" ? `شكرًا، تم سداد فاتورة ${bill.period}.` : `Thank you, your ${bill.period} bill is paid.`,
        link: "/tenant/payments",
      },
    });
  }
  return updated;
}

/** Hand the tenant over to the configured gateway. Returns a URL to redirect to. */
export async function startCheckout(bill: { id: string; payToken: string; period: string; lines: { amount: number }[] }) {
  if (gatewayName() !== "moyasar") return `/pay/${bill.payToken}?checkout=1`;
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error("MOYASAR_SECRET_KEY is not set");
  const res = await fetch("https://api.moyasar.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: billTotal(bill.lines),
      currency: "SAR",
      description: `Ameen bill ${bill.period}`,
      callback_url: `${appUrl()}/api/payments/webhook`,
      success_url: `${appUrl()}/pay/${bill.payToken}`,
      back_url: `${appUrl()}/pay/${bill.payToken}`,
      metadata: { billId: bill.id },
    }),
  });
  if (!res.ok) throw new Error(`Moyasar ${res.status}`);
  const inv = (await res.json()) as { id: string; url: string };
  await db.bill.update({ where: { id: bill.id }, data: { gateway: "MOYASAR", gatewayRef: inv.id } });
  return inv.url;
}

/** Re-reads an invoice from Moyasar so we never trust the webhook body alone. */
export async function confirmMoyasarInvoice(invoiceId: string) {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: "Basic " + Buffer.from(key + ":").toString("base64") },
  });
  if (!res.ok) return null;
  const inv = (await res.json()) as { id: string; status: string; metadata?: { billId?: string } };
  if (inv.status !== "paid" || !inv.metadata?.billId) return null;
  return markBillPaid(inv.metadata.billId, { gateway: "MOYASAR", ref: inv.id });
}
