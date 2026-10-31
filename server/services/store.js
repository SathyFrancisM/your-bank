import bcrypt from 'bcrypt';

const hash = bcrypt.hashSync('Bank@123', 10);
const randomChoice = (items) => items[Math.floor(Math.random() * items.length)];

const makeEmployee = (index, role) => ({
  _id: `emp-${role.toLowerCase()}-${index}`,
  employeeId: `${role.slice(0, 3).toUpperCase()}${String(index).padStart(3, '0')}`,
  name: role === 'Admin' ? 'Priya Mehta' : `${role} ${index}`,
  passwordHash: hash,
  role,
  email: role === 'Admin' ? 'priya.mehta@bankcorp.local' : `${role.toLowerCase()}${index}@bankcorp.local`,
  phone: `999000${String(index).padStart(4, '0')}`,
  department: role === 'Auditor' ? 'Audit' : role === 'Manager' ? 'Operations' : 'Branch Ops',
  branch: index % 2 === 0 ? 'Mumbai Central' : 'Delhi Prime',
  status: 'Active',
  permissions: role === 'Admin' ? ['all'] : role === 'Manager' ? ['approve-login', 'view-risk', 'view-recordings'] : role === 'Auditor' ? ['audit-read'] : ['operate-customers'],
  officeLocation: { latitude: 28.6139 + (index * 0.001), longitude: 77.209 + (index * 0.001), address: 'Corporate Office, New Delhi' },
  lastKnownDevice: 'Desktop',
  lastKnownBrowser: 'Google Chrome',
  lastKnownIpAddress: `203.0.113.${10 + index}`,
  failedLoginCount: 0,
  screenRecordingEnabled: true,
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
});

