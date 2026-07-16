import { demoMode } from '../config/db.js';
import { RiskScore } from '../models/RiskScore.js';
import { evaluateSecurityEvent, getSecurityOverview, blockEmployee, clearEmployeeBlock } from '../services/securityEngine.js';

const buildRecentSignals = (payload) => ({
  eventType: payload.eventType,
  route: payload.route,
  previousRoute: payload.previousRoute,
  intent: payload.intent,
  intentDetail: payload.intentDetail,
  metadata: payload.metadata,
  blocked: payload.blocked
});

export const recordSecurityEvent = async (req, res) => {
  const payload = req.body || {};
  const result = await evaluateSecurityEvent({
    employeeId: req.user.employeeId,
    employeeName: req.user.name,
    role: req.user.role,
    sessionId: payload.sessionId || req.header('X-Bank-Security-Session') || 'default',
    eventType: payload.type || payload.eventType || 'navigation',
    route: payload.route || req.body.route || '',
    previousRoute: payload.previousRoute || '',
    metadata: payload.metadata || {}
  });

  if (!demoMode) {
    await RiskScore.findOneAndUpdate(
      { employeeId: req.user.employeeId },
      {
        employeeId: req.user.employeeId,
        employeeName: req.user.name,
        score: result.score,
        level: result.score >= 80 ? 'High Risk' : result.score >= 60 ? 'Medium' : 'Safe',
        reasons: [result.reason, result.intentDetail].filter(Boolean),
        suggestedAction: result.blocked ? 'Session terminated due to security policy violation' : result.score >= 60 ? 'Monitor session and restrict exports' : 'Allow with normal controls',
        recentSignals: buildRecentSignals(result),
        updatedAtSource: 'security-event'
      },
      { upsert: true, new: true }
    );
  }

  if (result.blocked) {
    blockEmployee(req.user.employeeId, result.reason, result.score);
  }

  return res.json({
    data: {
      ...result,
      blocked: result.blocked,
      message: result.blocked ? 'Session terminated due to security policy violation' : result.intentDetail
    }
  });
};

export const securityOverview = async (req, res) => {
  const overview = await getSecurityOverview({ employeeId: req.user.employeeId, role: req.user.role, sessionId: req.header('X-Bank-Security-Session') || 'default' });
  res.json({ data: overview });
};

export const clearSecurityBlock = async (req, res) => {
  clearEmployeeBlock(req.user.employeeId);
  res.json({ data: { cleared: true } });
};