import { confirmMoyasarInvoice } from "@/lib/payments";

// Moyasar calls this when an invoice changes. We re-read the invoice from
// Moyasar with our secret key before marking anything paid.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: string; data?: { id?: string; invoice_id?: string } } | null;
  const invoiceId = body?.data?.invoice_id ?? body?.data?.id ?? body?.id;
  if (!invoiceId) return Response.json({ ok: false }, { status: 400 });
  const bill = await confirmMoyasarInvoice(invoiceId);
  return Response.json({ ok: Boolean(bill) });
}

// Moyasar also redirects the browser to callback_url with ?id=...&status=paid
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("invoice_id") ?? url.searchParams.get("id");
  const bill = id ? await confirmMoyasarInvoice(id) : null;
  return Response.redirect(new URL(bill ? `/pay/${bill.payToken}?paid=1` : "/", req.url));
}
