import { FaBell } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'message', label: 'Message' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' }
];

export default function NotificationsPage() {
  return (
    <SectionPage
      title="Notifications"
      subtitle="Real-time alerts for suspicious login, manager approval pending, fraud signals, and operational events."
      endpoint="/notifications"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Notifications', value: rows.length, icon: FaBell, tone: 'blue', change: 'Live' }
      ]}
      chartBuilder={() => ({
        title: 'Alert Center',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-cyan-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Realtime notification stream shell.</div>,
        tableTitle: 'Notification Inbox',
        tableSubtitle: 'Operational and security alerts'
      })}
    />
  );
}
