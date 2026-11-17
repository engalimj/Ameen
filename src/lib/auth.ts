import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { PORTAL_PATH, type Role } from "./constants";
import { sendOtp } from "./messaging";

const SESSION_COOKIE = "ameen_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Create and send a one-time code. Returns the code only in console mode (development). */
export async function requestOtp(phone: string): Promise<{ ok: boolean; devCode?: string; reason?: string }> {
  const user = await db.user.findUnique({ where: { phone } });
  if (!user || !user.active) return { ok: false, reason: "unknown" };

  const recent = await db.otpCode.count({ where: { phone, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } } });
  if (recent >= 5) return { ok: false, reason: "rate" };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otpCode.create({
    data: { phone, codeHash: sha(phone + code), expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) },
  });
  await sendOtp(phone, code, user.locale);
  return { ok: true, devCode: process.env.MESSAGING_MODE === "console" ? code : undefined };
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await db.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return null;
  if (otp.codeHash !== sha(phone + code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return null;
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({ data: { tokenHash: sha(token), userId: user.id, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return user;
}

const VIEW_AS_COOKIE = "ameen_view_as";

/** The person who actually signed in. */
export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

/**
 * The user whose screens are shown. Normally the signed-in person; when an
 * Ameen admin uses "Open their screen", it is the chosen user. The view-as
 * cookie is ignored for anyone who is not an admin.
 */
export async function getCurrentUser() {
  const real = await getSessionUser();
  if (!real || real.role !== "ADMIN") return real;
  const viewAs = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!viewAs || viewAs === real.id) return real;
  return (await db.user.findUnique({ where: { id: viewAs } })) ?? real;
}

/** When an admin is viewing someone else's screens: who they are viewing. */
export async function getViewAs() {
  const real = await getSessionUser();
  if (!real || real.role !== "ADMIN") return null;
  const viewed = await getCurrentUser();
  return viewed && viewed.id !== real.id ? { admin: real, user: viewed } : null;
}

export async function startViewAs(userId: string) {
  const real = await getSessionUser();
  if (!real || real.role !== "ADMIN") return false;
  (await cookies()).set(VIEW_AS_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  return true;
}

export async function stopViewAs() {
  (await cookies()).delete(VIEW_AS_COOKIE);
}

/** Use at the top of each portal page. Redirects to sign-in or to the user's own portal. */
export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(PORTAL_PATH[user.role as Role] ?? "/login");
  return user;
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(VIEW_AS_COOKIE);
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete(SESSION_COOKIE);
}
