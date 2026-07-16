import bcrypt from 'bcrypt';
import { connectDatabase } from '../config/db.js';
import { Employee } from '../models/Employee.js';
import { Manager } from '../models/Manager.js';
import { Customer } from '../models/Customer.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Loan } from '../models/Loan.js';
import { Fd } from '../models/Fd.js';
import { Rd } from '../models/Rd.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { RiskScore } from '../models/RiskScore.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { ScreenRecording } from '../models/ScreenRecording.js';

const hash = async (value) => bcrypt.hash(value, 12);
const roles = ['Admin', 'Manager', 'Teller', 'Auditor'];

const makeEmployee = (index, role) => ({
  employeeId: `${role.slice(0, 3).toUpperCase()}${String(index).padStart(3, '0')}`,
  name: `${role} ${index}`,
  passwordHash: '',
  role,
  email: `${role.toLowerCase()}${index}@bankcorp.local`,
  phone: `999000${String(index).padStart(4, '0')}`,
  department: role === 'Auditor' ? 'Audit' : role === 'Manager' ? 'Operations' : 'Branch Ops',
  branch: index % 2 === 0 ? 'Mumbai Central' : 'Delhi Prime',
  status: 'Active',
  permissions: role === 'Admin' ? ['all'] : role === 'Manager' ? ['approve-login', 'view-risk', 'view-recordings'] : ['operate-customers'] ,
  officeLocation: { latitude: 28.6139 + (index * 0.001), longitude: 77.209 + (index * 0.001), address: 'Corporate Office, New Delhi' }
});

const randomChoice = (items) => items[Math.floor(Math.random() * items.length)];
const sample = (index, prefix) => `${prefix}${String(index).padStart(4, '0')}`;

