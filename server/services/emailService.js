import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error('OTP email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
    });
  }

  return transporter;
};

export const sendOtpEmail = async (email, otp) => {
  await getTransporter().sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: email,
    subject: 'Your banking portal verification code',
    text: `Your verification code is ${otp}. It expires in 5 minutes. If you did not request this code, contact your bank administrator.`
  });
};