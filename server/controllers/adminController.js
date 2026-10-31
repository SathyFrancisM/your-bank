import { Employee } from '../models/Employee.js';
import { Manager } from '../models/Manager.js';
import { AuditLog } from '../models/AuditLog.js';
import { RiskScore } from '../models/RiskScore.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

export const adminOverview = async (_req, res) => {
  if (demoMode) {
    return res.json({
      data: {
        employees: store.countDocuments('employees'),
        managers: store.countDocuments('managers'),
        logs: store.countDocuments('auditlogs'),
        risks: store.countDocuments('riskscores'),
        permissions: [
          'Manage Employees',
          'Manage Managers',
          'Roles',
          'Permissions',
          'Logs',
          'Reports',
          'Settings'
        ]
      }
    });
  }

  try {
    const [employees, managers, logs, risks] = await Promise.all([
      Employee.countDocuments(),
      Manager.countDocuments(),
      AuditLog.countDocuments(),
      RiskScore.countDocuments()
    ]);

    return res.json({
      data: {
        employees,
        managers,
        logs,
        risks,
        permissions: [
          'Manage Employees',
          'Manage Managers',
          'Roles',
          'Permissions',
          'Logs',
          'Reports',
          'Settings'
        ]
      }
    });
  } catch {
    return res.json({
      data: {
        employees: store.countDocuments('employees'),
        managers: store.countDocuments('managers'),
        logs: store.countDocuments('auditlogs'),
        risks: store.countDocuments('riskscores'),
        permissions: [
          'Manage Employees',
          'Manage Managers',
          'Roles',
          'Permissions',
          'Logs',
          'Reports',
          'Settings'
        ]
      }
    });
  }
};
