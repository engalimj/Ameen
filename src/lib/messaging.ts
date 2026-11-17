import "server-only";
// One notification service for every channel. In the MVP:
//  - IN_APP: stored in the Notification table, shown in each portal
//  - EMAIL:  printed to the console until an email provider is configured
//  - WHATSAPP: used only for payment reminders (job alerts come in phase 2).
//    In console mode it prints the message; with WHATSAPP_TOKEN and
//    WHATSAPP_PHONE_ID set it calls the Meta WhatsApp Cloud API with an
//    approved template.
import { db } from "./db";

export type Channel = "IN_APP" | "EMAIL" | "WHATSAPP";

type Result = { ok: boolean; detail?: string };

const consoleMode = () => (process.env.MESSAGING_MODE ?? "console") === "console";

export async function notifyInApp(userId: string, kind: string, title: string, body: string, link?: string) {
  await db.notification.create({ data: { userId, kind, title, body, link } });
  return { ok: true } satisfies Result;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<Result> {
  console.log(`[email] to=${to} subject=${subject}\n${body}`);
  return { ok: true, detail: "console" };
}

export async function sendWhatsApp(
  to: string,
  text: string,
  template?: { name: string; language: string; params: string[] },
): Promise<Result> {
  if (consoleMode() || !process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    console.log(`[whatsapp] to=${to}\n${text}`);
    return { ok: true, detail: "console" };
  }
  // Business-initiated messages must use a template approved in Meta Business Manager.
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace("+", ""),
      type: "template",
      template: {
        name: template?.name ?? "payment_reminder",
        language: { code: template?.language ?? "ar" },
        components: [{ type: "body", parameters: (template?.params ?? []).map((p) => ({ type: "text", text: p })) }],
      },
    }),
  });
  return res.ok ? { ok: true } : { ok: false, detail: `${res.status} ${await res.text()}` };
}

/** Sign-in codes. Sent by SMS in production (provider to be chosen); console in development. */
export async function sendOtp(phone: string, code: string, locale: string) {
  const text = locale === "ar" ? `رمز الدخول إلى أمين: ${code}` : `Your Ameen sign-in code: ${code}`;
  console.log(`[otp] ${phone}: ${text}`);
}
