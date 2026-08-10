# Contact form: move from Formspree to self-hosted cPanel mail

## Context

The contact form (`src/components/pages/ContactPageContent.astro`, shared by `/contact` and `/pt/contacto`) currently submits to Formspree, per the original site spec (`2026-08-05-ummundu-travel-agency-design.md`). Formspree works, but:

- The client wants an automatic confirmation email sent to whoever submits the form. That's a paid-tier Formspree feature.
- The client (via a written request) wants submissions to land in `contact@ummundu.com`, a mailbox on their own domain, not a third-party dashboard.

Production hosting is WebHS shared hosting (cPanel), confirmed to support PHP and standard cPanel Email Accounts / Autoresponders. Decision: drop Formspree, handle everything with a small PHP script plus cPanel's native autoresponder — no third-party service, no recurring cost beyond the hosting already paid for.

## Goal

Replace the Formspree integration with a self-hosted PHP mail handler, with the auto-confirmation handled by cPanel's built-in Autoresponder feature (not custom code), and a safe way to test the real email-sending flow before the client's mailbox exists.

## Implementation note (discovered during build/testing, superseding parts of the plan below)

The plan below assumed plain PHP `mail()` would work. It doesn't: this host has `mail()` disabled server-side (`disable_functions` includes `mail`), a common anti-spam policy that forces sending through an authenticated mailbox instead. This changed two things not anticipated below:

- **Sending mechanism**: switched to authenticated SMTP via a vendored copy of PHPMailer (`public/lib/PHPMailer/`, pinned to v6.9.3, no Composer — plain `require`s) instead of `mail()`. This is a deviation from the "no external libraries" constraint below, made deliberately after confirming `mail()` was a dead end.
- **Credentials**: authenticated sending requires a real password, which — unlike the credential-free `mail()` approach — must never be committed to git. `public/smtp-config.php` holds the SMTP host/username/password, is listed in `.gitignore`, and is uploaded directly via FTP, never through git.
- **From address**: since most SMTP servers reject/flag a From address that doesn't match the authenticated account, the notification email's "From" is the mailbox itself (not the visitor, as originally planned), with the visitor's address set as Reply-To instead. **Open risk**: this means the cPanel Autoresponder auto-reply-to-visitor trick (which relies on replying to whoever the message's From/Reply-To is) has not yet been verified to actually fire off a Reply-To rather than a From — that verification is still pending, deferred to when `contact@ummundu.com`'s Autoresponder is actually configured. If it turns out cPanel only replies based on From, the auto-confirmation will need to move into this script as custom code instead (bilingual, no longer client-editable without a code change).

A temporary mailbox, `test@ummundu.com`, was created in cPanel purely to have something to authenticate as during testing (not a recipient) — to be deleted once testing wraps up, per the same "swap `NOTIFICATION_TO`, real mailbox, real Autoresponder" cutover described below.

## Architecture

```
Visitor fills contact form
   -> POST to send-contact.php (same site, cPanel host)
   -> script validates required fields + honeypot
   -> sends ONE email:
        From: <visitor's submitted email>
        To:   contact@ummundu.com
        Body: all submitted field values
   -> redirects (302) visitor to existing success page
        (routes.contactSuccess, unchanged)

cPanel Autoresponder on contact@ummundu.com
   -> fires automatically on receiving that email
   -> replies to the visitor's address with a confirmation message
   -> configured entirely in cPanel UI, not in code
```

No JS/AJAX involved in submission — the form keeps doing a plain HTML POST + redirect, same UX as the current Formspree integration.

## Components

**`public/send-contact.php`** (new)
- Ships as-is into the static build (Astro copies `public/` verbatim).
- Reads `$_POST`, validates required fields server-side (mirrors the existing client-side required fields: destination, duration, travellers, investment, first name, last name, email).
- Rejects the request silently (redirects to success page without sending mail) if the honeypot field is filled.
- Builds the email with `From:` set to the submitted visitor email and `To:` set to a single constant at the top of the file — this constant is the only thing that changes between test and production.
- Uses PHP's `mail()` — no external libraries, no Composer (shared hosting has neither).
- On success: redirects to the existing success page path. On validation failure: redirects back to the contact page (error handling is best-effort; the existing client-side validation already blocks most bad submissions before they reach the server).

**Contact form changes** (`ContactPageContent.astro`)
- `action` changes from the Formspree URL to `send-contact.php`.
- The `_next`/Formspree-specific hidden input is removed (redirect now happens server-side in the PHP script itself, using the same `routes.contactSuccess` path baked into the script).
- One hidden honeypot input added (e.g. `name="website"`, visually hidden via CSS, humans never fill it, bots that auto-fill every field do).

## Testing plan (before the client's mailbox exists)

Rather than installing PHP locally (real email delivery from a laptop isn't straightforward — no configured mail server), we test against the real host directly:

1. `send-contact.php` is uploaded via FTP to `public_html/` on the live `ummundu.com` hosting, with the "To" constant temporarily set to `joana@ondastudio.co`.
2. The local dev site (`npm run dev`) has its form `action` pointed at the live script's full URL (`https://ummundu.com/send-contact.php`) during this testing phase only — a plain form POST works cross-origin (no CORS restriction; that only applies to fetch/XHR).
3. Submitting the form locally sends a real email, through the real hosting's mail server, landing in a real inbox (`joana@ondastudio.co`) — full confidence the flow actually works, without any local mail-server setup.
4. Once verified, cut over to production: change the "To" constant to `contact@ummundu.com`, change the form `action` back to the relative path `send-contact.php` (correct once the whole site is deployed to that same host), create the `contact@ummundu.com` mailbox in cPanel, and add its Autoresponder with the confirmation text.

## Open items / what needs to happen in cPanel (not in code)

- Create `contact@ummundu.com` mailbox (Email Accounts section).
- Add an Autoresponder to that mailbox with confirmation copy (a placeholder EN/PT-friendly draft will be provided; client can edit anytime without a code change).
- David's personal follow-up happens by checking `contact@ummundu.com` directly (per the client's request) — no CC/additional recipient wired into the script.

## Explicitly out of scope

- SMTP-based sending (PHPMailer, authenticated relay) — plain `mail()` is sufficient for this volume; revisit only if deliverability becomes a real problem.
- Rate limiting beyond the honeypot — not needed at this traffic level.
- Bilingual auto-reply logic in code — handled by the (single, generic) cPanel Autoresponder text instead, per the decision to let the client edit it without code changes.
