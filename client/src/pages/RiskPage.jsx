import { FaChartLine } from 'react-icons/fa';
import SectionPage from '../components/SectionPage.jsx';

const columns = [
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'level', label: 'Level' },
  { key: 'score', label: 'Score' }
];

export default function RiskPage() {
  return (
    <SectionPage
      title="Risk Detection"
      subtitle="AI rule engine style scoring for insider threat signals, misuse patterns, and escalation states."
      endpoint="/risk"
      columns={columns}
      statsBuilder={(rows) => [
        { label: 'Profiles', value: rows.length, icon: FaChartLine, tone: 'blue', change: 'Tracked' }
      ]}
      chartBuilder={() => ({
        title: 'Risk Distribution',
        content: <div className="grid h-80 place-items-center rounded-3xl bg-amber-500/5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">Risk meter and distribution graph shell.</div>,
        tableTitle: 'Risk Profiles',
        tableSubtitle: 'Safe, medium, and high risk employee monitoring'
      })}
    />
  );
}
