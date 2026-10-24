# Deploying Analysis of Karma to A2 Hosting

The website is a page template (`index.html`) plus a plain-JavaScript app
(`assets/app.js`), with a small PHP + MySQL backend that saves your content,
handles the contact form and stores uploaded photos. Every page is also built on
the server (`render.php`), so Google and AI assistants read your real content.
There is no build step: you upload files with cPanel File Manager.

- **Your site is already live?** Follow **[Part A — Upgrade the live site](#part-a--upgrade-the-live-site)**.
- **Setting up on a new server?** Follow **[Part B — Fresh install](#part-b--fresh-install)**.

Either way, finish with **[Part C — Verify the upload](#part-c--verify-the-upload)**.

---

## What's in this folder

| File / folder | What it does |
|---|---|
| `index.html` | The page template (head, styles, script tags). |
| `render.php` | Builds every page on the server: title, description, structured data, real content, 404s and redirects. |
| `.htaccess` | Apache rules: https + www, clean URLs, private files, caching, security headers. |
| `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` | Static backups (made by `tools/build-static.php`). The live versions are generated from your admin settings by `api/robots.php`, `api/sitemap.php` and `api/llms.php`. |
| `assets/app.js` | The website application (all pages, the visual editor and the admin). |
| `assets/hero3d.js` | The 3D hero scene (loads after the page; skipped on data-saver connections). |
| `assets/*.webp, *.png, *.jpg` | Logo, favicons and the social-sharing image. |
| `assets/img/` | `services/`: the 3D Pearl & Gold banner of each of the 16 service pages; `posts/`: the branded image of each blog post (16:9, 4:3 and 1:1). Used on the pages, in Google's structured data and in social previews when you haven't uploaded an image for that page. |
| `uploads/` | Photos you upload in the admin. Must be writable. Its own `.htaccess` stops anything there from running as a program. |
| `assets/vendor/three-0.160.0/` | The 3D library for the hero (from the official `three` package, version 0.160.0), served from your own site instead of a public CDN. |
| `api/leads.php` | Admin → Leads: the contact-form enquiries, kept in their own database table. |
| `api/config.sample.php` | Template for **`api/config.php`** (your database and email settings). Only used on a fresh install. |
| `api/db.php` | Database connection and shared helpers (admin session, CSRF, table setup). |
| `api/auth.php` | Admin login: hashed password, lockout after repeated failures. Creates the database tables on first login. |
| `api/data.php` | Loads and saves your site content. |
| `api/sync.php` | Runs on every admin save: dates changed services for the sitemap, leaves a 301 behind when a service's address changes or it is deleted or unpublished, and queues the changed pages for IndexNow (sent at most every 10 minutes, after the response, on the live domain only). |
| `api/discovery-lib.php` | Builds `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt`; after every save it also rewrites the copies in the web root when they changed (so they are current even under the old `.htaccess`). |
| `api/upgrades.php` | One-time content upgrade of the saved site (expanded FAQ answers, shorter SEO texts, the 5 duplicate merges; your business details and the in-depth content for all 32 pages). Runs by itself on the first page view after upload. |
| `api/content/` | The page text of the 16 services (`services/<page address>.md`, from the Services specification) and the classical sections of the 16 blog posts (`posts/`). Applied to your pages by the upgrade; `v3/` only lets the upgrade recognise the earlier sections. Not reachable from the web. |
| `api/upgrade-content.php` | The **Apply Full 32-Page Classical Content Upgrade** button in Admin → SEO Health. |
| `api/seo-lib.php`, `api/defaults.json` | The SEO engine and the default content it falls back to. |
| `api/robots.php`, `api/sitemap.php`, `api/llms.php`, `api/indexnow.php` | Live `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` and IndexNow. |
| `api/seo-health.php` | Admin → SEO Health, including the post-upload server checks. |
| `api/contact.php`, `api/test-email.php`, `api/upload.php`, `api/health.php` | Contact form, test email, photo uploads, database diagnostic. |
| `api/reset-password.php` | The page the "Forgot password?" email links to. |

> **Email addresses are private.** Contact-form enquiries go to the inbox in Admin → Settings (default
> `AOK_CONTACT_EMAIL` in `api/db.php`), and reset links to `AOK_RECOVERY_EMAIL`. Neither address is shown
> anywhere on the website, in the structured data or in llms.txt, so spam bots can't collect them.
| `tools/`, `DEPLOY.md`, `HOW-TO-UPDATE.txt` | For you and developers; not needed on the server (blocked by `.htaccess`). |

> There is **no `api/config.php` in this folder**, on purpose. Your live one stays on
> the server, so uploading an update can never overwrite your database settings.

---

## Part A — Upgrade the live site

This release adds server-side rendering, local-SEO and AI settings, and fixes a
security issue. Your content, photos, leads and password all carry over.

> ⚠️ **Security note.** Until now the public data file (`/api/data.php`) also
> contained the admin password and the contact-form leads (names, emails, birth
> details). After this upgrade both are private. **Change your admin password
> after upgrading**, because the old one was publicly readable.

### A1 — Back up (5 minutes)

- [ ] cPanel → **File Manager** → `public_html` → **Settings** (top right) → tick
      **Show Hidden Files (dotfiles)** → **Save**.
- [ ] Right-click **`.htaccess`** → **Download**. (If there is none, skip this.)
- [ ] Open `api/`, right-click **`config.php`** → **Download**.
- [ ] In your admin: **Settings → Backup → Export content**.
- [ ] Keep your current admin password at hand. You will log in with it.

### A2 — Upload the files

In File Manager, open each folder below, click **Upload**, tick
**Overwrite existing files**, and drag in exactly these files:

| Open this folder | Upload these files |
|---|---|
| `public_html/` | `index.html` · `render.php` · `robots.txt` · `sitemap.xml` · `llms.txt` · `llms-full.txt` — **not `.htaccess` yet** |
| `public_html/assets/` | `app.js` · `hero3d.js` · `og-image.jpg` · `logo-192.webp` · `logo-512.webp` · `logo-512.png` · `favicon-32.png` · `favicon-48.png` · `apple-touch-icon.png` |
| `public_html/api/` | `auth.php` · `data.php` · `db.php` · `defaults.json` · `discovery-lib.php` · `sync.php` · `leads.php` · `health.php` · `indexnow.php` · `llms.php` · `robots.php` · `seo-health.php` · `seo-lib.php` · `sitemap.php` · `test-email.php` · `upload.php` · `upgrades.php` · `upgrade-content.php` · `reset-password.php` · `contact.php` · `config.sample.php` |
| `public_html/api/content/` | the folders `services/`, `posts/` and `v3/` with all their `.md` files (48 files) |
| `public_html/assets/img/` | the folders `services/` and `posts/` with all their images (160 files). Delete the old `assets/img/services/` folder first: the service images have new names. |
| `public_html/assets/vendor/` | the folder `three-0.160.0/` (the 3D library, now served from your own site) |
| `public_html/uploads/` | `.htaccess` (a hidden file: turn on **Show Hidden Files**). It stops anything in `uploads/` from running as a program. Leave your photos as they are. |

> **Tip for the two folders:** zip `api/content` and `assets/img` on your computer,
> upload each zip into its parent folder (`public_html/api/`, `public_html/assets/`),
> then right-click the zip → **Extract** and delete the zip. File Manager keeps the
> folder structure that way.

- Keep `assets/logo.png`, `api/config.php` and the `uploads/` folder
  exactly as they are.
- If `public_html/install.php` exists from an earlier setup, **delete it**. It is no
  longer used.

### A3 — Upload `.htaccess` last

- [ ] Open the new `.htaccess` in a text editor. If your **old** one had lines between
      `# php -- BEGIN cPanel-generated handler` and
      `# php -- END cPanel-generated handler`, paste those lines into the marked block
      at the top of the new file and save it.
- [ ] Upload it to `public_html/` (Overwrite).

### A4 — Log in and secure the admin

- [ ] Go to **`https://www.analysisofkarma.com/admin`** and log in with your
      **current** password. Nothing is reset and you are not locked out.
- [ ] You are asked to **choose a new password** (10+ characters) before anything else.
      This happens once: the old website made its password readable, so it can't be
      trusted. Saving it signs every other device out.
- [ ] **Admin → SEO Health → Security** should show no failures. If it lists "saved texts
      contain code", open those places and delete the code.

### A5 — Run the post-upload check

Do **[Part C](#part-c--verify-the-upload)** now. The content upgrade has already run
by itself on the first page view (nothing to click):

- the 7 short FAQ answers are expanded to 45–55 words;
- the `/services` and `/faq` titles and the `/meditation` description are shortened;
- the 3 duplicate services and 2 duplicate posts are merged into their main page with
  a 301 redirect. Their text was added to the main page, and they stay in
  **Admin → Redirects** under "Merged & canonical items", where **Undo** restores any of them;
- your business details are filled in where they were empty or still as first shipped:
  phone & WhatsApp +1 (236) 660-2000, hours (Mon–Sun 10:00–20:00 Pacific), the 17
  service areas, Google Business categories, languages (English, Hindi, Punjabi), the
  Google Maps and Trustpilot review links, your 9 social profiles and the practitioner
  profile;
- all 16 services and 16 blog posts get their in-depth classical sections (direct
  answer, methodology and texts, chart factors, how a consultation works, FAQs,
  remedies), added **after** your existing text.

Text you had edited yourself is never replaced. When the "Server setup" group is all
green, SEO Health should show 100:

- [ ] If SEO Health says some pages "don't have the classical content sections yet",
      those are pages you had edited. Click **Apply Full 32-Page Classical Content
      Upgrade** at the top of SEO Health: your text stays and the sections are added
      after it.
- [ ] **Local & Business** and **Practitioner:** check the details (phone, hours, areas,
      categories, links) match your Google Business Profile. **Save.**
- [ ] **AI & GEO → Search engine verification:** paste the codes from Google Search
      Console (`google-site-verification`) and Bing Webmaster Tools (`msvalidate.01`) if
      you verify with an HTML tag. **Save.**
- [ ] Hard-refresh the site (Ctrl+Shift+R / Cmd+Shift+R) and browse a few pages.
- [ ] In **Google Search Console** and **Bing Webmaster Tools**, resubmit
      `https://www.analysisofkarma.com/sitemap.xml` once.

**If anything goes wrong:** put your old `.htaccess` back (or rename the new one to
`.htaccess-off`). The site keeps working as before, with the admin at `/#admin`.

---

## Part B — Fresh install

**B1 — Create a MySQL database.** cPanel → **MySQL® Databases**:
1. Create a database (e.g. `analysisofkarma`).
2. Create a user with a strong password.
3. Under **Add User To Database**, add the user and tick **ALL PRIVILEGES**.

A2 prefixes names with your cPanel account, e.g. `cpaneluser_analysisofkarma`. Use
the full names.

**B2 — Create `api/config.php`.** Copy `api/config.sample.php` to
`api/config.php` and fill in:

```php
define('DB_HOST', 'localhost');                    // A2 uses localhost
define('DB_NAME', 'cpaneluser_analysisofkarma');
define('DB_USER', 'cpaneluser_dbuser');
define('DB_PASS', 'the-password-you-set');
define('MAIL_TO',   'analysisofkarma@gmail.com');   // fallback recipient
define('MAIL_FROM', 'noreply@analysisofkarma.com'); // an address on YOUR domain
define('ALLOWED_ORIGIN', 'https://www.analysisofkarma.com');
```

**B3 — Upload everything** in this folder to `public_html/`, except `tools/`,
`DEPLOY.md` and `HOW-TO-UPDATE.txt`. Upload `.htaccess` last; it is a hidden file, so
turn on **Show Hidden Files**. Make sure `uploads/` exists with permissions `755`.

**B4 — Set your password and log in.** There is no default password. Open
`https://www.analysisofkarma.com/admin` and click **Forgot password?**: a one-time link
goes to the owner's private recovery address. Open it, choose a password (10+ characters),
then log in. The database tables are created automatically; there is no install script.
(No email yet? See "Forgot the admin password" under Troubleshooting.)

**B5 — Email.** Go to **Settings → Email settings**. Set the recipient and a From
address on your own domain, **Save**, then click **✉ Send test email**. If nothing
arrives, check spam and the From address; if you see "mail() failed", ask A2 support
to enable PHP mail.

**B6 — Verify** with **[Part C](#part-c--verify-the-upload)**, then submit
`https://www.analysisofkarma.com/sitemap.xml` in Google Search Console and Bing
Webmaster Tools.

---

## Part C — Verify the upload

Open **Admin → SEO Health**. The first group, **"Server setup (after upload)"**, is
checked live on your server. The server requests its own public pages and tests
real file writes:

| Check | If it's red |
|---|---|
| PHP version | cPanel → **MultiPHP Manager** → choose PHP 7.4 or newer (8.x recommended). |
| `.htaccess` is the new version | Upload the new `.htaccess` (Show Hidden Files). |
| All site files are in place | Upload the files it names. |
| robots.txt / sitemap.xml / llms.txt are generated live | `.htaccess` isn't active. Check it's in `public_html/` and the handler block is right. |
| Pages are rendered on the server | Same as above; also check `render.php` is uploaded. |
| Unknown addresses return a real 404 · `/index.html` redirects | Same as above. |
| Database settings / private files are blocked | Same as above. |
| http:// and non-www redirect to https://www | cPanel → **SSL/TLS Status**: make sure the certificate covers both `analysisofkarma.com` and `www.analysisofkarma.com`. |
| uploads/ is writable | File Manager → `uploads` → **Permissions** → `755`. |
| Sitemap backup copy can be saved | Set `sitemap-static.xml` to `644`. The live sitemap works either way. |
| PHP sessions can be stored | Ask A2 support to check `session.save_path`. |
| Database accepts writes | cPanel → MySQL Databases → give the user **ALL PRIVILEGES**. |
| install.php is still on the server | Delete it. |

If your host blocks a server from requesting its own pages, the group shows one
grey ⓘ note instead. The admin then runs the same checks from your browser, under
**"Crawl files"**.

The rest of SEO Health (titles, structured data, local details, content) is your
ongoing to-do list. "Fix →" opens the right admin tab.

---

## How it works (plain English)

- **Your content** lives in MySQL (table `aok_site_data`). The admin saves it there,
  and every page is built from it, both on the server for search engines and in the
  browser for visitors.
- **Contact form** messages are emailed to you and stored in `aok_leads` (their own
  table, never in the page data). Only you can see them, in **Admin → Leads**. The
  server checks the verification question, a hidden spam trap, the time taken and
  how often one visitor writes (5 per 10 minutes, 20 a day).
- **Uploaded photos** are saved as image files in `uploads/`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blank page | Check the browser console. `index.html` and `assets/app.js` must both be uploaded. |
| "api/config.php is missing" / database errors | Part B2: create `api/config.php` from `api/config.sample.php`. The user needs ALL PRIVILEGES. Logged in? `https://yoursite/api/health.php` shows a database diagnosis. |
| Edits don't persist across devices | Admin → SEO Health → "Database accepts writes". |
| Contact emails not arriving | **Settings → Email settings → Send test email**; use a From address on your own domain. |
| Photo upload fails | `uploads/` must exist and be writable (755). Max size is 5 MB (`MAX_UPLOAD_MB` in `config.php`). |
| "Too many attempts" at login | 8 wrong passwords lock that connection for 15 minutes. Wait, or use **Forgot password?** (a reset clears the lock). |
| Forgot the admin password | On the login screen click **Forgot password?**. A one-time link (valid 30 minutes) is emailed to the owner's recovery address, set as `AOK_RECOVERY_EMAIL` in `api/db.php`. If email isn't working: in cPanel → File Manager add `define('ADMIN_SETUP_PASSWORD', 'a temporary password of 10+ characters');` to `api/config.php`, then cPanel → phpMyAdmin → table `aok_auth` → **Empty**. Log in with that temporary password, choose your own when asked, then delete the line from `config.php`. |
| "Choose a new admin password" after logging in | Expected once after the security update: the old website made its password readable. Pick a new one (10+ characters); every other device is signed out. |
| Email "new admin sign-in" | Sent when the admin is opened from a new device or network. If it wasn't you, click **Forgot password?** and choose a new password at once. |
| Google sees no content / pages 404 | `.htaccess` or `render.php` missing. See Part C. |
| Site broke right after uploading `.htaccess` | Put the old `.htaccess` back (admin at `/#admin`), then check the PHP handler lines at the top. |

---

## Updating the site later

Content changes are made in the admin; nothing to upload. For a code update, upload
only the files that update lists, then run Part C. `api/config.php` and your database
are never touched.

### For developers

- No build step. `assets/app.js` is plain JavaScript (React 18 UMD, `React.createElement`).
- After changing default content in `assets/app.js`, run `node tools/build-defaults.js`
  to refresh `api/defaults.json` (the server's copy of the defaults).
- After content changes, run `php tools/build-static.php` to refresh the static
  `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt` backups.
- Long-form sections live in `api/content/services/<slug>.md` and
  `api/content/posts/<slug>.md` (light Markdown: `##`, `###`, `-`, `1.`, `> ` answer box,
  `**bold**`). `python3 tools/content-stats.py` checks word counts, the 45–55-word answer
  boxes and the 40–55-word FAQ answers. New sections reach saved sites through
  `api/upgrades.php` (raise `AOK_CONTENT_VERSION`) or the SEO Health button.
- `node tools/build-images.js [slug …]` renders the branded blog-post images into `assets/img/posts/`, and
  `node tools/build-service-banners.js [address …]` the 3D service banners into `assets/img/services/`
  (both need Playwright and Python Pillow). Service page addresses are set in `serviceRoute()` in `assets/app.js`.
- Rules that exist on both sides (slugs, titles, topic-cluster links, service areas)
  are mirrored in `api/seo-lib.php` and `assets/app.js`. Change them together.
- `render.php` adds `?v=<file time>` to `/assets/*.js` automatically, so browsers
  always load the newest scripts.
