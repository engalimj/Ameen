"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { gatewayName, markBillPaid, startCheckout } from "@/lib/payments";

export async function checkoutAction(formData: FormData) {
  const token = String(formData.get("token"));
  const bill = await db.bill.findUnique({ where: { payToken: token }, include: { lines: true } });
  if (!bill || bill.status !== "DUE") redirect(`/pay/${token}`);
  if (gatewayName() === "mock") {
    // Test checkout only: simulates a confirmed payment.
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAYMENTS !== "true") redirect(`/pay/${token}`);
    const method = String(formData.get("method") ?? "MADA");
    await markBillPaid(bill.id, { gateway: "MOCK", method, ref: `mock_${Date.now()}` });
    redirect(`/pay/${token}?paid=1`);
  }
  redirect(await startCheckout(bill));
}
