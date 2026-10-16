# Skarbnyk (Скарбник)

A web app for Ukrainian sole proprietors (ФОП) on the simplified tax system,
groups 1 to 3. You record when and how much money came in; the app works out
the single tax, the military levy and the social contribution (ЄСВ), and shows
the payment and filing deadlines. Amounts, dates, notes and settings are
encrypted in the browser before they are stored.

The interface is in Ukrainian only. A short Ukrainian summary is at the end of
this file ([Українською](#українською)).

The author runs one instance at https://skarbnyk.web.app. This repository is
for anyone who wants to read the code or run their own copy.

## Not tax or legal advice

Skarbnyk is a calculator, not a tax, accounting or legal service. The numbers
and deadlines come from the author's reading of the Tax Code and related laws
as of 14 October 2026. Ukrainian tax rules change often, some points are
unconfirmed, and the app can be wrong or out of date.
Check every amount and deadline against your Electronic Cabinet
(Електронний кабінет платника) or with an accountant before you pay or file.
The rules the calculations and tests follow, with their sources, are in
[docs/tax-rules.md](docs/tax-rules.md) (in Ukrainian).
The software comes without any warranty; see [LICENSE](LICENSE).

## Features

- Groups 1, 2 and 3 (5%, or 3% for VAT payers); a group change from the first
  day of a quarter; the annual income limit and the 15% rate above it.
- Income in UAH, USD and EUR. The official NBU rate for the day is filled in
  (Tax Code 292.5) and can be changed, as can the amount in hryvnias.
- Single tax, military levy and ЄСВ: the minimum or a custom amount,
  exemptions (pension, disability, employer pays), and the period of military
  service.
- Law figures by year (2024 to 2026 at the moment) in one table; any rate or
  amount can be overridden for your year. A year without figures falls back
  to the nearest one and says so.
- Payment and filing deadlines with weekend carry-over, a quarterly or monthly
  payment schedule, "paid" and "filed" marks, paying a single month early.
- Figures to enter in the tax return for each period.
- Payment details (IBAN, recipient, code) entered once; the amount and the
  payment purpose are put together for copying.
- Deadlines as an `.ics` calendar file (no amounts), incomes as CSV.
- Account deletion with all stored data.
- Light and dark theme, phone layout, can be added to a home screen.

Not covered: group 4, the general tax system, VAT itself, employees, bank
import. Email reminders have a screen and a data model but no mailer yet; the
card says so while `NEXT_PUBLIC_EMAIL_REMINDERS=0`.

## How the encryption works

- After Google sign-in you create a separate encryption password (at least 12
  characters). The browser generates a random 256-bit AES-GCM data key.
- The data key is stored only in wrapped form, twice: under a key derived from
  the password with PBKDF2-HMAC-SHA256 (600,000 iterations, 16-byte random
  salt), and under a key derived with HKDF-SHA256 from a recovery key of 160
  random bits. The recovery key is shown once, as eight groups of four
  characters, and is never stored.
- Every profile, income and mark is serialised to JSON and encrypted with
  AES-GCM under a fresh random 96-bit IV. The additional authenticated data
  names the collection, the document id and the user id, so a ciphertext
  copied into another document or account does not decrypt.
- Firestore keeps only `owner_uid`, `v`, `iv` and `ct` for those documents.
  The security rules ([firestore.rules](firestore.rules)) limit every document
  to its owner and accept only that exact shape. Only Google sign-ins pass
  them, whatever other sign-in methods the Firebase project has switched on.
- Changing the password or creating a new recovery key re-wraps the same data
  key; the documents are not touched. Both ask for the current password.
- "Remember on this device" keeps a non-extractable copy of the data key in
  IndexedDB. Lock and sign-out delete it.
- Firestore's offline cache in IndexedDB holds the encrypted documents and
  the wrapped key record while you are signed in. Signing out or deleting the
  account deletes it, in every open tab, and reloads the page.
- Every page carries a Content-Security-Policy: it runs only the site's own
  scripts (the inline ones by their hashes) and Google's sign-in helper, and
  lets the page connect only to Firebase and the NBU. `npm run build` writes
  it ([scripts/csp.mjs](scripts/csp.mjs)).

What the server, and whoever administers the Firebase project, can see:

- your Google account as Firebase Auth holds it (user id, email, name) and
  sign-in times;
- how many incomes and marks you have, their approximate size and when they
  were written;
- the wrapped key record. With it, someone can try to guess your password
  offline; each guess costs 600,000 PBKDF2 iterations, so a long password
  matters;
- if you switch on email reminders once they exist: your email, tax group and
  how many days ahead to write, in plain text by design.

The NBU rate is fetched by your browser directly from `bank.gov.ua`; the
request carries only the currency and the date.

What it does not protect against:

- The code itself. Whoever serves the web app can change it to capture the
  password. If you do not trust an instance, run your own.
- Malware or a hostile browser extension on your device, or someone using a
  browser where "Remember on this device" is on.
- The server deleting documents or returning an older version of one. It
  cannot forge a document without the key.
- A new password does not replace the data key, so a device that remembered
  the key keeps access until it is locked or signed out there.
- Someone using a browser where you are still signed in, even with the data
  locked: the offline cache with the encrypted documents and the wrapped key
  record stays there until you sign out.

If both the password and the recovery key are lost, nobody can recover the
data, including the author of the instance.

## Stack

Next.js 16 (static export), React 19, TypeScript, styled-components, zustand,
TanStack Query, Formik and Yup, i18next. Firebase Authentication (Google),
Cloud Firestore and Firebase Hosting. WebCrypto for all cryptography, with no
crypto libraries. Jest for unit tests, `@firebase/rules-unit-testing` on the
Firestore emulator for the security rules.

## Run your own copy

You need Node.js 22 or newer with npm, a Google account, and JDK 21 or newer
for the Firestore emulator (local development and rules tests only).

### 1. Install

```sh
git clone https://github.com/vdzeer/skarbnyk.git
cd skarbnyk
npm ci
npm --prefix rules-tests ci
```

The Firebase CLI is a dev dependency of `rules-tests/`. The commands below
call it `firebase`; without a global install use
`rules-tests/node_modules/.bin/firebase`.

### 2. Create a Firebase project

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
   The free Spark plan is enough for the app; the planned email mailer will
   need Blaze.
2. Authentication → Sign-in method: enable Google. Leave other providers off.
3. Project settings → Your apps: add a Web app. Firebase Hosting can be set up
   later from the CLI.
4. Firestore: `firebase.json` sets the `(default)` database to `eur3` (Europe,
   multi-region). The first rules deploy creates the database there if it
   does not exist. To use another location, change `location` in
   `firebase.json` before that deploy, or create the database in the console
   and set `location` to match. The location cannot be changed later.

### 3. Point the CLI at your project

```sh
firebase login
firebase use --add
```

This writes `.firebaserc`, which is git-ignored, so every checkout chooses its
own project.

### 4. Configure the web app

```sh
cp .env.example .env.production
firebase apps:sdkconfig WEB
```

Copy `apiKey`, `authDomain`, `projectId` and `appId` from the output into
`.env.production`. Keep `NEXT_PUBLIC_USE_EMULATORS=0` and
`NEXT_PUBLIC_EMAIL_REMINDERS=0`, and leave `NEXT_PUBLIC_APPCHECK_SITE_KEY`
empty unless you set up App Check (below). These values are public
identifiers that end up in the browser bundle, not secrets, but env files stay
out of git.

### 5. Deploy the rules, then the site

```sh
firebase deploy --only firestore
npm run build
firebase deploy --only hosting
```

`npm run build` writes the static site to `out/` and gives every page its
Content-Security-Policy, built from the same env as the app. The app is then
at `https://<project-id>.web.app`. If you add a custom domain, add it under
Authentication → Settings → Authorized domains as well.

Worth doing for a public instance: restrict the browser API key to your
domains in the Google Cloud console, set a billing budget alert if the
project is on Blaze, and consider App Check.

### Optional: App Check

App Check makes Firestore and Authentication accept requests only from your
web app, so someone holding your public config cannot simply script against
your quota. The app supports it with reCAPTCHA Enterprise. It is off while
`NEXT_PUBLIC_APPCHECK_SITE_KEY` is empty, and never used with the emulators.

1. Google Cloud console → Security → reCAPTCHA: create a website key for your
   domains (`<project-id>.web.app`, `<project-id>.firebaseapp.com` and any
   custom domain), score-based, without the checkbox challenge.
2. Firebase console → App Check → Apps: register the web app with the
   reCAPTCHA Enterprise provider and that site key.
3. Put the key into `.env.production` as `NEXT_PUBLIC_APPCHECK_SITE_KEY`, run
   `npm run build` and deploy hosting. The build adds the reCAPTCHA hosts to
   the Content-Security-Policy.
4. Do not enforce yet. When App Check → APIs shows that nearly all Cloud
   Firestore and Authentication requests are verified, enforce it for both.

Each App Check token costs one reCAPTCHA assessment, and reCAPTCHA bills
beyond a free monthly allowance; a longer token lifetime in the provider
settings means fewer assessments. Check the current reCAPTCHA pricing.

## Local development

The app can run entirely against the Firebase emulators under a `demo-`
project id, which cannot reach any real project. Create `.env`:

```sh
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-skarbnyk.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-skarbnyk
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app-id
NEXT_PUBLIC_USE_EMULATORS=1
NEXT_PUBLIC_EMAIL_REMINDERS=0
```

Then, in two terminals:

```sh
npm run emulators   # Auth on 9099, Firestore on 8080; needs JDK 21+
npm run dev         # http://localhost:3000
```

If `java -version` shows an older JDK, put JDK 21 first on `PATH` for the
emulator command, for example with Homebrew on macOS:
`PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run emulators`.

With emulators on, the sign-in screen has a test-user button (a mock Google
sign-in that only the Auth emulator accepts). It does not exist in a build for
a real project. Emulator data is gone when the emulators stop.

`npm run build` reads `.env.production` over `.env`; without
`.env.production` the build talks to the emulators.

## Tests and checks

```sh
npm run lint          # tsc --noEmit and eslint
npm test              # jest: calculator, deadlines, crypto, data parsing, code scans, CSP
npm run test:rules    # Firestore rules on the emulator; needs JDK 21+
npm run build         # static export to out/, then the CSP of every page
```

`npm test` needs no Firebase project or env file. `npm run test:rules` starts
the Firestore emulator under `demo-skarbnyk` by itself. GitHub Actions runs
all four on every push and pull request
([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Project layout

```
src/core              law figures by year, calculator, deadlines, .ics (pure TypeScript)
src/services/crypto   key derivation, wrapping, document encryption (WebCrypto)
src/features          auth, vault, ledger, overview, incomes, deadlines, settings
src/components        shared UI components
src/themes            design tokens, light and dark palettes
src/services          Firebase client, NBU rate, strings (i18n/uk.json), formatting
src/app               Next.js routes
firestore.rules       security rules
rules-tests/          rules tests on the emulator, a separate npm package
scripts/csp.mjs       the Content-Security-Policy, added to out/ after next build
```

A new tax year means a row in `LAW` in `src/core/law.ts` and tests in
`src/core/__tests__/law.test.ts`.

## Licence

MIT, see [LICENSE](LICENSE).

The typefaces Geologica and Onest are downloaded from Google Fonts by
`next/font` at build time and served with the site. Both are licensed under
the [SIL Open Font License 1.1](https://openfontlicense.org/):

- Geologica: Copyright 2020 The Geologisk Project Authors
  (https://github.com/monokromskriftforlag/geologisk)
- Onest: Copyright 2021 The Onest Project Authors
  (https://github.com/googlefonts/onest)

## Українською

Скарбник — вебзастосунок для ФОП 1–3 груп на єдиному податку. Ви записуєте,
коли і скільки грошей прийшло, а застосунок рахує єдиний податок, військовий
збір і ЄСВ та показує строки сплати й звітності. Інтерфейс лише українською.

**Це не податкова чи юридична консультація.** Числа і строки взято з
прочитання Податкового кодексу та інших законів станом на 14.10.2026.
Правила часто змінюються, частина пунктів не підтверджена, і застосунок
може помилятися. Перед сплатою чи поданням звіряйте суми й
строки з Електронним кабінетом платника або з бухгалтером. Програма
надається без жодних гарантій (див. [LICENSE](LICENSE)).

**Шифрування.** Суми, дати, примітки і налаштування шифруються у вашому
браузері (AES-GCM 256). Ключ даних загорнутий паролем шифрування
(PBKDF2-SHA256, 600 000 ітерацій) і ключем відновлення (160 випадкових біт),
який показується один раз. Сервер бачить ваш акаунт Google, кількість і час
записів та загорнутий ключ, але не їхній вміст. Хто обслуговує сайт, той
постачає і його код, тож якщо не довіряєте чужій копії, розгорніть свою.
Якщо загубити і пароль, і ключ відновлення, дані не відновить ніхто.

**Своя копія.** Потрібні Node.js 22+, npm, акаунт Google і JDK 21+ для
емулятора. Коротко:

```sh
npm ci && npm --prefix rules-tests ci
firebase login
firebase use --add                  # ваш проєкт Firebase
cp .env.example .env.production     # значення з firebase apps:sdkconfig WEB
firebase deploy --only firestore
npm run build
firebase deploy --only hosting
```

У консолі Firebase треба ввімкнути вхід через Google і додати вебзастосунок.
Подробиці, локальний запуск на емуляторах і тести описано вище англійською.

Ліцензія — MIT.
