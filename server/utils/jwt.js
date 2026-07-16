import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30m' });
export const signRefreshToken = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
