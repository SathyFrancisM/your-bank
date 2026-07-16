import { verifyAccessToken } from '../utils/jwt.js';
import { isEmployeeBlocked } from '../services/securityEngine.js';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = verifyAccessToken(token);
    const blocked = isEmployeeBlocked(req.user.employeeId);
    const isLogoutRoute = req.baseUrl === '/api/auth' && req.path === '/logout';
    const isMeRoute = req.baseUrl === '/api/auth' && req.path === '/me';
    if (blocked && !isLogoutRoute && !isMeRoute) {
      return res.status(403).json({ message: 'Session terminated due to security policy violation' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
