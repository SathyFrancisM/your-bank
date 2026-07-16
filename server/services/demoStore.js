import bcrypt from 'bcrypt';

const hash = bcrypt.hashSync('Bank@123', 12);

export const demoEmployees = [
  {
    _id: 'demo-admin-1',
    employeeId: 'ADM001',
    name: 'Priya Mehta',
    passwordHash: hash,
    role: 'Admin',
    email: 'priya.mehta@bankcorp.local',
    phone: '9990000001',
    department: 'Operations',
    branch: 'Corporate',
    status: 'Active',
    permissions: ['all'],
    officeLocation: { latitude: 28.6139, longitude: 77.209, address: 'Corporate Office, New Delhi' },
    lastKnownDevice: 'Desktop',
    lastKnownBrowser: 'Google Chrome',
    lastKnownIpAddress: '203.0.113.10'
  },
  {
    _id: 'demo-manager-1',
    employeeId: 'MGR001',
    name: 'Manager 1',
    passwordHash: hash,
    role: 'Manager',
    email: 'manager1@bankcorp.local',
    phone: '9990000002',
    department: 'Operations',
    branch: 'Mumbai Central',
    status: 'Active',
    permissions: ['approve-login', 'view-risk', 'view-recordings'],
    officeLocation: { latitude: 28.6139, longitude: 77.209, address: 'Corporate Office, New Delhi' },
    lastKnownDevice: 'Desktop',
    lastKnownBrowser: 'Google Chrome',
    lastKnownIpAddress: '203.0.113.11'
  },
  {
    _id: 'demo-teller-1',
    employeeId: 'TEL001',
    name: 'Teller 1',
    passwordHash: hash,
    role: 'Teller',
    email: 'teller1@bankcorp.local',
    phone: '9990000003',
    department: 'Branch Ops',
    branch: 'Delhi Prime',
    status: 'Active',
    permissions: ['operate-customers'],
    officeLocation: { latitude: 28.6139, longitude: 77.209, address: 'Corporate Office, New Delhi' },
    lastKnownDevice: 'Desktop',
    lastKnownBrowser: 'Google Chrome',
    lastKnownIpAddress: '203.0.113.12'
  },
  {
    _id: 'demo-auditor-1',
    employeeId: 'AUD001',
    name: 'Auditor 1',
    passwordHash: hash,
    role: 'Auditor',
    email: 'auditor1@bankcorp.local',
    phone: '9990000004',
    department: 'Audit',
    branch: 'Corporate',
    status: 'Active',
    permissions: ['audit-read'],
    officeLocation: { latitude: 28.6139, longitude: 77.209, address: 'Corporate Office, New Delhi' },
    lastKnownDevice: 'Desktop',
    lastKnownBrowser: 'Google Chrome',
    lastKnownIpAddress: '203.0.113.13'
  }
];

export const demoLoginRequests = [
  {
    _id: 'demo-login-1',
    employeeId: 'TEL001',
    employeeName: 'Teller 1',
    reason: ['Late Night', 'Outside Office', 'Different Device', 'Unknown IP'],
    location: { latitude: 12.9716, longitude: 77.5946, address: 'Bengaluru' },
    ipAddress: '198.51.100.42',
    device: 'Mobile',
    browser: 'Unknown Browser',
    os: 'Android',
    timezone: 'Asia/Kolkata',
    officeMatch: false,
    timeWindowMatch: false,
    deviceMatch: false,
    browserMatch: false,
    riskScore: 88,
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

export const demoRiskScores = [
  { employeeId: 'TEL001', employeeName: 'Teller 1', score: 88, level: 'High Risk', reasons: ['Late Night', 'Outside Office', 'Different Device', 'Unknown IP'], suggestedAction: 'Escalate to manager and compliance review' },
  { employeeId: 'MGR001', employeeName: 'Manager 1', score: 38, level: 'Medium', reasons: ['Different device'], suggestedAction: 'Monitor session and restrict exports' },
  { employeeId: 'ADM001', employeeName: 'Priya Mehta', score: 18, level: 'Safe', reasons: ['Login within office hours'], suggestedAction: 'Continue with normal controls' }
];

export const demoNotifications = [
  { title: 'Demo Mode Active', message: 'MongoDB is unavailable. Using in-memory prototype data.', type: 'warning', priority: 'high' },
  { title: 'Unusual login detected', message: 'Teller 1 requires manager approval to continue.', type: 'error', priority: 'high' }
];

export const demoTransactions = [
  { transactionId: 'TXN000001', accountNumber: '100000000001', type: 'Deposit', channel: 'Cash', amount: 25000, status: 'Success' },
  { transactionId: 'TXN000002', accountNumber: '100000000002', type: 'Withdraw', channel: 'UPI', amount: 18000, status: 'Success' },
  { transactionId: 'TXN000003', accountNumber: '100000000003', type: 'Transfer', channel: 'Internal', amount: 650000, status: 'Success' }
];

export const demoDashboard = {
  employee: {
    customers: 100,
    accounts: 100,
    transactions: demoTransactions,
    notifications: demoNotifications,
    logs: []
  },
  manager: {
    requests: demoLoginRequests,
    recordings: [
      { employeeName: 'Teller 1', startTime: new Date().toISOString(), endTime: null, status: 'Active' }
    ],
    risks: demoRiskScores,
    employees: demoEmployees
  },
  admin: { employees: 100, managers: 5, logs: 250, risks: 20 },
  auditor: {
    logs: [
      { action: 'Login', module: 'Authentication', actorId: 'TEL001' },
      { action: 'Manual Database Update', module: 'Admin', actorId: 'MGR001' }
    ],
    risks: demoRiskScores,
    recordings: []
  }
};
