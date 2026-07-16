const pickLevel = (score) => {
  if (score > 60) return 'High Risk';
  if (score >= 30) return 'Medium';
  return 'Safe';
};

export const calculateEmployeeRisk = ({ loginReasons = [], recentTransactionCount = 0, repeatedCustomerAccess = 0, highValueTransaction = 0, failedLogins = 0, customerDataExported = false, manualDbUpdate = false, anomalousPatterns = [] }) => {
  let score = 0;
  const reasons = [];

  const add = (points, reason) => {
    score += points;
    reasons.push(reason);
  };

  if (loginReasons.includes('Late Night')) add(25, 'Login outside office hours');
  if (loginReasons.includes('Outside Office')) add(30, 'Login outside office location');
  if (loginReasons.includes('Different Device')) add(10, 'Different device');
  if (loginReasons.includes('Different Browser')) add(10, 'Different browser');
  if (repeatedCustomerAccess > 0) add(15, 'Repeated access to same customer');
  if (recentTransactionCount > 10) add(30, 'More than 10 transactions in 5 minutes');
  if (highValueTransaction > 500000) add(20, 'More than ₹5,00,000 transaction');
  if (failedLogins >= 3) add(15, 'Too many failed logins');
  if (customerDataExported) add(40, 'Customer data exported');
  if (manualDbUpdate) add(50, 'Manual database update');

  anomalousPatterns.forEach((pattern) => {
    if (pattern && !reasons.includes(pattern)) {
      reasons.push(pattern);
    }
  });

  const level = pickLevel(score);
  const suggestedAction = level === 'High Risk' ? 'Escalate to manager and compliance review' : level === 'Medium' ? 'Monitor session and restrict exports' : 'Allow with normal controls';

  return { score, level, reasons, suggestedAction };
};
