// ─── EMAIL SERVICE ────────────────────────────────────────────────────────────
// Uses Resend for transactional email — Architecture Spec §2.4
// Templates designed to be calm, warm, and on-brand

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Kingdom Companion <noreply@kingdomcompanion.app>'
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type SendEmailOptions = {
  to:      string
  subject: string
  html:    string
  text:    string
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Development: log email instead of sending
    console.log('[Email] Would send to:', options.to)
    console.log('[Email] Subject:', options.subject)
    console.log('[Email] Text:', options.text)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [options.to],
      subject: options.subject,
      html:    options.html,
      text:    options.text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[Email] Failed to send:', error)
    throw new Error('Email delivery failed')
  }
}

// ─── BASE EMAIL TEMPLATE ──────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kingdom Companion</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:#1B3A5C;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#C9A84C;font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:500">Kingdom Companion</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:400;font-family:Georgia,serif">A Peaceful Place with God's Word</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F0EBE0;border-radius:0 0 12px 12px;padding:24px 40px;border:1px solid #e8e0d4;border-top:0">
            <p style="margin:0;color:#888;font-size:11px;text-align:center;font-family:Arial,sans-serif;line-height:1.6">
              Kingdom Companion · Always free · No advertisements<br />
              <a href="${APP_URL}/privacy" style="color:#C9A84C;text-decoration:none">Privacy Policy</a> &nbsp;·&nbsp;
              <a href="${APP_URL}/contact" style="color:#C9A84C;text-decoration:none">Contact Us</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const bodyStyle = 'margin:0 0 16px;color:#2C2C2C;font-size:15px;line-height:1.7;font-family:Arial,sans-serif'
const btnStyle  = 'display:inline-block;background:#1B3A5C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:24px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;margin:8px 0'
const verseStyle = 'border-left:3px solid #C9A84C;padding:16px 20px;background:#FAF7F2;margin:24px 0;border-radius:0 8px 8px 0'

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  displayName: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`

  await sendEmail({
    to:      email,
    subject: 'Verify your email — Kingdom Companion',
    text:    `Welcome to Kingdom Companion, ${displayName}!\n\nPlease verify your email address by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.\n\n"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." — John 3:16`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">Welcome, ${displayName}</h2>
      <p style="${bodyStyle}">Thank you for joining Kingdom Companion. Please verify your email address to complete your account setup.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${verifyUrl}" style="${btnStyle}">Verify My Email</a>
      </div>
      <p style="${bodyStyle}">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
      <div style="${verseStyle}">
        <p style="margin:0;color:#1B3A5C;font-style:italic;font-size:14px;font-family:Georgia,serif">"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."</p>
        <p style="margin:6px 0 0;color:#C9A84C;font-size:12px;font-family:Arial,sans-serif;font-weight:500">— John 3:16 (NIV)</p>
      </div>
    `),
  })
}

export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await sendEmail({
    to:      email,
    subject: 'Reset your password — Kingdom Companion',
    text:    `Hi ${displayName},\n\nYou requested a password reset. Visit this link to create a new password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.\n\n"Cast all your anxiety on him because he cares for you." — 1 Peter 5:7`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">Password Reset</h2>
      <p style="${bodyStyle}">Hi ${displayName}, we received a request to reset your password. Click the button below to create a new one.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="${btnStyle}">Reset My Password</a>
      </div>
      <p style="${bodyStyle}">This link expires in 1 hour. If you did not request this, please ignore this email — your password will not change.</p>
      <div style="${verseStyle}">
        <p style="margin:0;color:#1B3A5C;font-style:italic;font-size:14px;font-family:Georgia,serif">"Cast all your anxiety on him because he cares for you."</p>
        <p style="margin:6px 0 0;color:#C9A84C;font-size:12px;font-family:Arial,sans-serif;font-weight:500">— 1 Peter 5:7 (NIV)</p>
      </div>
    `),
  })
}

export async function sendWelcomeEmail(
  email: string,
  displayName: string,
): Promise<void> {
  await sendEmail({
    to:      email,
    subject: 'Welcome to Kingdom Companion',
    text:    `Welcome to Kingdom Companion, ${displayName}!\n\nYour account is now active. Begin reading Scripture at: ${APP_URL}/bible\n\nThis is a free, Scripture-centred companion with no advertisements.\n\n"Your word is a lamp for my feet, a light on my path." — Psalm 119:105`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">You're all set, ${displayName}!</h2>
      <p style="${bodyStyle}">Your account is active. Kingdom Companion is a free, peaceful, Scripture-centred space — no advertisements, no paywalls, no pressure.</p>
      <div style="margin:24px 0">
        <p style="margin:0 0 8px;color:#1B3A5C;font-size:13px;font-family:Arial,sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.08em">You can now:</p>
        ${['Read the Bible in multiple translations', 'Receive Scripture-centred encouragement', 'Follow devotionals and reading plans', 'Keep a private prayer journal', 'Get AI-assisted biblical reflection'].map(item => `<p style="margin:6px 0;color:#444;font-size:14px;font-family:Arial,sans-serif">✓ &nbsp;${item}</p>`).join('')}
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="${APP_URL}/bible" style="${btnStyle}">Open the Bible</a>
      </div>
      <div style="${verseStyle}">
        <p style="margin:0;color:#1B3A5C;font-style:italic;font-size:14px;font-family:Georgia,serif">"Your word is a lamp for my feet, a light on my path."</p>
        <p style="margin:6px 0 0;color:#C9A84C;font-size:12px;font-family:Arial,sans-serif;font-weight:500">— Psalm 119:105 (NIV)</p>
      </div>
    `),
  })
}export async function sendPrayerRejectedEmail(
  email: string,
  displayName: string,
  reason: string,
): Promise<void> {
  await sendEmail({
    to:      email,
    subject: 'Update on your Prayer Wall request',
    text:    `Hi ${displayName},\n\nThank you for sharing your prayer request with us. After review, we're unable to post it to the Community Prayer Wall at this time.\n\nReason: ${reason}\n\nTo keep the Prayer Wall safe for everyone, we don't allow personal contact information, links, or donation requests.\n\nYou can still use your Prayer Journal for private prayers, or submit a new request with general wording: ${APP_URL}/prayer-wall\n\n"The Lord is close to the brokenhearted and saves those who are crushed in spirit." — Psalm 34:18`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">Update on your prayer request</h2>
      <p style="${bodyStyle}">Hi ${displayName}, thank you for sharing your prayer request with us. After review, we're unable to post it to the Community Prayer Wall at this time.</p>
      <p style="${bodyStyle}"><strong style="color:#1B3A5C">Reason:</strong> ${reason}</p>
      <p style="${bodyStyle}">To keep the Prayer Wall safe for everyone, we don't allow personal contact information, links, or donation requests.</p>
      <p style="${bodyStyle}">You can still use your Prayer Journal for private prayers, or submit a new request with general wording.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${APP_URL}/prayer-wall" style="${btnStyle}">Submit a New Request</a>
      </div>
      <div style="${verseStyle}">
        <p style="margin:0;color:#1B3A5C;font-style:italic;font-size:14px;font-family:Georgia,serif">"The Lord is close to the brokenhearted and saves those who are crushed in spirit."</p>
        <p style="margin:6px 0 0;color:#C9A84C;font-size:12px;font-family:Arial,sans-serif;font-weight:500">— Psalm 34:18</p>
      </div>
    `),
  })
}

export async function sendReportReceivedEmail(
  email: string,
  displayName: string,
  reportReason: string,
): Promise<void> {
  await sendEmail({
    to:      email,
    subject: 'We received your report',
    text:    `Hi ${displayName},\n\nThank you for helping us keep the Prayer Wall safe. We've received your report and our team will review it shortly.\n\nReport details: ${reportReason}\n\nFor your privacy, we won't share what action we take. If the post violates our guidelines, it will be removed.\n\nThis is an automated message — please do not reply.`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">We received your report</h2>
      <p style="${bodyStyle}">Hi ${displayName}, thank you for helping us keep the Prayer Wall safe. We've received your report and our team will review it shortly.</p>
      <p style="${bodyStyle}"><strong style="color:#1B3A5C">Report details:</strong> ${reportReason}</p>
      <p style="${bodyStyle}">For your privacy, we won't share what action we take. If the post violates our guidelines, it will be removed.</p>
      <p style="margin:24px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif">This is an automated message — please do not reply.</p>
    `),
  })
}

export async function sendAdminAlertEmail(
  adminEmail: string,
  prayerPreview: string,
): Promise<void> {
  await sendEmail({
    to:      adminEmail,
    subject: 'New Prayer Request Pending Review',
    text:    `A new prayer request has been submitted and is awaiting review.\n\nPreview: ${prayerPreview}\n\nReview it here: ${APP_URL}/admin/prayer-wall`,
    html: baseTemplate(`
      <h2 style="margin:0 0 16px;color:#1B3A5C;font-size:22px;font-weight:600;font-family:Georgia,serif">New prayer request pending review</h2>
      <p style="${bodyStyle}"><strong style="color:#1B3A5C">Preview:</strong> ${prayerPreview}</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${APP_URL}/admin/prayer-wall" style="${btnStyle}">Review in Admin Dashboard</a>
      </div>
    `),
  })
}