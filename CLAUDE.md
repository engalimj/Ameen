# Ameen

Facility management web app for residential compounds in Saudi Arabia. See `README.md`
for how to run it. Project-wide conventions (brand, languages, product decisions) live in
the project's shared `CLAUDE.md`; this file adds rules that apply to this repository.

## Landing page rules (standing rule, approved by Ali on 19 November 2026)

Every change to the landing page (`src/app/page.tsx`, `src/app/_landing/`, `landing` in
`src/i18n/*.json`), and any new landing or campaign page, must follow the
[Landing Page Playbook](docs/landing-page/landing-page-playbook.pdf). Read the PDF before
the work, keep `docs/landing-page/README.md` (the filled-in worksheet and checklist) up to
date, and run the pre-launch checklist before opening a pull request.

**The one rule:** if an element doesn't raise the opt-in rate of qualified leads, cut it.

The page, top to bottom:

1. **Headline**: one clear, specific outcome (number, timeframe or concrete result), not the company name or features. A stranger must get it in 3 seconds.
2. **Subheadline**: answers the question the headline raises (how, for whom, by when) in one or two short lines, without repeating it.
3. **Hero image**: proof. Show the thing they get or the result. No decorative stock photos. Must read on a small phone.
4. **Call to action**: names what they get and how it arrives. One CTA, one action, no competing links or buttons.
5. **Form**: only fields that qualify the lead or help follow-up. More than 5 fields means multiple steps, easiest first.
6. **Justification line** (optional): one sentence on why they should give their details. Not a sales pitch.
7. **Objection bullets**: exactly 3, below the fold, most common first, short and direct.
8. **Social proof**: only when needed, below everything else, matching the headline's promise. Never invent testimonials, numbers or logos.
9. **Design, length, speed**: no navigation menu or extra links, as short as possible, mobile first, every image compressed.
10. **Legal**: privacy policy and terms linked, consent wording on the form, Saudi PDPL in mind. Not legal advice; flag legal text for review.

Ameen specifics: both Arabic and English must pass the checklist; the language switch is
the only allowed extra control. Brand rules from the brand guidelines still apply.