const seed = async () => {
  await connectDatabase();

  const passwordHash = await hash('Bank@123');
  const employeeDocs = [];

  const primaryAdmin = { ...makeEmployee(1, 'Admin'), employeeId: 'ADM001', name: 'Priya Mehta', email: 'priya.mehta@bankcorp.local', passwordHash };
  employeeDocs.push(primaryAdmin);

  for (let i = 1; i <= 5; i += 1) {
    employeeDocs.push({ ...makeEmployee(i, 'Manager'), employeeId: `MGR${String(i).padStart(3, '0')}`, name: `Manager ${i}`, passwordHash });
  }
  for (let i = 1; i <= 10; i += 1) {
    employeeDocs.push({ ...makeEmployee(i, 'Teller'), employeeId: `TEL${String(i).padStart(3, '0')}`, name: `Teller ${i}`, passwordHash });
  }
  for (let i = 1; i <= 4; i += 1) {
    employeeDocs.push({ ...makeEmployee(i, 'Auditor'), employeeId: `AUD${String(i).padStart(3, '0')}`, name: `Auditor ${i}`, passwordHash });
  }

  await Promise.all([Employee.deleteMany({}), Manager.deleteMany({}), Customer.deleteMany({}), Account.deleteMany({}), Transaction.deleteMany({}), Loan.deleteMany({}), Fd.deleteMany({}), Rd.deleteMany({}), AuditLog.deleteMany({}), Notification.deleteMany({}), RiskScore.deleteMany({}), LoginRequest.deleteMany({}), ScreenRecording.deleteMany({})]);
  await Employee.insertMany(employeeDocs);
  await Manager.insertMany(employeeDocs.filter((employee) => employee.role === 'Manager').map((employee, index) => ({ managerId: `MG${String(index + 1).padStart(3, '0')}`, employeeId: employee.employeeId, name: employee.name, branch: employee.branch, department: employee.department, approvalLimit: 500000 + (index * 250000) })));

  const customers = Array.from({ length: 100 }, (_, index) => ({
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
    notes: 'Seeded demo customer'
  }));
  await Customer.insertMany(customers);

  const accountDocs = customers.map((customer, index) => ({
    accountNumber: `10${String(1000000 + index)}`.slice(-12),
    customerId: customer.customerId,
    customerName: customer.name,
    type: randomChoice(['Savings', 'Current', 'Salary', 'Zero Balance', 'Joint']),
    balance: 50000 + (index * 2500),
    status: 'Active',
    branch: randomChoice(['Mumbai Central', 'Delhi Prime', 'Bengaluru Tech Park']),
    openedBy: randomChoice(employeeDocs.filter((employee) => employee.role !== 'Auditor')).employeeId,
    openedAt: new Date(Date.now() - index * 86400000)
  }));
  await Account.insertMany(accountDocs);

  await Customer.updateMany({}, { $set: { accounts: accountDocs.map((account) => ({ accountNumber: account.accountNumber, type: account.type, status: account.status, balance: account.balance })) } });

  const transactions = Array.from({ length: 500 }, (_, index) => {
    const account = randomChoice(accountDocs);
    const debit = Math.random() > 0.5;
    const amount = index % 37 === 0 ? Math.floor(550000 + Math.random() * 450000) : Math.floor(1000 + Math.random() * 250000);
    return {
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
      createdBy: randomChoice(employeeDocs.filter((employee) => employee.role !== 'Auditor')).employeeId,
      branch: account.branch,
      metadata: { seeded: true }
    };
  });
  await Transaction.insertMany(transactions);

  const suspiciousTransactions = transactions.slice(0, 12).map((transaction, index) => ({
    ...transaction,
    transactionId: `SUS${String(index + 1).padStart(6, '0')}`,
    amount: index % 2 === 0 ? 650000 : 950000,
    channel: index % 2 === 0 ? 'Online' : 'Internal',
    narration: 'Anomalous high-risk transfer pattern',
    metadata: { seeded: true, suspicious: true, pattern: index % 2 === 0 ? 'Repeated access to same customer' : 'High-value transfer' }
  }));
  await Transaction.insertMany(suspiciousTransactions);

  const loans = Array.from({ length: 20 }, (_, index) => ({
    loanNumber: `LN${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index].customerId,
    customerName: customers[index].name,
    type: randomChoice(['Personal Loan', 'Home Loan', 'Gold Loan', 'Vehicle Loan']),
    amount: 250000 + index * 50000,
    interestRate: randomChoice([9.5, 10.5, 11.25, 12]),
    tenureMonths: randomChoice([24, 36, 48, 60]),
    emi: 0,
    approvalStatus: randomChoice(['Pending', 'Approved', 'Rejected']),
    riskScore: Math.floor(Math.random() * 100),
    remarks: 'Seeded loan record'
  }));
  await Loan.insertMany(loans);

  const fds = Array.from({ length: 10 }, (_, index) => ({
    fdNumber: `FD${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index].customerId,
    customerName: customers[index].name,
    principal: 100000 + index * 25000,
    interestRate: randomChoice([6.5, 7, 7.5]),
    tenureMonths: randomChoice([12, 24, 36]),
    maturityAmount: 0,
    maturityDate: new Date(Date.now() + (index + 12) * 86400000),
    lockPeriodMonths: 6,
    status: 'Active',
    createdBy: randomChoice(employeeDocs.filter((employee) => employee.role !== 'Auditor')).employeeId
  }));
  await Fd.insertMany(fds);

  const rds = Array.from({ length: 10 }, (_, index) => ({
    rdNumber: `RD${String(index + 1).padStart(5, '0')}`,
    customerId: customers[index + 20].customerId,
    customerName: customers[index + 20].name,
    monthlyDeposit: 5000 + index * 1000,
    interestRate: randomChoice([6.75, 7.1, 7.5]),
    tenureMonths: randomChoice([12, 24, 36]),
    maturityAmount: 0,
    maturityDate: new Date(Date.now() + (index + 15) * 86400000),
    status: 'Active',
    createdBy: randomChoice(employeeDocs.filter((employee) => employee.role !== 'Auditor')).employeeId
  }));
  await Rd.insertMany(rds);

  await RiskScore.insertMany(employeeDocs.map((employee, index) => ({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    score: index === 0 ? 18 : index % 3 === 0 ? 72 : 38,
    level: index === 0 ? 'Safe' : index % 3 === 0 ? 'High Risk' : 'Medium',
    reasons: index === 0 ? ['Login within office hours'] : ['Different device', 'Outside Office'],
    suggestedAction: index % 3 === 0 ? 'Escalate to manager and compliance review' : 'Monitor session and restrict exports'
  })));

  await Notification.insertMany([
    { targetRole: 'Manager', title: 'Seed Complete', message: 'Banking portal demo data has been loaded.', type: 'info', priority: 'normal' },
    { targetRole: 'Admin', title: 'Security Review', message: 'One employee has a high risk score in the seeded data.', type: 'warning', priority: 'high' },
    { targetRole: 'Manager', title: 'Suspicious Transfer Burst', message: 'Multiple high-value transactions were generated for insider-threat monitoring.', type: 'error', priority: 'high' }
  ]);

  await LoginRequest.insertMany(employeeDocs.slice(1, 4).map((employee, index) => ({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    reason: index === 0 ? ['Outside Office'] : ['Late Night', 'Different Device'],
    location: { latitude: 19.076, longitude: 72.8777, address: 'Mumbai' },
    ipAddress: '203.0.113.10',
    device: 'Desktop',
    browser: 'Google Chrome',
    os: 'Windows',
    timezone: 'Asia/Kolkata',
    officeMatch: false,
    timeWindowMatch: false,
    deviceMatch: false,
    browserMatch: true,
    riskScore: index === 0 ? 45 : 68,
    status: 'Pending'
  })));

  await LoginRequest.insertMany([
    {
      employeeId: 'TEL005',
      employeeName: 'Teller 5',
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
      status: 'Pending'
    }
  ]);

  await AuditLog.insertMany([
    { actorId: 'TEL005', actorRole: 'Teller', employeeName: 'Teller 5', action: 'Customer Data Export Attempt', module: 'Customers', ipAddress: '198.51.100.42', device: 'Mobile', browser: 'Unknown Browser', os: 'Android', location: { city: 'Bengaluru' }, riskScore: 88, metadata: { suspicious: true } },
    { actorId: 'MGR003', actorRole: 'Manager', employeeName: 'Manager 3', action: 'Manual Database Update', module: 'Admin', ipAddress: '203.0.113.50', device: 'Desktop', browser: 'Google Chrome', os: 'Windows', location: { city: 'Delhi' }, riskScore: 70, metadata: { suspicious: true } }
  ]);

  await ScreenRecording.insertMany(employeeDocs.slice(0, 5).map((employee, index) => ({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    startTime: new Date(Date.now() - (index + 1) * 3600000),
    endTime: new Date(Date.now() - index * 3600000),
    status: 'Stopped',
    fileName: `recording-${index + 1}.webm`,
    fileUrl: `/recordings/${index + 1}.webm`,
    notes: 'Seeded history'
  })));

  console.log('Seed data created successfully');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
