import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let _transporter = null;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error('SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD to server/.env');
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      tls: { rejectUnauthorized: false }
    });
  }
  return _transporter;
};

const otpHtml = (otp, employeeName = 'Employee') => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verification Code</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.10);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%);padding:36px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <span style="font-size:28px;">🏦</span>
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.4px;">Core Banking Portal</span>
          </div>
          <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;letter-spacing:.5px;">SECURE ACCESS VERIFICATION</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#475569;">Hello, <strong style="color:#0f172a;">${employeeName}</strong></p>
          <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
            Your one-time login verification code for the <strong>Core Banking Portal</strong> is:
          </p>

          <!-- OTP Box -->
          <div style="background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:2px solid #bfdbfe;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
            <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${otp}</div>
            <p style="margin:12px 0 0;font-size:13px;color:#64748b;">Valid for <strong>5 minutes</strong> &nbsp;·&nbsp; Single use only</p>
          </div>

          <div style="background:#fef9c3;border-left:4px solid #eab308;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
            <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
              ⚠️ <strong>Never share this code</strong> with anyone, including bank staff. If you did not attempt to login, contact your system administrator immediately.
            </p>
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
            This code was requested from the Core Banking Portal employee authentication system. It expires automatically and cannot be reused.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Core Banking Portal &nbsp;·&nbsp; Internal use only</p>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5e1;">This is an automated security email. Do not reply.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendOtpEmail = async (email, otp, employeeName = '') => {
  const t = getTransporter();
  await t.sendMail({
    from: `"Core Banking Portal" <${env.SMTP_FROM || env.SMTP_USER}>`,
    to: email,
    subject: `${otp} — Your Banking Portal Verification Code`,
    text: `Your Core Banking Portal verification code is: ${otp}\n\nThis code expires in 5 minutes and is for single use only.\nDo NOT share it with anyone.\n\nIf you did not request this, contact your administrator.`,
    html: otpHtml(otp, employeeName || email)
  });
};

export const sendWelcomeEmail = async (email, employeeName, employeeId, role) => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return; // optional, silently skip
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"Core Banking Portal" <${env.SMTP_FROM || env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Core Banking Portal — Account Created',
      text: `Welcome ${employeeName}!\n\nYour Core Banking Portal account has been created.\nEmployee ID: ${employeeId}\nRole: ${role}\n\nUse your Employee ID and the password you set to log in.`,
      html: `
      <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:40px 20px;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="560" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.1);">
          <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:36px 40px;text-align:center;">
            <div style="color:#fff;font-size:20px;font-weight:700;">🏦 Core Banking Portal</div>
            <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">ACCOUNT CREATED</p>
          </td></tr>
          <tr><td style="padding:40px;">
            <p style="font-size:15px;color:#0f172a;">Welcome, <strong>${employeeName}</strong>!</p>
            <p style="font-size:15px;color:#64748b;line-height:1.6;">Your employee account has been successfully created on the Core Banking Portal.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Employee ID</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#1d4ed8;font-family:monospace;">${employeeId}</p>
              <p style="margin:12px 0 4px;font-size:13px;color:#64748b;">Role</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${role}</p>
            </div>
            <p style="font-size:13px;color:#94a3b8;">Use your Employee ID and your password to log in. An OTP will be sent to this email on every login.</p>
          </td></tr>
          <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Core Banking Portal &nbsp;·&nbsp; Internal use only</p>
          </td></tr>
        </table>
      </body></html>`
    });
  } catch { /* welcome email is non-critical */ }
};