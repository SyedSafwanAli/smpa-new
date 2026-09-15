# Static se Dynamic: PHP Rebuild ka Plan

**Sindh Master Plan Authority — Portal**

Maujooda portal 21 static HTML pages par chalta hai jinme teenon zubanein `data-sd` / `data-ur`
attributes ki soorat me mojood hain aur JavaScript unhein swap karta hai. Yeh plan usay PHP aur
MySQL par le jata hai — design, CSS aur trilingual content bilkul zaya kiye baghair.

| | |
|---|---|
| Pages | 21 |
| Zubanein | 3 — English / سنڌي / اردو |
| CSS | ~3,560 lines (waise hi rahegi) |
| Stack | PHP 8.2+ / MySQL 8 |

---

## Fehrist

1. [Zubaan ka nizam](#1-zubaan-ka-nizam-client-side-se-server-side)
2. [Stack aur folder structure](#2-stack-aur-folder-structure)
3. [Database schema](#3-database-schema)
4. [Admin panel](#4-admin-panel)
5. [Citizen services](#5-citizen-services)
6. [Purana content database me](#6-purana-content-database-me)
7. [URLs, redirects aur SEO](#7-urls-redirects-aur-seo)
8. [Security](#8-security)
9. [Phases](#9-kaam-kis-tarteeb-se-hoga)
10. [Faisle jo aap se chahiye](#10-faisle-jo-aap-se-chahiye)

---

## 1. Zubaan ka nizam: client-side se server-side

Yeh is poore kaam ka sab se ahem hissa hai, aur isi se baqi har cheez tay hoti hai. Abhi har page
teenon zubanein ek saath bhejta hai aur browser me `lang.js` `textContent` badal kar zubaan switch
karta hai. PHP par aakar yeh kaam server par hona chahiye.

### Abhi

English markup me, Sindhi aur Urdu `data-sd` / `data-ur` me. Har page teenon versions bhejta hai.
Google sirf English index karta hai. JS band ho to sirf English. Aur jis element par translation ho
us ke andar koi child element nahi aa sakta — warna switch par woh gayab.

### PHP ke baad

Server ek waqt me ek hi zubaan render karta hai. `<html lang dir>` aur Bootstrap ki LTR/RTL sheet
dono server par tay. Page ka wazan teesra hissa. Teen alag indexable versions. JS ki koi zaroorat
nahi. Aur translated text ke andar `<strong>` ya link aa sakta hai — **woh purani pabandi khatam**.

### URL me zubaan

Zubaan URL ka hissa banegi, cookie ya session ka nahi — taake har zubaan ka apna share-able aur
indexable pata ho:

| Zubaan | Misaal | dir | Font |
|---|---|---|---|
| English | `/en/master-plans` | ltr | Inter + Merriweather |
| سنڌي | `/sd/master-plans` | rtl | Noto Naskh Arabic |
| اردو | `/ur/master-plans` | rtl | Noto Nastaliq Urdu |

Slug teenon zubanon me aik hi rahega (`master-plans`), sirf prefix badlega. Is se language switch
aasan hai: mojooda page ka prefix badal do. Aur `/` par pehli baar aane wale ko browser ki
`Accept-Language` dekh kar redirect, phir uska intikhab cookie me yaad.

### Content aur chrome — do alag jagahein

- **Content** (khabrein, officers ke naam, notification ka subject) database me, teen columns me.
- **UI chrome** ("Read More", "Home", "Download", form ke labels) PHP lang files me —
  `lang/en.php`, `lang/sd.php`, `lang/ur.php`. Yeh developer ki cheez hai, admin ko ise chhune ki
  zaroorat nahi.

---

## 2. Stack aur folder structure

Government hosting aksar cPanel shared hosting hoti hai, jahan Laravel jaisa framework chalana
mushkil ho sakta hai (doc root, composer, SSH). Is liye mera mashwara hai: **plain PHP 8 + PDO +
ek chhota router**. Composer sirf autoload aur do-teen libraries ke liye. Yeh kahin bhi deploy ho
jata hai aur code parhne me seedha rehta hai.

| Cheez | Intikhab | Kyun |
|---|---|---|
| Language | PHP 8.2+ | Typed properties, enums, match — code saaf rehta hai |
| Database | MySQL 8 / MariaDB 10.6+ | utf8mb4 — Sindhi aur Urdu ke liye lazmi |
| DB access | PDO, prepared | SQL injection ka darwaza band |
| Templates | Plain PHP views | Maujooda HTML seedha paste ho jata hai |
| Mail | PHPMailer | Complaint ki receipt aur admin alerts |
| Images | GD / Intervention | Upload par resize + WebP + EXIF strip |

```
smpa/
├── public/              ← document root, sirf yeh web se dikhe
│   ├── index.php          front controller
│   ├── css/ js/ images/   mojooda assets, jyun ke tyun
│   └── uploads/           public media (resized)
├── app/
│   ├── Core/              Router, Db, Lang, View, Auth, Csrf, Upload
│   ├── Models/            News, Officer, Notification, Law, Fee …
│   ├── Controllers/       public site
│   ├── Admin/             admin panel controllers
│   └── Views/
│       ├── layout/        header.php, nav.php, footer.php
│       ├── pages/         har page ka template
│       └── admin/
├── lang/                en.php, sd.php, ur.php — UI strings
├── storage/             logs, private uploads, backups
├── database/            schema.sql, migrations/, seeds/
└── .env                 DB credentials, mail, app key
```

> **Jo waise hi rahega**
> `css/style.css` ki poori 3,560 lines bilkul nahi badlengi. `partials/header.html` aur
> `partials/footer.html` `app/Views/layout/` me PHP includes ban jayenge, aur `tools/build.js` ki
> zaroorat khatam — PHP har request par khud include kar lega. Design, rang, spacing, RTL
> mirroring: sab jaisa hai waisa.

---

## 3. Database schema

### Trilingual columns, alag table nahi

Do tareeqe hote hain: har zubaan ke liye alag row wali `translations` table, ya har field ke teen
columns. Hamare paas **bilkul teen, tay-shuda zubanein** hain — chauthi kabhi nahi aayegi. Is liye
columns behtar hain: koi join nahi, ek row me poora record, aur admin form bilkul 1:1 map hota hai.

| Column | Value |
|---|---|
| `title_en` | Karachi Strategic Development Plan – 2020 |
| `title_sd` | ڪراچي اسٽريٽيجڪ ڊولپمينٽ پلان – 2020 |
| `title_ur` | کراچی اسٹریٹجک ڈویلپمنٹ پلان – 2020 |

Fallback ka usool: agar `_sd` khali ho to `_en` dikhao, aur admin list me usay "translation
missing" mark karo — taake adhoora content chup-chaap English me na chalta rahe.

> **Pehle liya gaya faisla**
> Qanoon ke naam (*Sindh Building Control Ordinance, 1979*) aur notification reference
> (`SO(G)/HTP/SBCA/7-63/2018`) tarjuma nahi hote — woh jaise shaya hue hain waise rehte hain. Is
> liye `laws.title` aur `notifications.ref_no` single column hain, lekin `scope` aur `subject`
> trilingual.

### Content tables

`*` ka matlab teen columns — `_en`, `_sd`, `_ur`.

| Table | Ahem columns | Kis page par |
|---|---|---|
| `pages` | slug, template, title_*, meta_desc_*, status | Har content page ka record |
| `page_sections` | page_id, sort, kind, heading_*, body_* | About, History ka narrative, Vision pillars |
| `news` | slug, category, title_*, standfirst_*, body_*, cover_id, published_at, status | Latest News, Press Releases, article |
| `news_gallery` | news_id, media_id, caption_*, sort | Article ki tasveerein |
| `notifications` | ref_no, issued_on, issuer_*, subject_*, media_id | Notifications, History |
| `laws` | title, kind, year, scope_*, media_id, sort | Laws |
| `legislation_rows` | sort, main_laws, parallel_laws, note_* | Laws ka Main/Parallel table |
| `master_plans` | title_*, year_label, cover_id, sort | Master Plans |
| `land_use_maps` | title_*, year_label, media_id, sort | Master Plans |
| `directorates` | name_*, parent_id, head_officer_id, sort | Organogram |
| `officers` | name_*, designation_*, directorate_id, photo_id, phone, email, is_chain, sort | Directory, Management |
| `offices` | name_*, type, address_*, phone, email, timings_*, map_url | Offices |
| `permit_types` | title_*, description_*, sort | Permits |
| `procedures` | title_*, media_id, sort | Permits |
| `fees` | permit_type_id, scope_*, rate_value, rate_unit_*, effective_from | Fee schedule |
| `reports` | title_*, category, published_on, media_id | Reports |
| `projects` | title_*, status, city, year_from, year_to, summary_*, cover_id | Projects & Studies |
| `downloads` | title_*, category, media_id, sort | Downloads & Forms |
| `tenders` | ref_no, title_*, published_on, closing_on, media_id | Tenders |
| `careers` | position_*, grade, vacancies, closing_on, media_id | Careers |
| `ticker` | text_*, link, starts_on, ends_on, active | Homepage ki chalti patti |
| `menu_items` | parent_id, label_*, target, sort, visible | Nav — code me hard-code nahi |
| `settings` | key, value_* | Pata, phone, email, timings, social, copyright |

### System tables

| Table | Ahem columns | Kaam |
|---|---|---|
| `media` | path, mime, size, width, height, alt_*, uploaded_by | Ek media library, har jagah isi se |
| `users` | name, email, password_hash, role, active, last_login_at | Admin accounts |
| `audit_log` | user_id, entity, entity_id, action, before_json, after_json, ip | Kis ne kya badla — sarkari portal ke liye lazmi |
| `complaints` | tracking_no, name, cnic, phone, email, category, location, description, attachment_id, status | Online Complaint |
| `complaint_updates` | complaint_id, status, remarks, user_id | Shikayat ki peshraft |

---

## 4. Admin panel

Admin `/admin` par, login ke peechhe. Har content table ka apna module: list → add/edit → sort →
publish. Dashboard par woh cheezein jo tawajjo mangti hain — draft me atke items, adhoore tarjume,
band hone wale tenders, nayi shikayaat.

### Trilingual editor

Har field group ke teen tabs: **ENG · سنڌي · اردو**. Sindhi aur Urdu tabs par editor khud RTL ho
jata hai aur sahi font load karta hai. Tab par ek chhota nishan batata hai ke us zubaan ke kitne
field bhare hain. Save par teenon ek saath jate hain.

### Roles

| Role | Kya kar sakta hai |
|---|---|
| Super Admin | Sab kuchh, plus users aur settings |
| Publisher | Content banaye, edit kare, aur publish kare |
| Editor | Draft banaye aur edit kare — publish na kar sake |

Har record ka status: `draft` → `in_review` → `published`. Har tabdeeli `audit_log` me — kis ne,
kab, kya, kahan se.

> **Faisla darkar** — Kya aap ko yeh teen-qadmi approval chahiye, ya seedha publish? Chhoti team
> ho to Editor/Publisher ka farq ghair-zaroori bojh ban jata hai.

---

## 5. Citizen services

Yeh woh paanch links hain jo abhi topbar me `href="#"` hain. Teen sirf listing hain — woh schema me
pehle se maujood hain. Do asli system hain:

### Online Complaint

- Form: naam, CNIC, phone, email, qism, ilaqa, tafseel, ek attachment.
- Submit par **tracking number** (misaal: `SMPA-2026-00418`) aur email/SMS par receipt.
- Alag "Track your complaint" page — tracking number + phone se maujooda halat.
- Admin me: assign, status badalna, remarks — har qadam shikayat karne wale ko nazar aata hai.
- Spam rok: honeypot + timing check + rate limit. Captcha tab jab zaroorat pare.

### Land File Status

> **Faisla darkar — sab se bara sawal**
> Yeh aik lookup hai kisi *maujooda* record system me. Mujhe jaanna hoga ke woh data kahan hai:
> kisi purane software ke database me, Excel files me, ya kahin API mojood hai? Teen mumkin raste —
> (a) us DB se seedha read-only connection, (b) rozana CSV/Excel import, (c) admin me manual entry.
> Jawab se is hisse ka scope poora badal jata hai.

### Downloads & Forms, Tenders, Careers

Teenon aik hi shakl ke hain: file + unwan + tareekh + category. `downloads`, `tenders`, `careers`
tables pehle se schema me hain. Tenders aur Careers me closing date guzarne par khud-ba-khud
"Closed" ho jate hain.

---

## 6. Purana content database me

Yeh hissa aksar bhula diya jata hai aur phir saara trilingual content dobara type karna parta hai.
Us ki zaroorat nahi: **tarjume pehle se HTML me maujood hain.**

Har translated element is shakl me hai:

```html
<h3 data-sd="ڪراچي ڊولپمينٽ پلان – 2000"
    data-ur="کراچی ڈویلپمنٹ پلان – 2000">Karachi Development Plan – 2000</h3>
```

Yani ek hi node par teenon zubanein. Ek `import.php` script jo `DOMDocument` se har page parhe,
har `[data-sd]` node se English `textContent` plus dono attributes uthaye, aur seedha DB me daal
de. Saath hi `content/smpa-content.json` aur `content/who-we-are-content.json`.

> **Is se kya bachta hai**
> Poori History timeline (1968–2022), 9 vision pillars, 8 mission principles, 6 bylaws,
> legislation table, permits ka framework, officers, master plans aur 7 articles — sab teenon
> zubanon me, bina ek lafz dobara likhe.

---

## 7. URLs, redirects aur SEO

Agar purane `.html` pate kisi ne bookmark kiye ya kisi ne link kiye, woh toot-ne nahi chahiye.
`.htaccess` me 301 redirects:

| Purana | Naya |
|---|---|
| `/about.html` | `/en/about` |
| `/master-plans.html` | `/en/master-plans` |
| `/news/gis-technology.html` | `/en/news/gis-technology` |
| `/news/index.html` | `/en/news` |

- Har page par `hreflang` alternates teenon zubanon ke liye, plus `x-default`.
- `sitemap.xml` khud generate ho — teenon zubanein, sirf published records.
- Har page par canonical, aur Open Graph tags us zubaan ke title/description ke saath.
- News article ke liye `NewsArticle` schema.org, aur aik `GovernmentOrganization` block.

---

## 8. Security

- [ ] Har query PDO prepared statement — string concatenation kahin nahi.
- [ ] Har form par CSRF token, per-session, one-time.
- [ ] Password `password_hash()` (Argon2id). Login par rate limit aur 5 ghalat koshishon par lockout.
- [ ] Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`; login par ID regenerate.
- [ ] Upload: extension par nahi, asli MIME sniff par bharosa. PDF/JPG/PNG/WebP whitelist. Tasveer dobara encode ho kar EXIF saaf.
- [ ] Private files webroot se bahar, PHP ke zariye serve — taake permission check lag sake.
- [ ] Output par `htmlspecialchars()`; rich text ke liye HTML Purifier.
- [ ] Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS.
- [ ] Rozana database backup, 30 din retention, aur bahali ka aik test.
- [ ] Admin ka har amal `audit_log` me — IP aur waqt ke saath.

---

## 9. Kaam kis tarteeb se hoga

Har phase apne aap me mukammal hai — har phase ke baad kuchh chalta hua dikhaya ja sakta hai,
aakhir tak intezar nahi karna parta.

**01 — Buniyad**
Schema banao, core likho (Router, Db, Lang, View, Auth), `partials/` ko PHP layout me badlo, aur
**sirf About page** teenon zubanon me DB se chala kar dikhao. Yeh architecture ko sabit kar deta hai.

**02 — Content migration**
`import.php` chalao, saara maujooda trilingual content DB me. Baqi 11 content pages DB se render
hone lagen.

**03 — News system**
Listing, categories, article page, gallery, related posts, homepage grid, aur ticker — sab dynamic.

**04 — Reference data**
Notifications, laws, master plans, maps, officers, organogram, offices, permits, procedures, fees.

**05 — Admin panel**
Login, roles, har module ka CRUD, media library, trilingual editor, audit log, dashboard.

**06 — Citizen services**
Complaint form + tracking + admin workflow. Downloads, tenders, careers. Land file status — jis
shakl me data mile.

**07 — Go-live**
301 redirects, sitemap, hreflang, security headers, backup schedule, load test, aur admin staff ke
liye ek chhoti handover guide.

---

## 10. Faisle jo aap se chahiye

Schema aur phases in jawabon par munhasir hain, is liye yeh pehle tay hone chahiyen:

**01 — Hosting**
Site kahan chalegi? cPanel shared hosting, VPS, ya government datacentre? PHP aur MySQL ke versions
kya hain, aur SSH / Composer dastiyab hai? Is se router aur deployment ka tareeqa tay hoga.

**02 — Land File Status ka data**
Woh record kis system me hai? Read-only DB connection, rozana import, ya manual entry — kaunsa
mumkin hai?

**03 — Admin workflow**
Draft → review → publish wali approval chahiye, ya publisher seedha publish kare?

**04 — Tarjume ka usool**
Kya publish karne se pehle teenon zubanein bharna lazmi ho, ya English kaafi ho aur baqi khali hone
par English dikhe? Sarkari portal ke liye pehla behtar hai, lekin us se content publish karna sust
ho jata hai.

**05 — Adhoora content**
Fee rates, officers ke direct numbers, district offices, reports aur projects abhi "not yet
published" mark hain. Kya yeh data aa raha hai? Admin panel banate waqt inke fields waise hi
banenge, sirf bharna baqi hoga.

---

*Yeh plan maujooda repo ki halat par bana hai — 21 pages, 3 zubanein, ~3,560 lines CSS, aur do
content JSON files. Phase 1 shuru karne se pehle ooper ke paanch faisle tay kar lein.*
