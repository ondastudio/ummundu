# Contact Form: Self-Hosted cPanel Mail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Formspree contact-form integration with a self-hosted PHP mail script on the WebHS/cPanel host, tested against the real hosting (not locally) by temporarily pointing notifications at a personal inbox.

**Architecture:** A new `public/send-contact.php` receives the form POST, validates required fields + a honeypot, sends one email (From: visitor, To: a constant recipient) via PHP's built-in `mail()`, and redirects back to the existing success/contact pages. The Astro form drops its Formspree action/hidden input in favor of this script, adds a honeypot field and a hidden `lang` field, and — during local development only — points at the *live* script over HTTPS (a plain form POST, not fetch/AJAX, so no CORS issue) since a laptop can't reliably send real mail itself.

**Tech Stack:** Astro 7 (static), plain PHP (no Composer/libraries — shared hosting has neither), existing `routes.ts` for path constants.

## Global Constraints

- No third-party form service (Formspree removed entirely) — per spec `docs/superpowers/specs/2026-08-10-contact-form-cpanel-mail-design.md`.
- No external PHP libraries/Composer — target host has neither available.
- Notification recipient during testing: `joana@ondastudio.co` (constant, swapped to `contact@ummundu.com` once that mailbox exists — not part of this plan, a manual cPanel step afterward).
- Auto-confirmation is handled by cPanel's native Autoresponder, not by this script — the script sends exactly one email.
- Redirect targets must reuse the existing paths already defined in `src/content/copy/routes.ts` (`contact`, `contactSuccess`) — do not hardcode paths that could drift from that file.

---

### Task 1: Disable the failing auto-deploy workflow

**Files:**
- Modify: `.github/workflows/deploy.yml` (already edited in this session — commented out, not yet committed)

**Interfaces:** None — standalone infra change.

- [ ] **Step 1: Verify the file is fully commented out**

Run: `cat .github/workflows/deploy.yml`
Expected: every line prefixed with `#`, including a note explaining it's disabled until secrets/go-live are ready.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "$(cat <<'EOF'
Disable auto-deploy workflow until ready to go live

It ran (and failed) on every push to main since the FTP secrets were
never set, generating noisy failure notifications. Re-enable by
uncommenting once WEBHS_FTP_* secrets are configured and the site is
ready to deploy.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Contact mail handler script

**Files:**
- Create: `public/send-contact.php`