const generateInitialData = () => {
  const employees = [];
  employees.push(makeEmployee(1, 'Admin'));
  for (let i = 1; i <= 5; i += 1) employees.push(makeEmployee(i, 'Manager'));
  for (let i = 1; i <= 10; i += 1) employees.push(makeEmployee(i, 'Teller'));
  for (let i = 1; i <= 4; i += 1) employees.push(makeEmployee(i, 'Auditor'));

  const managers = employees.filter((e) => e.role === 'Manager').map((emp, idx) => ({
    _id: `mgr-record-${idx + 1}`,
    managerId: `MG${String(idx + 1).padStart(3, '0')}`,
    employeeId: emp.employeeId,
    name: emp.name,
    branch: emp.branch,
    department: emp.department,
    approvalLimit: 500000 + (idx * 250000),
    createdAt: new Date().toISOString()
  }));

  const customers = Array.from({ length: 100 }, (_, index) => ({
    _id: `cust-${index + 1}`,
    customerId: `CUST${String(index + 1).padStart(4, '0')}`,
    name: `Customer ${index + 1}`,
    phone: `98${String(70000000 + index).slice(-8)}`,
    aadhaar: `99990000${String(index + 1).padStart(4, '0')}`,
    pan: `PAN${String(index + 1).padStart(4, '0')}`,
    photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Customer${index + 1}`,
    kycStatus: 'Verified',
    address: `${index + 1}, Corporate Avenue, Mumbai`,
    city: randomChoice(['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Pune']),
    email: `customer${index + 1}@example.com`,
    accounts: [],
    cards: [{ cardType: 'Debit', maskedCardNumber: `XXXX-XXXX-XXXX-${String(1000 + index)}`, status: 'Active' }],
    upiId: `customer${index + 1}@bank`,
    tags: [randomChoice(['VIP', 'Salary', 'Retail', 'Corporate'])],
    notes: 'Seeded original customer',
    createdAt: new Date(Date.now() - (index + 1) * 86400000).toISOString()
  }));

  const accounts = customers.map((customer, index) => ({
    _id: `acc-${index + 1}`,
    accountNumber: `10${String(1000000 + index)}`.slice(-12),
    customerId: customer.customerId,
    customerName: customer.name,
    type: randomChoice(['Savings', 'Current', 'Salary', 'Zero Balance', 'Joint']),
    balance: 50000 + (index * 2500),
    status: 'Active',
    branch: randomChoice(['Mumbai Central', 'Delhi Prime', 'Bengaluru Tech Park']),
    openedBy: randomChoice(employees.filter((e) => e.role !== 'Auditor')).employeeId,
    openedAt: new Date(Date.now() - index * 86400000).toISOString(),
    createdAt: new Date(Date.now() - index * 86400000).toISOString()
  }));

  customers.forEach((cust, idx) => {
    cust.accounts = [{
      accountNumber: accounts[idx].accountNumber,
      type: accounts[idx].type,
      status: accounts[idx].status,
      balance: accounts[idx].balance
    }];
  });

  const transactions = Array.from({ length: 150 }, (_, index) => {
    const account = randomChoice(accounts);
    const debit = Math.random() > 0.5;
    const amount = index % 37 === 0 ? Math.floor(550000 + Math.random() * 450000) : Math.floor(1000 + Math.random() * 250000);
    return {
      _id: `txn-${index + 1}`,
      transactionId: `TXN${String(index + 1).padStart(6, '0')}`,
      customerId: account.customerId,
      accountNumber: account.accountNumber,
      type: debit ? 'Withdraw' : 'Deposit',
      channel: randomChoice(['Cash', 'Cheque', 'Online', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'Internal']),
      amount,
      narration: debit ? 'Cash withdrawal' : 'Deposit credit',
      status: 'Success',
      balanceBefore: account.balance,
      balanceAfter: debit ? Math.max(0, account.balance - amount) : account.balance + amount,
      createdBy: randomChoice(employees.filter((e) => e.role !== 'Auditor')).employeeId,
      branch: account.branch,
      createdAt: new Date(Date.now() - index * 3600000).toISOString()
    };
  });

  const loans = Array.from({ length: 20 }, (_, index) => ({
    _id: `loan-${index + 1}`,
    loanNumber: `LN${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index].customerId,
    customerName: customers[index].name,
    type: randomChoice(['Personal Loan', 'Home Loan', 'Gold Loan', 'Vehicle Loan']),
    amount: 250000 + index * 50000,
    interestRate: randomChoice([9.5, 10.5, 11.25, 12]),
    tenureMonths: randomChoice([24, 36, 48, 60]),
    emi: Math.floor((250000 + index * 50000) / 36),
    approvalStatus: randomChoice(['Pending', 'Approved', 'Rejected']),
    riskScore: Math.floor(Math.random() * 100),
    remarks: 'Original loan record',
    createdAt: new Date().toISOString()
  }));

  const fds = Array.from({ length: 10 }, (_, index) => ({
    _id: `fd-${index + 1}`,
    fdNumber: `FD${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index].customerId,
    customerName: customers[index].name,
    principal: 100000 + index * 25000,
    interestRate: randomChoice([6.5, 7, 7.5]),
    tenureMonths: randomChoice([12, 24, 36]),
    maturityAmount: Math.floor((100000 + index * 25000) * 1.15),
    maturityDate: new Date(Date.now() + (index + 12) * 86400000).toISOString(),
    lockPeriodMonths: 6,
    status: 'Active',
    createdBy: randomChoice(employees.filter((e) => e.role !== 'Auditor')).employeeId,
    createdAt: new Date().toISOString()
  }));

  const rds = Array.from({ length: 10 }, (_, index) => ({
    _id: `rd-${index + 1}`,
    rdNumber: `RD${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index + 20].customerId,
    customerName: customers[index + 20].name,
    monthlyDeposit: 5000 + index * 1000,
    interestRate: randomChoice([6.75, 7.1, 7.5]),
    tenureMonths: randomChoice([12, 24, 36]),
    maturityAmount: Math.floor((5000 + index * 1000) * 36 * 1.1),
    maturityDate: new Date(Date.now() + (index + 15) * 86400000).toISOString(),
    status: 'Active',
    createdBy: randomChoice(employees.filter((e) => e.role !== 'Auditor')).employeeId,
    createdAt: new Date().toISOString()
  }));

  const riskScores = employees.map((emp, index) => ({
    _id: `risk-${index + 1}`,
    employeeId: emp.employeeId,
    employeeName: emp.name,
    score: index === 0 ? 18 : index % 3 === 0 ? 72 : 38,
    level: index === 0 ? 'Safe' : index % 3 === 0 ? 'High Risk' : 'Medium',
    reasons: index === 0 ? ['Login within office hours'] : ['Different device', 'Outside Office'],
    suggestedAction: index % 3 === 0 ? 'Escalate to manager and compliance review' : 'Monitor session and restrict exports',
    updatedAt: new Date().toISOString()
  }));

  const notifications = [
    { _id: 'notif-1', targetRole: 'Manager', title: 'System Active', message: 'Banking portal secure access engine running.', type: 'info', priority: 'normal', createdAt: new Date().toISOString() },
    { _id: 'notif-2', targetRole: 'Admin', title: 'Security Monitor', message: 'Zero-trust employee security rules in place.', type: 'warning', priority: 'high', createdAt: new Date().toISOString() }
  ];

  const loginRequests = [
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

  const auditLogs = [
    { _id: 'audit-1', actorId: 'ADM001', actorRole: 'Admin', employeeName: 'Priya Mehta', action: 'System Initialization', module: 'System', ipAddress: '203.0.113.10', device: 'Desktop', browser: 'Google Chrome', os: 'Windows', riskScore: 18, createdAt: new Date().toISOString() }
  ];

  const screenRecordings = employees.slice(0, 4).map((emp, index) => ({
    _id: `rec-${index + 1}`,
    employeeId: emp.employeeId,
    employeeName: emp.name,
    startTime: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
    endTime: new Date(Date.now() - index * 3600000).toISOString(),
    status: 'Stopped',
    fileName: `recording-${index + 1}.webm`,
    fileUrl: `/recordings/${index + 1}.webm`,
    notes: 'Session audit recording',
    createdAt: new Date().toISOString()
  }));

  return {
    employees,
    managers,
    customers,
    accounts,
    transactions,
    loans,
    fds,
    rds,
    riskscores: riskScores,
    notifications,
    loginrequests: loginRequests,
    auditlogs: auditLogs,
    screenrecordings: screenRecordings,
    refreshtokens: []
  };
};

class DataStore {
  constructor() {
    this.data = generateInitialData();
  }

  getCollection(name) {
    const key = name.toLowerCase().replace(/s$/, '') + 's';
    if (!this.data[key]) {
      this.data[key] = [];
    }
    return this.data[key];
  }

  find(collectionName, query = {}, options = {}) {
    const list = this.getCollection(collectionName);
    const { searchFields = [], limit = 100 } = options;

    let filtered = list.filter((item) => {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '') continue;
        if (k === 'q' && searchFields.length > 0) {
          const regex = new RegExp(String(v), 'i');
          const matched = searchFields.some((field) => regex.test(String(item[field] || '')));
          if (!matched) return false;
          continue;
        }
        if (typeof v === 'object' && v.$or) {
          const matchOr = v.$or.some((condition) => {
            return Object.entries(condition).every(([ck, cv]) => {
              if (cv instanceof RegExp) return cv.test(String(item[ck] || ''));
              return item[ck] === cv;
            });
          });
          if (!matchOr) return false;
          continue;
        }
        if (v instanceof RegExp) {
          if (!v.test(String(item[k] || ''))) return false;
        } else if (String(item[k]) !== String(v)) {
          return false;
        }
      }
      return true;
    });

    return filtered.slice(0, limit);
  }

  findOne(collectionName, query = {}) {
    const results = this.find(collectionName, query, { limit: 1 });
    return results[0] || null;
  }

  findById(collectionName, id) {
    const list = this.getCollection(collectionName);
    return list.find((item) => String(item._id || item.id) === String(id)) || null;
  }

  create(collectionName, doc) {
    const list = this.getCollection(collectionName);
    const created = {
      _id: doc._id || `gen-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(created);
    return created;
  }

  findByIdAndUpdate(collectionName, id, update, options = {}) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => String(item._id || item.id) === String(id));
    if (index === -1) {
      if (options.upsert) {
        return this.create(collectionName, { _id: id, ...update });
      }
      return null;
    }
    const current = list[index];
    const updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    list[index] = updated;
    return updated;
  }

  findByIdAndDelete(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => String(item._id || item.id) === String(id));
    if (index === -1) return null;
    const [deleted] = list.splice(index, 1);
    return deleted;
  }

  countDocuments(collectionName, query = {}) {
    return this.find(collectionName, query, { limit: 100000 }).length;
  }

  updateEmployee(employeeId, fields) {
    const emp = this.findOne('employees', { employeeId });
    if (emp) {
      Object.assign(emp, fields, { updatedAt: new Date().toISOString() });
      return emp;
    }
    return null;
  }

  saveRefreshToken(employeeId, token, expiresAt) {
    const tokens = this.getCollection('refreshtokens');
    const existingIndex = tokens.findIndex((t) => t.employeeId === employeeId);
    if (existingIndex !== -1) {
      tokens.splice(existingIndex, 1);
    }
    tokens.push({ employeeId, token, expiresAt });
  }

  hasRefreshToken(token) {
    const tokens = this.getCollection('refreshtokens');
    const found = tokens.find((t) => t.token === token);
    if (!found) return null;
    if (new Date() > new Date(found.expiresAt)) {
      this.deleteRefreshToken(token);
      return null;
    }
    return found;
  }

  deleteRefreshToken(token) {
    const tokens = this.getCollection('refreshtokens');
    const idx = tokens.findIndex((t) => t.token === token);
    if (idx !== -1) tokens.splice(idx, 1);
  }
}

export const store = new DataStore();

export const demoEmployees = store.getCollection('employees');
export const demoLoginRequests = store.getCollection('loginrequests');
export const demoRiskScores = store.getCollection('riskscores');
export const demoNotifications = store.getCollection('notifications');
export const demoTransactions = store.getCollection('transactions');

export const demoDashboard = {
  get employee() {
    return {
      customers: store.countDocuments('customers'),
      accounts: store.countDocuments('accounts'),
      transactions: store.find('transactions', {}, { limit: 20 }),
      notifications: store.find('notifications', {}, { limit: 10 }),
      logs: store.find('auditlogs', {}, { limit: 10 })
    };
  },
  get manager() {
    return {
      requests: store.find('loginrequests', {}, { limit: 20 }),
      recordings: store.find('screenrecordings', {}, { limit: 20 }),
      risks: store.find('riskscores', {}, { limit: 20 }),
      employees: store.find('employees', {}, { limit: 20 })
    };
  },
  get admin() {
    return {
      employees: store.countDocuments('employees'),
      managers: store.countDocuments('managers'),
      logs: store.countDocuments('auditlogs'),
      risks: store.countDocuments('riskscores')
    };
  },
  get auditor() {
    return {
      logs: store.find('auditlogs', {}, { limit: 30 }),
      risks: store.find('riskscores', {}, { limit: 30 }),
      recordings: store.find('screenrecordings', {}, { limit: 30 })
    };
  }
};
