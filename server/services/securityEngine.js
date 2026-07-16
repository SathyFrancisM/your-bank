import { demoMode } from '../config/db.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { writeAuditLog } from './auditService.js';
import { createNotification } from './notificationService.js';

let socketServer = null;
const blockedEmployees = new Map();
const securitySessions = new Map();
const securityFeed = [];

const demoSecurityFeed = [
  { employeeId: 'TEL001', employeeName: 'Teller 1', sessionId: 'demo-session-1', eventType: 'window-blur', route: '/transactions', score: 42, delta: 12, intent: 'Suspicious', intentDetail: 'Repeated focus loss', action: 'warn', reason: 'Window focus lost', warnings: 1, blocked: false, metadata: { blurCount: 1 }, createdAt: new Date().toISOString() },
  { employeeId: 'TEL001', employeeName: 'Teller 1', sessionId: 'demo-session-1', eventType: 'download-attempt', route: '/reports', score: 88, delta: 35, intent: 'Malicious', intentDetail: 'Possible insider data theft attempt', action: 'logout', reason: 'Bulk download blocked', warnings: 3, blocked: true, metadata: { filename: 'audit-snapshot.pdf' }, createdAt: new Date().toISOString() }
];

const workflowBaselines = {
  Teller: ['/', '/employee/dashboard', '/customers', '/accounts', '/transactions', '/security'],
  Manager: ['/', '/manager/dashboard', '/customers', '/accounts', '/transactions', '/fd', '/rd', '/loans', '/reports', '/security'],
  Admin: ['/', '/admin/dashboard', '/customers', '/accounts', '/transactions', '/reports', '/audit-logs', '/risk', '/security'],
  Auditor: ['/', '/auditor/dashboard', '/audit-logs', '/risk', '/security']
};

const eventWeights = {
  navigation: 0,
  'window-focus': 0,
  'window-blur': 12,
  'app-switch': 18,
  'copy-attempt': 8,
  'cut-attempt': 8,
  'paste-attempt': 6,
  'print-attempt': 12,
  'download-attempt': 28,
  'bulk-download': 40,
  'upload-attempt': 18,
  'drag-outside': 16,
  'secure-preview': 0,
  'honeypot-access': 100,
  'sensitive-file-access': 20,
  'data-exfiltration': 45,
  'workflow-deviation': 20,
  'large-file-access': 20,
  'repeated-access': 14,
  'context-menu': 5,
  'inspect-attempt': 10
};

const intentForScore = (score, eventType = '', metadata = {}) => {
  if (eventType === 'honeypot-access' || score >= 80) {
    return { intent: 'Malicious', intentDetail: metadata?.fileName ? `Honeypot accessed: ${metadata.fileName}` : 'Possible insider data theft attempt' };
  }
  if (score >= 60) {
    return { intent: 'Suspicious', intentDetail: metadata?.reason || 'Unusual late-night access or workflow deviation' };
  }
  return { intent: 'Normal', intentDetail: metadata?.reason || 'Behaviour remains within baseline' };
};

const clampScore = (score) => Math.max(0, Math.min(100, score));

const sessionKey = (employeeId, sessionId) => `${employeeId}:${sessionId || 'default'}`;

const getSession = (employeeId, sessionId) => {
  const key = sessionKey(employeeId, sessionId);
  if (!securitySessions.has(key)) {
    securitySessions.set(key, {
      score: 0,
      warnings: 0,
      blocked: false,
      events: [],
      workflow: [],
      alerts: [],
      forcedLogouts: [],
      lastRoute: '',
      lastEventAt: null
    });
  }
  return securitySessions.get(key);
};

const updateBlockedEmployee = (employeeId, reason, score) => {
  blockedEmployees.set(employeeId, { reason, score, blockedAt: new Date().toISOString() });
};

export const setSecuritySocketServer = (server) => {
  socketServer = server;
};

export const isEmployeeBlocked = (employeeId) => blockedEmployees.get(employeeId) || null;

export const clearEmployeeBlock = (employeeId) => {
  blockedEmployees.delete(employeeId);
};

const pushFeed = (record) => {
  securityFeed.unshift(record);
  securityFeed.splice(100);
};

