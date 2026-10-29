# System Guide — Admin, Visual Editor, SEO, AEO, GEO

A complete reference for the five systems that make this website run. Written for two
readers: the owner, who needs to know what each control does, and whoever (human or AI)
builds the next site on the same engine.

**Contents**
1. [How the site is put together](#1-how-the-site-is-put-together)
2. [Admin panel](#2-admin-panel)
3. [Visual editor](#3-visual-editor)
4. [SEO — being found](#4-seo--being-found)
5. [AEO — being quoted by AI assistants](#5-aeo--being-quoted-by-ai-assistants)
6. [GEO — being found locally](#6-geo--being-found-locally)
7. [The checks that keep it working](#7-the-checks-that-keep-it-working)

---

## 1. How the site is put together

| Layer | What it is |
|---|---|
| Front end | React 18 (UMD build, straight from a CDN) — **no build step, no bundler** |
| App code | One file, `assets/app.js` — the public site *and* the admin *and* the editor |
| Server render | `render.php` — builds real HTML for every address before any JavaScript runs |
| SEO engine | `api/seo-lib.php` — titles, descriptions, JSON-LD, sitemap, llms.txt |
| Storage | MySQL — the whole site is **one JSON document**; enquiries live in their own table |
| 3D | Three.js, self-hosted, loaded only once the page is idle |
| Hosting | Apache + PHP on cPanel. `.htaccess` does the routing |

**Why it matters that pages are built on the server.** Most AI crawlers, and some search
crawlers, do not run JavaScript. If your words only appear after React starts, those
crawlers see an empty page. `render.php` writes the real text into the HTML first, so
everyone — Google, Bing, ChatGPT, Claude, Perplexity — reads the same content.

**Every address goes through one path:**

```
Browser → .htaccess → render.php → decides 200 / 301 / 404
                                 → sends full HTML (server copy inside <div id="root">)
                                 → assets/app.js starts; React replaces that copy
```

The 20 files in `api/` are the server side: login, saving, the contact form, enquiries,
sitemap, robots, llms.txt, IndexNow, uploads and health checks.

---

## 2. Admin panel

At **`/admin`**. One password, no user accounts. Everything on the site is editable here.

### Security
- Password stored only as a hash — never in any file a visitor can read.
- Session plus an anti-forgery token on every change; the cookie cannot be read by scripts.
- Wrong passwords are counted **before** checking, so trying many at once gains nothing.
- Sessions end after 8 hours idle, 7 days absolute.
- Changing or resetting the password **signs out every other device**.
- "Forgot password" sends a single-use link, valid 30 minutes, to a private recovery
  address held in `api/config.php` (never in the code).
- You are emailed when the admin is opened from a new device, and when many wrong
  passwords are tried across the site.
- A fresh installation has **no default password** — the first one is set via the reset link.

### The 14 tabs

| Tab | What you do there |
|---|---|
| **Dashboard** | Overview and shortcuts |
| **Visual Editor** | Edit the live pages (section 3) |
| **Services** | Add, edit, reorder, unpublish or delete services |
| **Blog** | Same for blog posts |
| **Leads** | Every enquiry — mark read, mark all read, delete |
| **SEO** | Title, description and focus keyword per page, with a Google-result preview |
| **Schema** | Business type, opening hours, payments, search-engine verification codes |
| **Search Engines** | Your site address, sitemap, submission links |
| **Local & Business** | Address, map position, areas served, review links |
| **Practitioner** | Who you are, credentials, experience (feeds Google's trust signals) |
| **AI & GEO** | Which AI assistants may read you, `llms.txt`, IndexNow key and button |
| **Redirects** | Old addresses pointing to new ones; merge duplicates; undo |
| **SEO Health** | A live, scored audit of the whole site |
| **Settings** | Email routing, map, social links, password, backup/restore |

### How saving works

```
You edit → change held in memory → Save → sent to the server (checked for login + token)
        → written to the database → automatic follow-up jobs run
```

Those follow-up jobs, on every save:
1. Stamp the changed page's date — this becomes its `lastmod` in the sitemap.
2. Create a 301 redirect if an address changed, and collapse redirect chains.
3. Rewrite `sitemap.xml`, `llms.txt`, `llms-full.txt`, `robots.txt`.
4. Queue changed addresses to IndexNow (throttled, live site only).
5. Rebuild the structured data.

### Two deliberate design choices

- **The whole site is one JSON document.** One save, one backup, easy undo (80 steps of
  undo/redo, plus "revert to when I opened the editor").
- **Enquiries are NOT in that document.** They sit in their own database table. This was a
  real bug once: an enquiry arriving while you were saving could wipe out your edit, or be
  lost itself. They are also never sent to a visitor's browser.

### Backup
**Settings → Export content** downloads the whole site as a file; **Import** restores it.
Take an export before any large content change.

---

## 3. Visual editor

Turn it on and the real website becomes editable. There is no separate preview — you are
editing the actual page, so what you see is what visitors get.

### Two ways to edit

**A. Click any text and type.** Titles, summaries, prices, headings, FAQ questions and
answers, button labels. It saves when you click away. Some fields show a live word counter
(the "direct answer" box aims for 45–55 words, which is the length AI assistants quote).

Pasted formatting is stripped automatically — the fields accept plain text only, so a copy
and paste from Word can never inject stray code into the page.

**B. Build with blocks.** **46 block types**, plus **8** that can sit inside columns:

> columns · heading · dual-colour heading · animated text · text · image · image scroller ·
> button · call-to-action band · pricing table · price menu · countdown · team · quote ·
> checklist · feature list · divider · spacer · video · gallery · carousel · image box ·
> info box · map · testimonial · counter · progress bar · rating · alert · tabs ·
> accordion · toggle · promo banner · rotating circle menu · flip cards · popup ·
> event calendar · multi-location map · one-page nav · before/after slider · image
> hotspots · audio · sticky video · slide-out panel · social icons · custom HTML

Custom HTML is cleaned before it is shown — scripts, event handlers and `javascript:`
links are removed.

### Device preview
Switch between desktop, tablet and phone. **Important for whoever maintains this:** the
preview resizes by *container width*, not window width. Every responsive rule in the
stylesheet therefore has to be written twice — once as a normal media query, once as a
container query. Miss the second and the preview will lie to you.

### Long pages round-trip safely
Service and blog bodies are stored as a small, safe subset of Markdown (`##` headings,
bullets, numbered lists, **bold**, and a `>` answer box). The editor converts it to
sections, and converts your edits back. That conversion is **lossless in both
directions** — there is an automated test that proves it across every content file. It
matters because a lossy conversion would silently eat your words.

---

## 4. SEO — being found

### The foundations
- **One address per page.** `http://` and the non-`www` address both redirect (301) to the
  single `https://www…` address. This is enforced in two places — the `.htaccess` *and*
  in PHP — because you cannot assume a shared host applied your `.htaccess`.
  *Symptom when this is missing: Bing reports "too many pages with identical meta
  descriptions", listing the http and https versions of the same page.*
- **A self-referencing canonical tag** on every page.
- **Unique title and description per address.** All 39 pages here have distinct ones.
- **Exactly one visible `<h1>` per page**, both in the server HTML and after JavaScript runs.
- **Real 404s** for addresses that do not exist, and 301s for ones that moved.

### Structured data (JSON-LD)
One linked graph per page, **20 different schema types**, cross-referenced so search
engines read one business rather than five disconnected fragments:

`Organization`/`ProfessionalService` · `Person` · `WebSite` · `WebPage` · `BreadcrumbList` ·
`Service` · `Offer` · `UnitPriceSpecification` · `OfferCatalog` · `FAQPage` · `Question` ·
`Answer` · `BlogPosting` · `ImageObject` · `PostalAddress` · `GeoCoordinates` · `Place` ·
`City` · `ContactPoint` · `OpeningHoursSpecification`

Two rules learned the hard way:
- **Never publish a rating you wrote yourself.** Ratings must come from Google or another
  platform. Self-declared ones risk a manual penalty.
- **Only list social profiles that genuinely exist** and link back to you.

### Sitemap and robots
Both generated live from your admin settings, with static copies in the web root as a
fallback. The sitemap contains only canonical, indexable pages — anything redirected,
unpublished or `noindex` is excluded. `lastmod` uses each page's real edit date, never
"today for everything", which would destroy the signal.

### SEO Health
A live, scored audit in the admin that re-checks the server itself: are the rewrites
working, are the files present, is anything thin, is any meta missing, is the structured
data complete, is anything insecure. **Target: 100.** Check it right after every upload —
it is the fastest way to confirm a deploy landed properly.

---

## 5. AEO — being quoted by AI assistants

Answer Engine Optimisation. Search sends you clicks; AI assistants send you *mentions* —
and increasingly, that is where people ask "who repairs phones near me" or "what does a
reading cost". Being quoted needs different work from ranking.

### Why the server rendering matters here most of all
Most AI crawlers **do not run JavaScript**. A normal React site is invisible to them. This
one writes its full text into the HTML before any script runs, which is the single biggest
reason it can be cited at all.

### Writing for extraction
Assistants lift *passages*, not pages. So every important page has:

1. **A direct answer box at the top** — 45–55 words that answer the page's question
   outright, before any preamble. This is the highest-value element on the page for AI.
2. **Headings shaped like real questions** — "How long does it take?", not "Timings".
3. **An FAQ with proper `FAQPage` markup** — 3+ questions, answers of 40–60 words, each
   understandable on its own without the surrounding page.
4. **Tables** for prices, specifications and turnaround — trivially liftable.
5. **Plain language**, short sentences, jargon defined on first use.

### `llms.txt` and `llms-full.txt`
Two plain-text files at the root of the site, generated from the same data as the sitemap
so they can never drift out of date.

- **`llms.txt`** — a brief for assistants: who you are, what you do, prices, how to book,
  where you work, languages, plus a linked list of every page with a one-line summary.
- **`llms-full.txt`** — the complete text of every page in one file.

### Choosing which assistants may read you
**Admin → AI & GEO** lists every known AI crawler with a switch: GPTBot, OAI-SearchBot,
ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User,
Google-Extended, Applebot-Extended, Amazonbot, meta-externalagent, CCBot, Bytespider.

Blocking the "-Extended" ones removes you from AI answers but does **not** affect your
Google ranking. That is a business decision, so it is a switch rather than a default.

### IndexNow
Tells Bing, Yandex, Seznam and Naver — and the AI search built on Bing — within minutes
that a page changed. It fires automatically after you save (at most once an hour) and
there is a manual button.

**Hard-won notes**, because this was genuinely painful to get working:
- The request must send a **User-Agent**. Without one, Bing answers `403` with no
  explanation.
- Your key file must load at `https://www…/<key>.txt`, return **only** the key, and not
  redirect.
- `UserForbiddedToAccessSite` does **not** mean the key is wrong. It means that exact host
  is not a verified property in Bing Webmaster Tools. Bing treats `example.com` and
  `www.example.com` as different sites — verify the one you actually use, then use the key
  Bing generates for it.
- The admin captures and displays Bing's actual reply, so a failure is diagnosable instead
  of a bare error code.

---

## 6. GEO — being found locally

For "near me" searches. For most local businesses this is where the customers are.

### NAP consistency — the whole game
**N**ame, **A**ddress, **P**hone must be *byte-identical* everywhere: your site footer,
your structured data, Google Business Profile, Bing Places, Apple Business Connect, and
every directory. A single difference — "St" instead of "Street" — can split you into two
entities in Google's index and halve your local visibility.

### On the site
- A **visible** address block in the footer and on the contact page — not just in the
  structured data. Marked up as `<address>`.
- Phone as a tappable `tel:` link, in international format for the structured data and
  readable format for humans.
- **Opening hours** both visible and in `OpeningHoursSpecification`.
- **Areas served** as real text on the page — this site lists 17 — and as `City` objects in
  the structured data, not bare strings.
- A map on the contact page, loaded lazily because maps are heavy.
- Payment methods and price range.

### Admin → Local & Business
Address, latitude and longitude, areas served, nearby cities, opening hours per day,
languages spoken, payments accepted, Google Maps link, and review profile links.

### The trap to avoid
**Do not mass-produce near-identical pages for every town** (`/service-in-townA`,
`/service-in-townB`…). Google calls these doorway pages and penalises them. Instead:
one strong page per service, with genuine local detail inside it, and a separate town page
only where you have something real and distinct to say.

### Off-site, in order of value
1. **Google Business Profile** — the single highest-value local asset. Exact NAP match,
   correct primary category, real photos, hours, services, and replies to reviews.
2. **Bing Places** and **Apple Business Connect**.
3. Consistent listings in the handful of directories that matter in your trade.

Reviews are the strongest ranking factor you do not control. Ask real customers; never
fabricate them, and never mark up a rating you invented.

---

## 7. The checks that keep it working

A suite of 23 automated scripts runs before any release. They exist because each one
caught a real bug.

| Check | What it proves |
|---|---|
| Responsive matrix | 7 pages × 11 screen widths (320–1920): nothing overflows, every tap target ≥44px, no form field under 16px (which makes iPhones zoom) |
| h1 visibility | Exactly one **visible** `<h1>` per page, at load *and* after JavaScript |
| Sticky | The menu bar and side panels stay put on desktop, flow normally on mobile |
| No-JavaScript | Every page renders fully with scripts off — what AI crawlers read |
| Parity | The server copy and the JavaScript copy say the same thing |
| Round-trip | Editing a page through the editor never loses a word |
| Security | 55 checks: login, enquiry form, uploads, headers, private files |
| Click-through | A real booking reaches the inbox and the Leads tab |
| Structured data | The JSON-LD is byte-identical unless you meant to change it |

**Green looks like this:** 0 responsive findings · one visible h1 everywhere ·
parity 25/25 · clusters 34/34 · round-trip 32/32 · security 55/55 · no CSP violations ·
SEO Health 100.

---

### Three rules worth remembering

1. **If it is not in the server HTML, AI assistants cannot see it.**
2. **One address per page**, or search engines count the same page several times.
3. **Never invent a price, a warranty, a credential or a review.** Everything published
   must come from the business owner.
