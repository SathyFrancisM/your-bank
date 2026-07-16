import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { RequireAuth, PublicOnly } from './components/RouteGuards.jsx';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const OtpPage = lazy(() => import('./pages/OtpPage.jsx'));
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage.jsx'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect.jsx'));
const EmployeeDashboardPage = lazy(() => import('./pages/EmployeeDashboardPage.jsx'));
const ManagerDashboardPage = lazy(() => import('./pages/ManagerDashboardPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));
const AuditorDashboardPage = lazy(() => import('./pages/AuditorDashboardPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const AccountsPage = lazy(() => import('./pages/AccountsPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'));
const FdPage = lazy(() => import('./pages/FdPage.jsx'));
const RdPage = lazy(() => import('./pages/RdPage.jsx'));
const LoansPage = lazy(() => import('./pages/LoansPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const RecordingsPage = lazy(() => import('./pages/RecordingsPage.jsx'));
const RiskPage = lazy(() => import('./pages/RiskPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const SecurityPage = lazy(() => import('./pages/SecurityPage.jsx'));

const fallback = <div className="min-h-screen p-8 text-sm text-slate-600 dark:text-slate-300">Loading banking portal...</div>;

export default function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<Layout title="Core Banking Portal" subtitle="Internal bank employee operations and threat monitoring." />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="auditor/dashboard" element={<AuditorDashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="fd" element={<FdPage />} />
            <Route path="rd" element={<RdPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="recordings" element={<RecordingsPage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