const persistEvent = async (record) => {
  if (demoMode) {
    return { ...record, _id: `demo-security-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  }
  return SecurityEvent.create(record);
};

const emitSecurity = (eventName, payload) => {
  if (socketServer) {
    socketServer.emit(eventName, payload);
  }
};

const buildWorkflowAlert = (role, route, previousRoute) => {
  const baseline = workflowBaselines[role] || workflowBaselines.Teller;
  const currentIndex = baseline.indexOf(route);
  const previousIndex = baseline.indexOf(previousRoute);
  if (currentIndex === -1) {
    return { deviation: true, reason: `Unexpected navigation to ${route}` };
  }
  if (previousRoute && previousIndex !== -1 && currentIndex > previousIndex + 1) {
    return { deviation: true, reason: `Skipped workflow step before ${route}` };
  }
  if (previousRoute && previousIndex !== -1 && currentIndex < previousIndex && currentIndex !== 0) {
    return { deviation: true, reason: `Unusual return from ${previousRoute} to ${route}` };
  }
  return { deviation: false, reason: '' };
};

export const evaluateSecurityEvent = async ({ employeeId, employeeName, role = 'Teller', sessionId = 'default', eventType, route = '', previousRoute = '', timestamp = new Date().toISOString(), metadata = {} }) => {
  const session = getSession(employeeId, sessionId);
  const alerts = [];
  let delta = eventWeights[eventType] ?? 0;
  let reason = metadata.reason || '';

  if (eventType === 'window-blur' || eventType === 'app-switch') {
    session.warnings += 1;
    delta += session.warnings > 1 ? 8 : 4;
    reason = reason || 'Window focus lost';
  }

  if (eventType === 'download-attempt' || eventType === 'bulk-download' || eventType === 'data-exfiltration') {
    reason = reason || 'Download or data exfiltration attempt blocked';
    session.warnings += 2;
    delta += 15;
  }

  if (eventType === 'upload-attempt') {
    reason = reason || 'Device upload attempt detected';
    delta += metadata.fileCount ? 10 : 6;
  }

  if (eventType === 'drag-outside') {
    reason = reason || 'Drag-and-drop outside application boundary';
  }

  if (eventType === 'honeypot-access') {
    reason = reason || `Honeypot accessed: ${metadata.fileName || 'sensitive trap file'}`;
    delta = 100;
  }

  if (eventType === 'navigation') {
    const workflowCheck = buildWorkflowAlert(role, route, previousRoute || session.lastRoute);
    if (workflowCheck.deviation) {
      delta += 15;
      session.warnings += 1;
      alerts.push({ level: 'warning', message: workflowCheck.reason });
      reason = reason || workflowCheck.reason;
    }
    session.workflow.push(route);
    session.workflow = session.workflow.slice(-20);
    session.lastRoute = route;
  }

  if (metadata.largeFile || Number(metadata.fileSize || 0) > 25 * 1024 * 1024) {
    delta += 20;
    alerts.push({ level: 'warning', message: 'Large file access detected' });
  }

  if (metadata.repeatAccess) {
    delta += 14;
    alerts.push({ level: 'warning', message: 'Repeated sensitive access' });
  }

  session.score = clampScore(session.score + delta);
  session.lastEventAt = timestamp;

  const classification = intentForScore(session.score, eventType, metadata);
  session.events.unshift({
    employeeId,
    employeeName,
    sessionId,
    eventType,
    route,
    previousRoute,
    score: session.score,
    delta,
    intent: classification.intent,
    intentDetail: classification.intentDetail,
    action: session.score >= 80 || eventType === 'honeypot-access' ? 'logout' : session.score >= 60 ? 'warn' : 'allow',
    reason: reason || classification.intentDetail,
    warnings: session.warnings,
    blocked: session.score >= 80 || eventType === 'honeypot-access',
    metadata,
    createdAt: timestamp
  });
  session.events = session.events.slice(0, 50);

  if (session.score >= 60) {
    alerts.push({ level: session.score >= 80 ? 'critical' : 'warning', message: classification.intentDetail });
  }

  if (session.score >= 80 || eventType === 'honeypot-access') {
    session.blocked = true;
    updateBlockedEmployee(employeeId, reason || classification.intentDetail, session.score);
    session.forcedLogouts.unshift({ reason: reason || classification.intentDetail, at: timestamp, score: session.score });
    session.forcedLogouts = session.forcedLogouts.slice(0, 10);
  }

  session.alerts = keepAlerts(session.alerts, alerts);

  const record = {
    employeeId,
    employeeName,
    sessionId,
    eventType,
    route,
    previousRoute,
    score: session.score,
    delta,
    intent: classification.intent,
    intentDetail: classification.intentDetail,
    action: session.score >= 80 || eventType === 'honeypot-access' ? 'logout' : session.score >= 60 ? 'warn' : 'allow',
    reason: reason || classification.intentDetail,
    warnings: session.warnings,
    blocked: session.score >= 80 || eventType === 'honeypot-access',
    metadata,
    createdAt: timestamp
  };

  const persisted = await persistEvent(record);
  pushFeed(persisted);
  emitSecurity('security:event', persisted);

  if (record.blocked) {
    emitSecurity('security:logout', {
      employeeId,
      employeeName,
      sessionId,
      eventType,
      message: 'Session terminated due to security policy violation',
      reason: record.reason,
      score: record.score
    });
  }

  await writeAuditLog({
    actorId: employeeId,
    actorRole: role,
    employeeName,
    action: record.blocked ? 'Security Policy Forced Logout' : session.score >= 60 ? 'Security Policy Warning' : 'Security Event Logged',
    module: 'Security',
    riskScore: record.score,
    metadata: { eventType, route, previousRoute, ...metadata, intent: record.intent, action: record.action }
  });

  if (record.blocked) {
    await createNotification({
      targetRole: role,
      employeeId,
      title: 'Session terminated due to security policy violation',
      message: record.reason,
      type: 'error',
      priority: 'high',
      metadata: { eventType, route, score: record.score }
    });
  } else if (session.score >= 60) {
    await createNotification({
      targetRole: role,
      employeeId,
      title: 'Security warning',
      message: classification.intentDetail,
      type: 'warning',
      priority: 'high',
      metadata: { eventType, route, score: record.score }
    });
  }

  return {
    event: persisted,
    score: record.score,
    intent: classification.intent,
    intentDetail: classification.intentDetail,
    warnings: session.warnings,
    blocked: record.blocked,
    action: record.action,
    reason: record.reason,
    activity: persisted,
    alert: alerts[0] || null,
    forceLogout: record.blocked ? { reason: record.reason, at: timestamp } : null,
    workflow: session.workflow,
    alerts: session.alerts
  };
};

const keepAlerts = (currentAlerts = [], incomingAlerts = []) => {
  const merged = [...incomingAlerts, ...currentAlerts];
  return merged.slice(0, 10);
};

const summarizeEvents = (events = []) => events.slice(0, 20).map((event) => ({
  id: event._id?.toString?.() || event._id || `${event.employeeId}-${event.createdAt}`,
  type: event.eventType,
  route: event.route,
  previousRoute: event.previousRoute,
  score: event.score,
  delta: event.delta,
  intent: event.intent,
  intentDetail: event.intentDetail,
  message: event.reason,
  action: event.action,
  blocked: event.blocked,
  metadata: event.metadata,
  createdAt: event.createdAt
}));

export const getSecurityOverview = async ({ employeeId, role = 'Teller', sessionId = 'default' }) => {
  const blocked = isEmployeeBlocked(employeeId);
  if (demoMode) {
    const current = demoSecurityFeed.filter((event) => event.employeeId === employeeId || role !== 'Teller');
    return {
      score: current[0]?.score || 42,
      intent: current[0]?.intent || 'Suspicious',
      intentDetail: current[0]?.intentDetail || 'Demo mode security insights',
      warnings: current.filter((event) => event.action === 'warn').length,
      blocked: Boolean(blocked),
      alerts: current.filter((event) => event.score >= 60).map((event) => ({ level: event.score >= 80 ? 'critical' : 'warning', message: event.intentDetail })),
      activity: current,
      forcedLogouts: current.filter((event) => event.blocked).map((event) => ({ reason: event.reason, at: event.createdAt })),
      workflow: workflowBaselines[role] || workflowBaselines.Teller,
      honeypots: ['VIP_accounts.xlsx', 'salary_master.xlsx'],
      policy: { warning: 60, terminate: 80 },
      sessionId
    };
  }

  const session = securitySessions.get(sessionKey(employeeId, sessionId)) || getSession(employeeId, sessionId);
  const recentRecords = session.events.length > 0 ? session.events : securityFeed.filter((event) => event.employeeId === employeeId || role !== 'Teller');
  const alerts = session.alerts.length > 0 ? session.alerts : recentRecords.filter((event) => event.score >= 60).map((event) => ({ level: event.score >= 80 ? 'critical' : 'warning', message: event.intentDetail }));

  return {
    score: session.score,
    intent: session.score >= 80 ? 'Malicious' : session.score >= 60 ? 'Suspicious' : 'Normal',
    intentDetail: session.score >= 80 ? 'Possible insider data theft attempt' : session.score >= 60 ? 'Unusual user behaviour detected' : 'Behaviour within baseline',
    warnings: session.warnings,
    blocked: Boolean(blocked) || session.blocked,
    alerts,
    activity: summarizeEvents(recentRecords),
    forcedLogouts: session.forcedLogouts,
    workflow: session.workflow,
    honeypots: ['VIP_accounts.xlsx', 'salary_master.xlsx'],
    policy: { warning: 60, terminate: 80 },
    sessionId
  };
};

export const getSecurityFeed = () => securityFeed.slice(0, 100);

export const blockEmployee = (employeeId, reason, score = 100) => {
  updateBlockedEmployee(employeeId, reason, score);
};