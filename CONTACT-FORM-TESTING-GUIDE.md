# Contact Form Testing Guide

A step-by-step guide on how to test the contact form on **riptus.net** using the sandbox tester script.

---

## What the Script Does

| Step | Action | Tool Used |
|------|--------|-----------|
| 1 | Submits the form to the live WordPress REST API | CF7 REST endpoint |
| 2 | Creates a throw-away email inbox | Ethereal (free sandbox) |
| 3 | Sends a sandboxed copy of the email | Nodemailer |
| 4 | Gives you a URL to preview the email in a browser | Ethereal preview link |

No real email account needed. No signup required.

---

## Prerequisites

Make sure you have these installed:

```bash
# Check Node.js (must be v14+)
node --version

# Check nodemailer is installed
node -e "require('nodemailer'); console.log('OK')"
```

If nodemailer is missing, install it:

```bash
cd c:/Users/Administrator/Downloads/Writerity
npm install nodemailer
```

---

## Quick Start

### 1. Run with default test data
-
```bash
cd c:/Users/Administrator/Downloads/Writerity
node test-contact-form.js
```

This sends a test submission using the built-in dummy data:
- **Name:** Test User
- **Email:** testuser@example.com
- **Subject:** Contact Form Sandbox Test
- **Message:** Hello! This is an automated sandbox test...

---

### 2. Run with your own data

```bash
node test-contact-form.js --name "Your Name" --email "you@example.com" --subject "Hello" --message "Your message here"
```

**All available flags:**

| Flag | Description | Example |
|------|-------------|---------|
| `--name` | Sender name | `--name "Jane Doe"` |
| `--email` | Sender email | `--email "jane@test.com"` |
| `--subject` | Email subject | `--subject "Inquiry"` |
| `--message` | Message body | `--message "I'd like to know more."` |

---

## Reading the Output

A successful run looks like this:

```
╔══════════════════════════════════════════════════════════╗
║        Contact Form Sandbox Tester — Riptus.net          ║
╚══════════════════════════════════════════════════════════╝

────────────────────────────────────────────────────────────
  Site   : Riptus (https://riptus.net)
  Form ID: 75
  Endpoint: https://riptus.net/wp-json/contact-form-7/v1/...
  Payload :
    your-name         : Test User
    your-email        : testuser@example.com
    your-subject      : Contact Form Sandbox Test
    your-message      : Hello! This is an automated sandbox test...

  ⏳ Submitting to CF7 REST API...
  ✅ CF7 ACCEPTED — "メッセージありがとうございます。送信されました。"

  ⏳ Creating Ethereal sandbox account...
  ✅ Sandbox email sent via Ethereal!

  ┌─ SANDBOX PREVIEW ────────────────────────────────────
  │  Message ID : <abc123@example.com>
  │  Preview URL: https://ethereal.email/message/xxxxx
  └──────────────────────────────────────────────────────

  👆 Open that URL in a browser to inspect the email.
```

---

## Checking the Email Preview

1. Copy the **Preview URL** from the terminal output
2. Open it in any browser
3. You will see the full email including:
   - **From / To / Subject** headers
   - **HTML body** (formatted email)
   - **Plain text** version
   - **Raw source**

> The preview link is temporary — it expires after the Ethereal session ends.
> Run the script again to generate a new one anytime.

---

## Understanding the Results

### CF7 Status Messages

| Output | Meaning |
|--------|---------|
| `✅ CF7 ACCEPTED` | Form submitted successfully, email sent by the server |
| `⚠️ CF7 responded but mail NOT sent` | Form reached the server but email failed (check WP mail config) |
| `❌ CF7 HTTP 415` | Wrong content type — script needs `multipart/form-data` (already fixed) |
| `❌ CF7 HTTP 404` | Form ID is wrong or REST API is disabled |
| `❌ Network error` | Site is down or unreachable |

### Ethereal Status Messages

| Output | Meaning |
|--------|---------|
| `✅ Sandbox email sent` | Email captured in sandbox, preview URL is valid |
| `❌ Could not reach Ethereal` | No internet connection or Ethereal is down |
| `❌ Ethereal send failed` | SMTP error — try again |

---

## How the CF7 Submission Works

The script posts directly to the **WordPress REST API** endpoint:

```
POST https://riptus.net/wp-json/contact-form-7/v1/contact-forms/75/feedback
Content-Type: multipart/form-data
```

With these fields:

| Field | Value |
|-------|-------|
| `_wpcf7` | `75` (form ID) |
| `_wpcf7_version` | `6.1.5` |
| `_wpcf7_locale` | `en_US` |
| `_wpcf7_unit_tag` | `wpcf7-f75-o1` |
| `your-name` | *(your input)* |
| `your-email` | *(your input)* |
| `your-subject` | *(your input)* |
| `your-message` | *(your input)* |

---

## Adding More Sites

To test contact forms on other sites, open `test-contact-form.js` and add an entry to the `SITES` array:

```js
const SITES = [
  {
    name:    "Riptus",
    siteUrl: "https://riptus.net",
    formId:  75,
    fields: {
      "your-name":    "Test User",
      "your-email":   "testuser@example.com",
      "your-subject": "Test",
      "your-message": "This is a test.",
    },
    hidden: {
      "_wpcf7":                "75",
      "_wpcf7_version":        "6.1.5",
      "_wpcf7_locale":         "en_US",
      "_wpcf7_unit_tag":       "wpcf7-f75-o1",
      "_wpcf7_container_post": "0",
      "_wpcf7_posted_data_hash": "",
    },
  },

  // Add more sites here:
  // {
  //   name:    "Another Site",
  //   siteUrl: "https://example.com",
  //   formId:  123,
  //   fields: { ... },
  //   hidden: { "_wpcf7": "123", ... },
  // },
];
```

To find the **Form ID** of another site, open its page source and search for:
```
name="_wpcf7" value="
```
The number after `value="` is the Form ID.

---

## Troubleshooting

**"CF7 HTTP 404"**
- The site may have the REST API disabled
- Double-check the form ID in the page source

**"CF7 responded but mail NOT sent"**
- The WordPress site's email (SMTP) is not configured
- Check the site's WP Admin → Settings → Email or install WP Mail SMTP

**"Could not reach Ethereal"**
- Check your internet connection
- Ethereal is a free public service — try again in a few seconds

**Preview URL not opening**
- The link is one-time use — re-run the script to get a fresh one
- Make sure you copy the full URL including the long token at the end

---

## Files Reference

| File | Purpose |
|------|---------|
| `test-contact-form.js` | The test script |
| `CONTACT-FORM-TESTING-GUIDE.md` | This guide |
| `riptus.net/index.html` | Local static copy of the site |
