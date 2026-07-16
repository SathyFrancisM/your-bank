import { FaVideo } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'employeeName', label: 'Employee' },
  { key: 'startTime', label: 'Start' },
  { key: 'endTime', label: 'End' },
  { key: 'status', label: 'Status' }
];

export default function RecordingsPage() {
  return (
    <SectionPage
      title="Screen Recordings"
      subtitle="Recording history, start/end timestamps, and download-ready history for managers and auditors."
      endpoint="/recordings"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Recordings', value: rows.length, icon: FaVideo, tone: 'blue', change: 'History' }
      ]}
      chartBuilder={() => ({
        title: 'Recording Archive',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-blue-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Recording history shell with download controls can be attached here.</div>,
        tableTitle: 'Recording History',
        tableSubtitle: 'Active session lifecycle and historical playback'
      })}
    />
  );
}
