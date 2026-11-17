"use server";
import { redirect } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { PORTAL_PATH, type Role } from "@/lib/constants";

export type LoginState = { step: "phone" | "code"; phone?: string; error?: string; devCode?: string };

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  if (formData.get("intent") === "restart") return { step: "phone" };

  if (prev.step === "phone" || formData.get("intent") === "resend") {
    const phone = normalizePhone(String(formData.get("phone") ?? prev.phone ?? ""));
    if (!phone) return { step: "phone", error: "badPhone" };
    const res = await requestOtp(phone);
    if (!res.ok) return { step: "phone", error: res.reason === "rate" ? "rate" : "unknown" };
    return { step: "code", phone, devCode: res.devCode };
  }

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const user = prev.phone ? await verifyOtp(prev.phone, code) : null;
  if (!user) return { ...prev, error: "badCode" };
  redirect(PORTAL_PATH[user.role as Role]);
}
