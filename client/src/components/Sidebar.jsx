import { NavLink } from 'react-router-dom';
import { FaChartLine, FaUsers, FaUserShield, FaWallet, FaExchangeAlt, FaPiggyBank, FaHandHoldingUsd, FaFileAlt, FaBell, FaVideo, FaShieldAlt, FaUserCog } from 'react-icons/fa';

const linksByRole = {
  Admin: [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: FaUserShield },
    { to: '/customers', label: 'Customers', icon: FaUsers },
    { to: '/accounts', label: 'Accounts', icon: FaWallet },
    { to: '/transactions', label: 'Transactions', icon: FaExchangeAlt },
    { to: '/reports', label: 'Reports', icon: FaFileAlt },
    { to: '/audit-logs', label: 'Audit Logs', icon: FaShieldAlt },
    { to: '/notifications', label: 'Notifications', icon: FaBell },
    { to: '/recordings', label: 'Recordings', icon: FaVideo },
    { to: '/risk', label: 'Risk Scores', icon: FaChartLine },
    { to: '/profile', label: 'Profile', icon: FaUserCog }
  ],
  Manager: [
    { to: '/manager/dashboard', label: 'Manager Dashboard', icon: FaUserShield },
    { to: '/customers', label: 'Customers', icon: FaUsers },
    { to: '/accounts', label: 'Accounts', icon: FaWallet },
    { to: '/transactions', label: 'Transactions', icon: FaExchangeAlt },
    { to: '/fd', label: 'Fixed Deposits', icon: FaPiggyBank },
    { to: '/rd', label: 'Recurring Deposits', icon: FaChartLine },
    { to: '/loans', label: 'Loans', icon: FaHandHoldingUsd },
    { to: '/reports', label: 'Reports', icon: FaFileAlt },
    { to: '/audit-logs', label: 'Audit Logs', icon: FaShieldAlt },
    { to: '/recordings', label: 'Recordings', icon: FaVideo }
  ],
  Teller: [
    { to: '/employee/dashboard', label: 'Employee Dashboard', icon: FaChartLine },
    { to: '/customers', label: 'Customers', icon: FaUsers },
    { to: '/accounts', label: 'Accounts', icon: FaWallet },
    { to: '/transactions', label: 'Transactions', icon: FaExchangeAlt },
    { to: '/fd', label: 'Fixed Deposits', icon: FaPiggyBank },
    { to: '/rd', label: 'Recurring Deposits', icon: FaChartLine },
    { to: '/loans', label: 'Loans', icon: FaHandHoldingUsd },
    { to: '/notifications', label: 'Notifications', icon: FaBell },
    { to: '/profile', label: 'Profile', icon: FaUserCog }
  ],
  Auditor: [
    { to: '/auditor/dashboard', label: 'Auditor Dashboard', icon: FaShieldAlt },
    { to: '/audit-logs', label: 'Audit Logs', icon: FaFileAlt },
    { to: '/risk', label: 'Risk Scores', icon: FaChartLine },
    { to: '/notifications', label: 'Notifications', icon: FaBell },
    { to: '/profile', label: 'Profile', icon: FaUserCog }
  ]
};

export default function Sidebar({ role = 'Teller' }) {
  const links = linksByRole[role] || linksByRole.Teller;

  return (
    <aside className="glass-card hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 overflow-hidden rounded-[2rem] p-4 lg:flex lg:flex-col">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Internal Banking Suite</p>
        <h1 className="mt-3 font-display text-2xl font-bold leading-tight">Core Banking Portal</h1>
        <p className="mt-2 text-sm text-white/80">Zero Trust. Audit first. Risk aware.</p>
      </div>
      <nav className="mt-5 space-y-1 overflow-auto pr-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-950/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'}`
            }
          >
            <Icon className="text-base" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
