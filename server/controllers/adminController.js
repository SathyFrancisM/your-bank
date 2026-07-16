import { Employee } from '../models/Employee.js';
import { Manager } from '../models/Manager.js';
import { AuditLog } from '../models/AuditLog.js';
import { RiskScore } from '../models/RiskScore.js';

export const adminOverview = async (_req, res) => {
  const [employees, managers, logs, risks] = await Promise.all([
    Employee.countDocuments(),
    Manager.countDocuments(),
    AuditLog.countDocuments(),
    RiskScore.countDocuments()
  ]);

  res.json({
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
};
