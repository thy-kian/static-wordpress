/**
 * Contact Form Sandbox Tester
 * ─────────────────────────────────────────────────────────────────
 * Tests the Contact Form 7 endpoint on riptus.net using Ethereal
 * Email (free SMTP sandbox by Nodemailer — no signup needed).
 *
 * What it does:
 *  1. Submits the CF7 form via the WP REST API (live endpoint)
 *  2. Creates a throw-away Ethereal SMTP test account
 *  3. Sends a sandboxed copy of the same message through Ethereal
 *  4. Prints a clickable preview URL so you can inspect the email
 *
 * Usage:
 *   node test-contact-form.js
 *   node test-contact-form.js --name "Jane" --email "jane@test.com"
 */

const https   = require("https");
const http    = require("http");
const url     = require("url");
const nodemailer = require("nodemailer");

// ── Config ────────────────────────────────────────────────────────────────────

const SITES = [
  {
    name:     "Riptus",
    siteUrl:  "https://riptus.net",
    formId:   75,
    fields: {
      "your-name":    "Test User",
      "your-email":   "testuser@example.com",
      "your-subject": "Contact Form Sandbox Test",
      "your-message": "Hello! This is an automated sandbox test of your contact form. Please ignore.",
    },
    // CF7 hidden fields (from the crawled page)
    hidden: {
      "_wpcf7":                "75",
      "_wpcf7_version":        "6.1.5",
      "_wpcf7_locale":         "en_US",
      "_wpcf7_unit_tag":       "wpcf7-f75-o1",
      "_wpcf7_container_post": "0",
      "_wpcf7_posted_data_hash": "",
    },
  },
];

// Override fields from CLI args: --name "X" --email "Y" --subject "Z" --message "W"
function parseCLI() {
  const args = process.argv.slice(2);
  const out  = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    const val = args[i + 1] || "";
    out[key] = val;
  }
  return out;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function buildMultipart(fields) {
  const boundary = `----FormBoundary${Date.now().toString(16)}`;
  const lines    = [];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${k}"`);
    lines.push("");
    lines.push(v);
  }
  lines.push(`--${boundary}--`);
  const body = lines.join("\r\n");
  return { body: Buffer.from(body), boundary };
}

function httpPost(endpoint, fields) {
  return new Promise((resolve, reject) => {
    const { body, boundary } = buildMultipart(fields);
    const parsed = new URL(endpoint);
    const lib    = parsed.protocol === "https:" ? https : http;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   "POST",
        headers:  {
          "Content-Type":   `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
          "User-Agent":     "ContactFormTester/1.0",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── CF7 REST submission ───────────────────────────────────────────────────────

async function submitCF7(site, cliOverrides) {
  const fields = {
    ...site.hidden,
    ...site.fields,
    ...(cliOverrides.name    ? { "your-name":    cliOverrides.name    } : {}),
    ...(cliOverrides.email   ? { "your-email":   cliOverrides.email   } : {}),
    ...(cliOverrides.subject ? { "your-subject": cliOverrides.subject } : {}),
    ...(cliOverrides.message ? { "your-message": cliOverrides.message } : {}),
  };

  const endpoint = `${site.siteUrl}/wp-json/contact-form-7/v1/contact-forms/${site.formId}/feedback`;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Site   : ${site.name} (${site.siteUrl})`);
  console.log(`  Form ID: ${site.formId}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Payload :`);
  for (const [k, v] of Object.entries(fields)) {
    if (!k.startsWith("_wpcf7")) {
      console.log(`    ${k.padEnd(18)}: ${v}`);
    }
  }

  let cfResult = null;
  try {
    console.log(`\n  ⏳ Submitting to CF7 REST API...`);
    cfResult = await httpPost(endpoint, fields);
    const status = cfResult.body?.status || "unknown";
    const msg    = cfResult.body?.message || JSON.stringify(cfResult.body).slice(0, 120);

    if (status === "mail_sent") {
      console.log(`  ✅ CF7 ACCEPTED — "${msg}"`);
    } else if (cfResult.status === 200 && status !== "mail_sent") {
      console.log(`  ⚠️  CF7 responded but mail NOT sent — status: "${status}"`);
      console.log(`     message: ${msg}`);
    } else {
      console.log(`  ❌ CF7 HTTP ${cfResult.status} — ${msg}`);
    }
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }

  return { fields, cfResult };
}

// ── Ethereal sandbox send ─────────────────────────────────────────────────────

async function sendEtherealSandbox(site, fields) {
  console.log(`\n  ⏳ Creating Ethereal sandbox account...`);

  let testAccount;
  try {
    testAccount = await nodemailer.createTestAccount();
  } catch (err) {
    console.log(`  ❌ Could not reach Ethereal: ${err.message}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host:   "smtp.ethereal.email",
    port:   587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const mailOptions = {
    from:    `"${fields["your-name"]}" <${fields["your-email"]}>`,
    to:      `"${site.name} Contact" <${testAccount.user}>`,
    subject: fields["your-subject"],
    text:    fields["your-message"],
    html:    `
      <h2>Contact Form Submission — ${site.name}</h2>
      <table style="border-collapse:collapse;font-family:sans-serif">
        <tr><th style="text-align:left;padding:4px 12px 4px 0">From</th>
            <td>${fields["your-name"]} &lt;${fields["your-email"]}&gt;</td></tr>
        <tr><th style="text-align:left;padding:4px 12px 4px 0">Subject</th>
            <td>${fields["your-subject"]}</td></tr>
        <tr><th style="text-align:left;padding:4px 12px 4px 0">Site</th>
            <td>${site.siteUrl}</td></tr>
        <tr><th style="text-align:left;padding:4px 12px 4px 0">Message</th>
            <td>${fields["your-message"]}</td></tr>
      </table>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`  ✅ Sandbox email sent via Ethereal!`);
    console.log(`\n  ┌─ SANDBOX PREVIEW ────────────────────────────────────`);
    console.log(`  │  Message ID : ${info.messageId}`);
    console.log(`  │  Preview URL: ${previewUrl}`);
    console.log(`  └──────────────────────────────────────────────────────`);
    console.log(`\n  👆 Open that URL in a browser to inspect the email.`);
  } catch (err) {
    console.log(`  ❌ Ethereal send failed: ${err.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const cliOverrides = parseCLI();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        Contact Form Sandbox Tester — Riptus.net          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  for (const site of SITES) {
    const { fields, cfResult } = await submitCF7(site, cliOverrides);
    await sendEtherealSandbox(site, fields);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log("  Done. Check the preview URL(s) above in your browser.");
  console.log(`${"─".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
