import "server-only";
// One notification service for every channel. In the MVP:
//  - IN_APP: stored in the Notification table, shown in each portal
//  - EMAIL:  sent through Resend when RESEND_API_KEY is set, else printed to the console
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

/**
 * Email through Resend (https://resend.com) when RESEND_API_KEY is set, otherwise printed
 * to the console. EMAIL_FROM sets the sender; until a domain is verified in Resend, the
 * default onboarding@resend.dev can only deliver to the Resend account's own email.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<Result> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject=${subject}\n${body}`);
    return { ok: true, detail: "console" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Ameen <onboarding@resend.dev>", to: [to], subject, text: body }),
    });
    if (!res.ok) {
      const detail = `${res.status} ${await res.text()}`;
      console.error(`[email] failed to=${to}: ${detail}`);
      return { ok: false, detail };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[email] failed to=${to}:`, e);
    return { ok: false, detail: String(e) };
  }
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