**Interfaces:**
- Consumes: form POST fields `lang`, `website` (honeypot), `departure_month`, `departure_year`, `destination`, `duration`, `travellers`, `investment`, `first_name`, `last_name`, `email`, `phone`, `message` — these are the exact `name` attributes already present on the form in `src/components/pages/ContactPageContent.astro`.
- Produces: redirects to `/contact`, `/contact/success`, `/pt/contacto`, or `/pt/contacto/obrigado` (mirrors `routes.contact` / `routes.contactSuccess` in `src/content/copy/routes.ts` — kept in sync manually since PHP can't import the TS file).

- [ ] **Step 1: Write the script**

Create `public/send-contact.php`:

```php
<?php
// Swap this when the client's real mailbox exists in cPanel.
const NOTIFICATION_TO = 'joana@ondastudio.co';

const PATH_CONTACT_EN = '/contact';
const PATH_CONTACT_PT = '/pt/contacto';
const PATH_SUCCESS_EN = '/contact/success';
const PATH_SUCCESS_PT = '/pt/contacto/obrigado';

function redirect_to($path) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    header('Location: ' . $scheme . '://' . $host . $path, true, 302);
    exit;
}

function field($name) {
    return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

// Strips CR/LF so submitted values can't inject extra mail headers.
function clean_line($value) {
    return str_replace(["\r", "\n"], ' ', $value);
}

$lang = field('lang') === 'pt' ? 'pt' : 'en';
$contactPath = $lang === 'pt' ? PATH_CONTACT_PT : PATH_CONTACT_EN;
$successPath = $lang === 'pt' ? PATH_SUCCESS_PT : PATH_SUCCESS_EN;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to($contactPath);
}

// Honeypot: hidden from humans via CSS, bots that fill every field trip it.
if (field('website') !== '') {
    redirect_to($successPath);
}

$required = ['destination', 'duration', 'travellers', 'investment', 'first_name', 'last_name', 'email'];
foreach ($required as $name) {
    if (field($name) === '') {
        redirect_to($contactPath);
    }
}

$email = filter_var(field('email'), FILTER_VALIDATE_EMAIL);
if ($email === false) {
    redirect_to($contactPath);
}

$firstName = clean_line(field('first_name'));
$lastName = clean_line(field('last_name'));

$fields = [
    'Departure month' => field('departure_month'),
    'Departure year' => field('departure_year'),
    'Destination' => field('destination'),
    'Duration' => field('duration'),
    'Travellers' => field('travellers'),
    'Investment' => field('investment'),
    'First name' => $firstName,
    'Last name' => $lastName,
    'Email' => $email,
    'Phone' => field('phone'),
    'Message' => field('message'),
];

$body = '';
foreach ($fields as $label => $value) {
    $body .= $label . ': ' . clean_line($value) . "\n";
}

$subject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader('New contact form submission from ' . $firstName . ' ' . $lastName, 'UTF-8', 'B')
    : 'New contact form submission from ' . $firstName . ' ' . $lastName;

$headers = 'From: ' . $firstName . ' ' . $lastName . ' <' . $email . ">\r\n" .
    'Reply-To: ' . $email . "\r\n" .
    "Content-Type: text/plain; charset=UTF-8\r\n";

mail(NOTIFICATION_TO, $subject, $body, $headers);

redirect_to($successPath);
```

- [ ] **Step 2: Confirm the honeypot field name matches what Task 3 will add to the form**

The form must add a field named exactly `website` for the honeypot check above to work — cross-check after Task 3's Step 1.

- [ ] **Step 3: Commit**

```bash
git add public/send-contact.php
git commit -m "$(cat <<'EOF'
Add PHP contact form mail handler

Sends one notification email (From: visitor, To: NOTIFICATION_TO)
via PHP's built-in mail() and redirects to the existing success page.
Validates required fields and a honeypot server-side. No external
libraries — the target shared host has no Composer.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Update the contact form

**Files:**
- Modify: `src/components/pages/ContactPageContent.astro:28-29` (form tag + hidden input)
- Modify: `src/components/pages/ContactPageContent.astro:803-811` (script — remove dead redirect JS)

**Interfaces:**
- Consumes: `PATH.send-contact.php` (Task 2's endpoint), `lang` prop already destructured in this component's frontmatter (`const { lang, currentRoute } = Astro.props;`).
- Produces: none consumed by later tasks.

- [ ] **Step 1: Replace the form tag and its first hidden input**

In `src/components/pages/ContactPageContent.astro`, replace lines 28-29:

```astro
  <form class="contact__form" action="https://formspree.io/f/mljrjoag" method="POST" novalidate data-contact-form>
    <input type="hidden" name="_next" data-next-path={successRedirect} />
```

with:

```astro
  <form
    class="contact__form"
    action={import.meta.env.DEV ? 'https://ummundu.com/send-contact.php' : 'send-contact.php'}
    method="POST"
    novalidate
    data-contact-form
  >
    <input type="hidden" name="lang" value={lang} />
    <input
      type="text"
      name="website"
      class="contact__honeypot"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
    />
```

- [ ] **Step 2: Add the honeypot's visually-hidden CSS**

In the same file's `<style>` block, add near `.contact__required` (around line 368):

```css
  .contact__honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
```

- [ ] **Step 3: Remove the now-dead `_next` redirect script**

Replace (around lines 803-811):

```astro
  function initNextRedirect() {
    const input = document.querySelector<HTMLInputElement>('[data-next-path]');
    if (!input) return;
    input.value = `${window.location.origin}${input.dataset.nextPath}`;
  }

  initNextRedirect();
  initDropdowns();
  initContactForm();
```

with:

```astro
  initDropdowns();
  initContactForm();
```

- [ ] **Step 4: Confirm `successRedirect` is still used elsewhere in the file (it is not — it was only used by the removed hidden input)**

Run: `grep -n "successRedirect" src/components/pages/ContactPageContent.astro`
Expected: only the frontmatter declaration `const successRedirect = routes.contactSuccess[lang];` remains. Remove that now-unused line too (the PHP script owns the redirect logic now).

- [ ] **Step 5: Run the existing test suite to confirm nothing else references the removed pieces**

Run: `npm run test`
Expected: all existing tests pass, no failures related to `ContactPageContent`.

- [ ] **Step 6: Commit**

```bash
git add src/components/pages/ContactPageContent.astro
git commit -m "$(cat <<'EOF'
Point contact form at self-hosted mail script instead of Formspree

Adds a honeypot field and a hidden lang field the PHP script needs to
pick the right redirect target. In local dev the form posts straight
to the live script (plain POST, no CORS issue) since real mail can't
be sent from a laptop; production build uses the relative path.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Deploy the script to the live host and verify end-to-end

**Files:** none (deployment + manual verification only)

**Interfaces:**
- Consumes: `public/send-contact.php` (Task 2), the updated form (Task 3), live FTP credentials (already shared in conversation, not stored in any repo file).

- [ ] **Step 1: Upload only the mail script to the live host**

```bash
curl -T public/send-contact.php "ftp://ftp.ummundu.com/public_html/send-contact.php" --user 'ummunduc:Cpanel.2026'
```

Expected: command exits 0, no error output.

- [ ] **Step 2: Confirm the script is live and rejects non-POST requests**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://ummundu.com/send-contact.php
```

Expected: `302` with a redirect URL ending in `/contact` (a GET request should bounce back to the contact page, not send mail).

- [ ] **Step 3: Confirm the honeypot silently succeeds without sending mail**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  -d "lang=en" -d "website=http://spam.example" \
  -d "destination=algarve" -d "duration=7 days" -d "travellers=2 people" \
  -d "investment=€A to €B per person" -d "first_name=Bot" -d "last_name=Test" \
  -d "email=bot@example.com" \
  https://ummundu.com/send-contact.php
```

Expected: `302` redirecting to `/contact/success` (looks successful to the bot) — check `joana@ondastudio.co` does **not** receive an email for this request.

- [ ] **Step 4: Confirm a real, valid submission sends mail and redirects correctly**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  -d "lang=en" -d "website=" \
  -d "destination=algarve" -d "duration=7 days" -d "travellers=2 people" \
  -d "investment=€A to €B per person" -d "first_name=Test" -d "last_name=Submission" \
  -d "email=joana@ondastudio.co" -d "message=End-to-end test" \
  https://ummundu.com/send-contact.php
```

Expected: `302` redirecting to `/contact/success`, and an email arrives at `joana@ondastudio.co` with "New contact form submission from Test Submission" as the subject and the form fields listed in the body.

- [ ] **Step 5: Full browser test through the actual local dev site**

Run: `npm run dev`, open `http://localhost:4321/contact`, fill in and submit the real form (not curl).
Expected: browser lands on the `/contact/success` page (served from `ummundu.com`, since the dev-mode action points there — confirm this is the intended UX for this testing phase, not a bug), and another test email arrives.

- [ ] **Step 6: Report status to the user**

No commit for this task (deployment + verification only) — summarize pass/fail of Steps 2-5 to the user before considering the feature done.

---

## Post-plan manual steps (not part of this implementation, tracked here for visibility)

- Create the `contact@ummundu.com` mailbox in cPanel (Email Accounts).
- Add a cPanel Autoresponder to that mailbox with confirmation copy.
- Change `NOTIFICATION_TO` in `public/send-contact.php` from `joana@ondastudio.co` to `contact@ummundu.com`, redeploy.
- Re-enable `.github/workflows/deploy.yml` and set the `WEBHS_FTP_*` secrets when ready to go live.
