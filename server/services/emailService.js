// Email service using Resend API.
// Falls back to a no-op with a console notice when RESEND_API_KEY is not set (dev/test mode).
const { Resend } = require('resend');

const APP_URL   = process.env.APP_URL || 'https://ferdabox.is';
const FROM_ADDR = process.env.EMAIL_FROM || 'noreply@ferdabox.is';
const FROM      = `Ferða Box <${FROM_ADDR}>`;

function isConfigured() {
  return !!process.env.RESEND_API_KEY;
}

function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Shared HTML shell ─────────────────────────────────────────────────────────

function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border-radius:12px;overflow:hidden;border:1px solid #222;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);padding:32px 40px;border-bottom:2px solid #c9a84c;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#c9a84c;letter-spacing:1px;">Ferða Box</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#666;letter-spacing:2px;text-transform:uppercase;">ferdabox.is</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #222;background-color:#0d0d0d;">
              <p style="margin:0;font-size:12px;color:#444;text-align:center;">
                You received this email from <a href="${APP_URL}" style="color:#c9a84c;text-decoration:none;">ferdabox.is</a>.
                If you did not request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Verification email ────────────────────────────────────────────────────────

async function sendVerificationEmail(to, token) {
  const link = `${APP_URL}/#/verify-email?token=${token}`;

  if (!isConfigured()) {
    // Do NOT log the token or the full link — they are credential-equivalent.
    // In development, retrieve the token directly from the database:
    //   SELECT email_verify_token FROM users WHERE email = '...';
    console.log('[EmailService] Resend not configured — verification email skipped (retrieve token from DB)');
    return;
  }

  const subject = 'Staðfestu Ferða Box aðganginn þinn';
  const html = emailShell(subject, `
    <h2 style="margin:0 0 16px;font-size:22px;color:#e0e0e0;">Verify your email</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.6;">
      Thanks for signing up! Click the button below to verify your email address
      and activate your account. This link expires in <strong style="color:#c9a84c;">24 hours</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background-color:#c9a84c;border-radius:8px;">
          <a href="${link}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                    color:#0a0a0a;text-decoration:none;letter-spacing:0.5px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
      Or paste this link into your browser:<br/>
      <a href="${link}" style="color:#c9a84c;word-break:break-all;">${link}</a>
    </p>
  `);

  // Log the Resend message ID (not the recipient address — that's PII)
  const { data, error } = await getClient().emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  console.log(`[EmailService] Verification email sent: id=${data.id}`);
}

// ── Password reset email ──────────────────────────────────────────────────────

async function sendPasswordResetEmail(to, token) {
  const link = `${APP_URL}/#/reset-password?token=${token}`;

  if (!isConfigured()) {
    // Do NOT log the token or the full link — they are credential-equivalent.
    // In development, retrieve the token directly from the database:
    //   SELECT password_reset_token FROM users WHERE email = '...';
    console.log('[EmailService] Resend not configured — password reset email skipped (retrieve token from DB)');
    return;
  }

  const subject = 'Endurstilla lykilorð á Ferða Box';
  const html = emailShell(subject, `
    <h2 style="margin:0 0 16px;font-size:22px;color:#e0e0e0;">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.6;">
      We received a request to reset the password for your account. Click the button
      below to choose a new password. This link expires in <strong style="color:#c9a84c;">1 hour</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background-color:#c9a84c;border-radius:8px;">
          <a href="${link}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                    color:#0a0a0a;text-decoration:none;letter-spacing:0.5px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.6;">
      Or paste this link into your browser:<br/>
      <a href="${link}" style="color:#c9a84c;word-break:break-all;">${link}</a>
    </p>
    <p style="margin:0;font-size:13px;color:#444;">
      If you did not request a password reset, no action is needed — your password remains unchanged.
    </p>
  `);

  const { data, error } = await getClient().emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  console.log(`[EmailService] Password reset email sent: id=${data.id}`);
}

// ── Order receipt email ───────────────────────────────────────────────────────

async function sendOrderReceipt(order, items) {
  const to = order.customer_email;
  if (!to) {
    console.log(`[EmailService] Order ${order.id} has no customer_email — receipt skipped`);
    return;
  }

  if (!isConfigured()) {
    console.log(`[EmailService] Resend not configured — receipt for order ${order.id} skipped`);
    return;
  }

  const orderUrl = `${APP_URL}/#/orders/${order.id}`;

  const rows = items.map(it => `
    <tr>
      <td style="padding:8px 0;color:#ddd;">${it.product_title} × ${it.quantity}</td>
      <td style="padding:8px 0;color:#ddd;text-align:right;">
        ${Number(it.unit_price * it.quantity).toLocaleString('is-IS')} kr.
      </td>
    </tr>
  `).join('');

  const subject = `Ferða Box — pöntun #${order.id} móttekin`;
  const html = emailShell(subject, `
    <h2 style="margin:0 0 16px;font-size:22px;color:#e0e0e0;">Takk fyrir pöntunina!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.6;">
      Við höfum móttekið pöntun þína.  Hér er yfirlitið:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
      ${rows}
      <tr style="border-top:1px solid #333;">
        <td style="padding:12px 0;color:#c9a84c;font-weight:600;">Samtals</td>
        <td style="padding:12px 0;color:#c9a84c;font-weight:600;text-align:right;">
          ${Number(order.total_price).toLocaleString('is-IS')} kr.
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background-color:#c9a84c;border-radius:8px;">
          <a href="${orderUrl}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                    color:#0a0a0a;text-decoration:none;letter-spacing:0.5px;">
            Skoða pöntun
          </a>
        </td>
      </tr>
    </table>
  `);

  const { data, error } = await getClient().emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  console.log(`[EmailService] Order receipt sent: id=${data.id} order=${order.id}`);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendOrderReceipt };
