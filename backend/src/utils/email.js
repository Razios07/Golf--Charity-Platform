const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM || 'noreply@golfcharity.com'
const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000'

async function sendWelcomeEmail(to, name, plan) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "🏌️ Welcome to GolfCharity — You're In!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:#22c55e;">Welcome, ${name}!</h1>
        <p style="color:#999;">Your <strong style="color:#fff">${plan}</strong> subscription is active.</p>
        <p style="color:#999;">✓ Enter your scores &nbsp;✓ Join the monthly draw &nbsp;✓ Support your charity</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#22c55e;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px;">Go to Dashboard →</a>
      </div>`,
  })
}

async function sendDrawResultEmail(to, name, matchCount, prizeAmount) {
  const won = matchCount >= 3
  await transporter.sendMail({
    from: FROM,
    to,
    subject: won ? `🏆 You won £${prizeAmount?.toFixed(2)}!` : '🎱 Draw Results — GolfCharity',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:${won ? '#fbbf24' : '#22c55e'};">${won ? '🎉 You Won!' : "This Month's Draw"}</h1>
        <p style="color:#999;">Hi ${name},</p>
        ${won
          ? `<p style="color:#fff;">You matched <strong>${matchCount} numbers</strong> and won <strong style="color:#fbbf24;">£${prizeAmount?.toFixed(2)}</strong>!</p>
             <a href="${APP_URL}/dashboard/winnings" style="display:inline-block;background:#fbbf24;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px;">Claim Prize →</a>`
          : `<p style="color:#999;">You matched ${matchCount} number${matchCount !== 1 ? 's' : ''} this month. Keep going!</p>`
        }
      </div>`,
  })
}

async function sendVerificationEmail(to, name, approved, notes) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: approved ? '✅ Prize Approved — Payment Processing' : '❌ Verification Issue — GolfCharity',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:${approved ? '#22c55e' : '#ef4444'};">${approved ? 'Prize Approved!' : 'Verification Issue'}</h1>
        <p style="color:#999;">Hi ${name},</p>
        ${approved
          ? '<p style="color:#fff;">Your prize is approved. Payment will arrive in 3–5 business days.</p>'
          : `<p style="color:#999;">Your verification was not approved.${notes ? ` Reason: ${notes}` : ''}</p>`
        }
      </div>`,
  })
}

module.exports = { sendWelcomeEmail, sendDrawResultEmail, sendVerificationEmail }
