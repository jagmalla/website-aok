# Deploying Analysis of Karma to A2 Hosting

This is a single-page website (`index.html`) backed by a small PHP + MySQL
API for saving your content, handling the contact form, and storing uploaded
images. Follow these steps once to go live.

---

## What's in this folder

| File / folder        | What it does                                                        |
|----------------------|---------------------------------------------------------------------|
| `index.html`         | The whole website (loads in any browser).                           |
| `assets/logo.png`    | Your logo.                                                          |
| `uploads/`           | Where photos you upload in the admin are stored.                    |
| `api/config.php`     | **Your database + email settings — you must edit this.**            |
| `api/db.php`         | Database connection + shared helpers.                              |
| `api/data.php`       | Saves/loads all your site content to MySQL.                        |
| `api/contact.php`    | Emails contact-form messages to you and logs them.                 |
| `api/test-email.php` | Sends a test email (used by the admin's "Send test email" button).  |
| `api/upload.php`     | Receives uploaded photos and stores them in `uploads/`.            |
| `install.php`        | Run **once** to create the database tables, then delete it.         |
| `.htaccess`          | Apache rules (routing, compression, security).                     |
| `sitemap.xml`, `robots.txt` | Help search engines find your pages.                        |

---

## Step 1 — Create a MySQL database

1. Log in to your A2 Hosting **cPanel**.
2. Open **MySQL® Databases**.
3. Under *Create New Database*, enter a name (e.g. `analysisofkarma`) and click **Create Database**.
4. Under *MySQL Users → Add New User*, create a user and a strong password. **Write these down.**
5. Under *Add User To Database*, select your user + database, click **Add**, then tick **ALL PRIVILEGES** and **Make Changes**.

> A2 usually prefixes names with your cPanel account, e.g. `cpaneluser_analysisofkarma`
> and `cpaneluser_dbuser`. Use the full prefixed names.

---

## Step 2 — Edit `api/config.php`

Open `api/config.php` and fill in the four database values from Step 1, plus your email:

```php
define('DB_HOST', 'localhost');                 // A2 uses localhost
define('DB_NAME', 'cpaneluser_analysisofkarma');
define('DB_USER', 'cpaneluser_dbuser');
define('DB_PASS', 'the-password-you-set');

define('MAIL_TO',   'analysisofkarma@gmail.com'); // fallback recipient
define('MAIL_FROM', 'noreply@analysisofkarma.com'); // fallback From (an address on YOUR domain)

define('ALLOWED_ORIGIN', 'https://www.analysisofkarma.com'); // your live domain
```

> **You don't have to get the email exactly right here.** `MAIL_TO` and `MAIL_FROM`
> are just *fallback* defaults. Once the site is live you can set the recipient and
> the From address — and send a **test email** — directly in
> **Admin → Settings → Email settings** (see Step 5b). No file editing needed.

> **Tip:** For best delivery, create `noreply@analysisofkarma.com` as a real
> mailbox/forwarder in cPanel → *Email Accounts*, and use it as your From address.
> Sending "from" a Gmail address you don't control on the server can land in spam.

---

## Step 3 — Upload the files

Using cPanel **File Manager** (or FTP/SFTP), upload **everything in this folder**
into your domain's web root — usually `public_html/`:

```
public_html/
├── index.html
├── .htaccess
├── install.php
├── sitemap.xml
├── robots.txt
├── assets/
├── uploads/
└── api/
```

Make sure the **`uploads/` folder is writable** (permissions `755`, which is the default).

---

## Step 4 — Create the database tables

1. In your browser, visit:
   `https://www.analysisofkarma.com/install.php`
2. It will tell you to add a key. Visit the URL it shows
   (`install.php?key=setup_xxxxxxxx`).
3. You should see **"Tables created successfully."**
4. **Delete `install.php`** from the server (File Manager → right-click → Delete).
   Leaving it up is a security risk.

---

## Step 5 — Go live & log in

1. Visit `https://www.analysisofkarma.com` — your site is live.
2. Go to `https://www.analysisofkarma.com/#admin` to open the admin panel.
3. Log in with the default password **`admin123`**.
4. **Immediately change it:** Admin → **Settings → Security → Admin password**, then
   click **Save changes**.

Everything you edit in the admin (text, photos, services, blog posts, SEO, etc.)
is now saved to your MySQL database, so it persists across devices and visitors.

### Step 5b — Set up and test email

1. In the admin, open **Settings → Email settings**.
2. **Send enquiries to** — the address where you want to receive contact-form messages.
3. **From address** — ideally an address on your own domain (e.g. `noreply@analysisofkarma.com`).
4. Click **Save changes**.
5. Click **✉ Send test email**. Within a minute you should receive a test message at the
   recipient address (check the spam folder too).
   - **Got it?** Email is working. 🎉
   - **"mail() failed to send"?** Your host may need PHP mail enabled — contact A2 support,
     or switch the From address to one on your own domain.
   - **Nothing arrives but no error?** Almost always a spam filter or a From address that
     isn't on your domain. Fix the From address and test again.

---

## Step 6 — Submit to search engines (optional but recommended)

Your **sitemap is dynamic** — `https://yourdomain.com/sitemap.xml` is generated live
from the database every time it's requested, so it **always** lists every current page
plus all **published blog posts** (e.g. `/blog/your-post-slug`). You never have to
regenerate it manually when you add or remove pages/posts.

In the admin, open **Search Engines** to:
- See the live sitemap and the current URL count (pages + posts).
- **↻ Update sitemap now** — writes a static backup copy and confirms the count.
- **Auto-update** — optionally refresh the backup daily / weekly / monthly.

Then submit it **once**:
- **Google Search Console** — verify your domain, submit `https://yourdomain.com/sitemap.xml`.
- **Bing Webmaster Tools** — same.

Because the sitemap is dynamic, Google/Bing re-read it on every crawl — new posts and
pages appear automatically, no resubmission needed.

> The dynamic sitemap relies on Apache `mod_rewrite` (the same module that powers the
> site's clean URLs). It's enabled by default on A2 Hosting.

---

## How it works (plain English)

- **Your content** lives in MySQL (table `aok_site_data`). When you edit the site
  in the admin, it saves to your browser instantly *and* pushes to the database a
  moment later. When anyone opens the site, it loads the latest from the database.
- **Contact form** submissions are emailed to your `MAIL_TO` address via PHP and
  also stored (table `aok_leads`) so you never lose one. The form has a math
  captcha, a honeypot, and a 30-second cooldown to block spam bots.
- **Uploaded photos** are saved as real image files in `uploads/` and referenced
  by URL — so large images never overflow browser storage.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blank page | Check the browser console. Ensure `index.html` is at the web root and React CDN isn't blocked. |
| "Tables" error on install | Re-check the 4 DB values in `api/config.php`. The user must have ALL PRIVILEGES. |
| Edits don't persist across devices | Open `https://yoursite/api/data.php` directly — it should return JSON, not a PHP error. If it errors, fix DB config. |
| Contact emails not arriving | Use **Settings → Email settings → Send test email** to diagnose. Check spam, use a From address on your own domain, and confirm A2 has `mail()` enabled. |
| Photo upload fails | Ensure `uploads/` exists and is writable (755). Max size is 5 MB (set in `config.php`). |
| Want a different admin password | Admin → Settings → Security, then Save. |

---

## Updating the site later

Just edit content through the admin panel — no re-deploy needed. If you ever change
`index.html` itself, re-upload that one file. Your database content is untouched.
