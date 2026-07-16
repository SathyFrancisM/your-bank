import { AuditLog } from '../models/AuditLog.js';
import { demoMode } from '../config/db.js';

export const writeAuditLog = async ({ actorId, actorRole, employeeName, action, module, entityType = '', entityId = '', ipAddress = '', device = '', browser = '', os = '', location = {}, riskScore = 0, metadata = {} }) => {
  if (demoMode) {
    return {
      actorId,
      actorRole,
      employeeName,
      action,
      module,
      entityType,
      entityId,
      ipAddress,
      device,
      browser,
      os,
      location,
      riskScore,
      metadata,
      demoMode: true
    };
  }
  return AuditLog.create({
    actorId,
    actorRole,
    employeeName,
    action,
    module,
    entityType,
    entityId,
    ipAddress,
    device,
    browser,
    os,
    location,
    riskScore,
    metadata
  });
};
