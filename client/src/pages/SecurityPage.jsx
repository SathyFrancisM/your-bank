import { useEffect, useState } from 'react';
import { FaExclamationTriangle, FaEye, FaShieldAlt, FaUserSecret } from 'react-icons/fa';
import api from '../services/api.js';
import Panel from '../components/Panel.jsx';
import RiskCard from '../components/RiskCard.jsx';
import DataTable from '../components/DataTable.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';

const columns = [
  { key: 'type', label: 'Event' },
  { key: 'route', label: 'Route' },
  { key: 'risk', label: 'Risk' },
  { key: 'intent', label: 'Intent' },
  { key: 'message', label: 'Message' }
];

export default function SecurityPage() {
  const { securityState, reportSecurityEvent } = useSecurity();
  const [overview, setOverview] = useState({ alerts: [], activity: [], forcedLogouts: [], honeypots: [] });

  useEffect(() => {
    let alive = true;
    api.get('/security/overview').then((response) => {
      if (alive) {
        setOverview(response.data.data || response.data);
      }
    }).catch(() => {
      if (alive) {
        setOverview((current) => current);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const triggerHoneypot = async (fileName) => {
    await reportSecurityEvent({ type: 'honeypot-access', metadata: { fileName } });
  };

  const rows = (overview.activity || securityState.activity || []).map((item, index) => ({
    id: item.id || index,
    type: item.type || item.eventType || 'event',
    route: item.route || item.metadata?.route || '-',
    risk: item.score ?? item.riskDelta ?? 0,
    intent: item.intent || item.classification || 'Normal',
    message: item.message || item.reason || item.description || 'Monitored'
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Zero Trust Security Layer</p>
          <h1 className="font-display text-4xl font-bold text-slate-900">Security Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">Real-time behavior monitoring, policy enforcement, anomaly detection, and forced logout history.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Risk Score</p>
          <p className="mt-3 text-4xl font-black text-rose-600">{securityState.score}</p>
          <p className="mt-2 text-sm text-slate-500">Thresholds: 60 warning, 80 terminate.</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Intent</p>
          <p className="mt-3 text-2xl font-bold text-amber-700">{securityState.intent}</p>
          <p className="mt-2 text-sm text-slate-500">{securityState.intentDetail}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Alerts</p>
          <p className="mt-3 text-4xl font-black text-emerald-600">{(overview.alerts || securityState.alerts).length}</p>
          <p className="mt-2 text-sm text-slate-500">Live monitoring events in this session.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Forced Logouts</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{(overview.forcedLogouts || securityState.forcedLogouts).length}</p>
          <p className="mt-2 text-sm text-slate-500">Session terminations and policy actions.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <RiskCard
          score={securityState.score}
          reasons={securityState.activity.slice(0, 5).map((item) => item.message || item.reason || item.type)}
          suggestedAction={securityState.blocked ? 'Session terminated due to security policy violation' : securityState.score >= 60 ? 'Restrict exports and watch session' : 'Continue under zero-trust controls'}
          employeeName={securityState.intent}
        />
        <Panel title="Honeypot Traps" subtitle="Fake sensitive assets used to detect insider behavior.">
          <div className="grid gap-3 md:grid-cols-2">
            {['VIP_accounts.xlsx', 'salary_master.xlsx'].map((fileName) => (
              <button key={fileName} type="button" onClick={() => triggerHoneypot(fileName)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left transition hover:border-rose-300 hover:bg-rose-100">
                <div className="flex items-center gap-3 text-rose-700">
                  <FaUserSecret />
                  <span className="font-semibold">{fileName}</span>
                </div>
                <p className="mt-2 text-sm text-rose-600">Accessing this file marks the session as malicious.</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Activity Timeline" subtitle="Tab switching, copy, print, upload, download, navigation, and data access signals.">
          <div className="space-y-3">
            {(overview.activity || securityState.activity).slice(0, 8).map((item, index) => (
              <div key={item.id || index} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className={`mt-1 rounded-full p-2 ${item.score >= 80 ? 'bg-rose-100 text-rose-700' : item.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {item.score >= 80 ? <FaExclamationTriangle /> : item.score >= 60 ? <FaShieldAlt /> : <FaEye />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.type || item.eventType || 'Event'} <span className="text-slate-400">• {item.route || item.metadata?.route || 'session'}</span></p>
                  <p className="text-sm text-slate-500">{item.message || item.reason || 'Monitored interaction'}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Alert Panel" subtitle="Warnings, malicious classifications, and forced logout notes.">
          <div className="space-y-3">
            {(overview.alerts || securityState.alerts).slice(0, 6).map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">{item.level || 'Warning'}</p>
                <p className="mt-1">{item.message || item.reason || 'Policy event'}</p>
              </div>
            ))}
            {(overview.forcedLogouts || securityState.forcedLogouts).slice(0, 3).map((item, index) => (
              <div key={`${item.reason || 'logout'}-${index}`} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p className="font-semibold">Forced Logout</p>
                <p className="mt-1">{item.reason || item.message || 'Session terminated due to security policy violation'}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Security Event Log" subtitle="Strict environment control and UEBA activity stream.">
        <DataTable columns={columns} rows={rows} emptyMessage="No security activity recorded yet." />
      </Panel>
    </div>
  );
}