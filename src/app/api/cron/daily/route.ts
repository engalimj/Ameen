import { generateScheduledJobs } from "@/lib/jobs";
import { generateBills, periodOf } from "@/lib/payments";
import { runReminders } from "@/lib/reminders";

// Call once a day (for example 8:00 Riyadh time) from the host's scheduler:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/daily
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const now = new Date();
  const jobs = await generateScheduledJobs(now);
  // Create next month's bills a week ahead so the "3 days before" reminder can go out.
  const nextMonth = periodOf(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const bills = (await generateBills(periodOf(now))) + (now.getDate() >= 20 ? await generateBills(nextMonth) : 0);
  const reminders = await runReminders(now);
  return Response.json({ jobs, bills, reminders });
}
