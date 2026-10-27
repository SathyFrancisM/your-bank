import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const vercelOrigins = ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']
  .map((key) => process.env[key])
  .filter(Boolean)
  .map((host) => host.startsWith('http') ? host : `https://${host}`);

export const env = {
  PORT: toNumber(process.env.PORT, 5000),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/core_banking_portal',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_super_secret_jwt_key_change_in_production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
  CLIENT_URLS: [...new Set([process.env.CLIENT_URL || 'http://localhost:5173', ...vercelOrigins])],
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  OFFICE_LATITUDE: toNumber(process.env.OFFICE_LATITUDE, 28.6139),
  OFFICE_LONGITUDE: toNumber(process.env.OFFICE_LONGITUDE, 77.209),
  OFFICE_RADIUS_KM: toNumber(process.env.OFFICE_RADIUS_KM, 0.75),
  OFFICE_START_HOUR: toNumber(process.env.OFFICE_START_HOUR, 9),
  OFFICE_END_HOUR: toNumber(process.env.OFFICE_END_HOUR, 18)
};
