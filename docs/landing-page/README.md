# Ameen landing page, filled-in playbook

The landing page (`/`) is built to the [Landing Page Playbook](landing-page-playbook.pdf).
This file is the playbook's "fill in for your project" worksheet for Ameen, plus the
pre-launch checklist. Update it whenever the landing page changes.

**The one rule:** if an element doesn't raise the opt-in rate of qualified leads, cut it.

![Annotated landing page, English desktop: each number is the playbook point it applies](annotated-en-desktop.webp)

| Arabic, phone (first screen) | Arabic, phone (annotated, full page) |
| --- | --- |
| ![Arabic phone, first screen](ar-phone-fold.webp) | ![Arabic phone annotated](annotated-ar-phone.webp) |

## 1. Headline

- Who is this for: owners and managers of residential compounds, apartment buildings and villa groups in Saudi Arabia.
- Outcome they want most: know the real state of their property and get it looked after without chasing contractors.
- Headline: **"Know exactly what your compound needs, in a free photo report within 48 hours"** · «اعرف احتياج مجمعك بالضبط، بتقرير مجاني بالصور خلال 48 ساعة»

## 2. Subheadline

- Skeptic's question: "How? And then what?"
- Subheadline: "We visit your compound or building, check cleaning, facilities and equipment, and send you every finding with photos. If you like the plan, the same team then handles daily cleaning, maintenance and repairs."

## 3. Hero image

- Thing they get: the inspection report.
- The image shows a sample report (score, findings with status chips, photo strip, suggested plan), built in HTML in `src/app/_landing/HeroReport.tsx` so it is sharp on phones, translated, and costs no image download. It is labelled "Sample".
- Next step: replace it with a real (anonymised) report from the first pilot visit.

## 4. Call to action

- What they get: a free inspection. How: we visit, then send the photo report to their phone within 48 hours.
- Button: **"Book my free inspection"** · «احجز فحصي المجاني». One action only; the phone CTA scrolls to the form, the desktop form sits beside the headline.

## 5. Form

- Qualified lead: a property with shared areas to look after (compound, building or villas), its size, its city, and the services they need.
- Fields (6): property type, number of units, services, name, mobile, city. More than 5, so 3 steps, easiest first (tap choices before typing).
- City is required because location decides whether we can serve them.

## 6. Justification line

"Why we ask for your details: to book the visit and send you the report. The report is yours to keep, whether or not you work with us."

## 7. Objection bullets (below the fold, most common first)

1. Price and risk: "Is it really free?"
2. Trust: "How do I know the work gets done?"
3. Fit: "Will it fit my property?"

This order is a first guess. Re-rank from real sales calls and WhatsApp questions once the pilot starts.

## 8. Social proof

- Offer is high-trust (yearly contract, access to the property): yes.
- We have no real proof yet, so nothing is shown. Never invent testimonials. When the first client agrees, add their quote to `landing.proof` in `src/i18n/*.json` (`[quote, name and site]`); the section then appears below everything else. Best proof: a quote about the report or response time, matching the headline.

## 9. Design, length and speed

- Removed: navigation menu, sign-in link, second CTA, services grid, how-it-works, why-us, FAQ, closing banner, social links. (Existing users sign in at `/login` directly.)
- Kept: logo, language switch (the page must work in Arabic and English).
- Target: under 300 KB transferred and LCP under 2.5 s on a mid-range phone on 4G. Measured on a local production build: 189 KB (Arabic, phone), 228 KB (English, phone); the hero uses no raster images.

## 10. Legal

- Pages: `/privacy` and `/terms`, linked under the form (consent wording) and in the footer.
- Regulation: Saudi PDPL. Both pages are drafts and need a lawyer's review before launch; also confirm the contact email and whether to show the commercial registration number.

## Pre-launch checklist

| Check | Status |
| --- | --- |
| Headline promises one clear outcome and stops the scroll | Done |
| Subheadline clarifies the promise without repeating it | Done |
| Hero image shows the thing they get or the outcome | Done (sample; swap for a real report) |
| CTA says what they get and how, with nothing else | Done |
| Only one action on the page | Done (language switch and legal links only) |
| Form asks only for what qualifies a lead | Done |
| Forms with more than 5 fields are split into steps | Done (3 steps) |
| One-line justification | Done |
| 3 objection bullets below the fold, most common first | Done (order to confirm with real data) |
| Social proof only if needed, below everything else | Slot ready, empty until real proof exists |
| Page is bare, no menus or distracting links | Done |
| Page is as short as possible | Done |
| Tested on a real phone and loads fast | Emulated iPhone 13 only; test on a real phone |
| All images compressed | Done (SVG logo only) |
| Privacy policy, terms and disclaimers linked | Done (drafts, need legal review) |
| Every element passes the one rule | Done |

| Project details | |
| --- | --- |
| Project | Ameen (أمين) |
| Page URL | `/` on the Ameen app |
| Launch date | To set |
| Opt-in rate (qualified leads) | Track from `/admin/leads` against page visits |
