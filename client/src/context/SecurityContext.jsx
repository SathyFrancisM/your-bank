import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { getSocket } from '../services/socket.js';
import { readJson, removeJson, writeJson } from '../utils/storage.js';

const SecurityContext = createContext(null);
const STORAGE_KEY = 'bank_security_state';

const createInitialState = () => ({
  sessionId: crypto.randomUUID(),
  score: 0,
  intent: 'Normal',
  intentDetail: 'No active security concerns',
  warnings: 0,
  blocked: false,
  alerts: [],
  activity: [],
  workflow: [],
  forcedLogouts: [],
  lastEventAt: null,
  activeDocument: null
});

const keepRecent = (items = [], limit = 15) => items.slice(0, limit);

const bandLabel = (score) => {
  if (score >= 80) return 'Malicious';
  if (score >= 60) return 'Suspicious';
  return 'Normal';
};

const SecureDocumentModal = ({ document, onClose }) => {
  if (!document) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0,transparent_45%,rgba(59,130,246,0.07)_45%,rgba(59,130,246,0.07)_55%,transparent_55%,transparent_100%)] bg-[length:220px_220px]" />
          <div className="absolute inset-0 grid place-items-center text-center text-[11px] font-black uppercase tracking-[0.45em] text-slate-400">
            <div className="-rotate-12">
              <div>{document.username}</div>
              <div>{new Date(document.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="relative flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">Secure In-App Memory</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">{document.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{document.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700">Close</button>
        </div>
        <div className="relative max-h-[75vh] overflow-auto px-6 py-5">
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Session only</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">No disk writes</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">Watermarked</span>
          </div>
          {document.metadata?.length > 0 && (
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {document.metadata.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{String(item.value)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            <div className="bank-scroll max-h-[55vh] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    {document.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {document.rows.length === 0 ? (
                    <tr>
                      <td colSpan={document.columns.length} className="px-4 py-10 text-center text-sm text-slate-500">No rows to display.</td>
                    </tr>
                  ) : (
                    document.rows.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-slate-50">
                        {document.columns.map((column) => (
                          <td key={column.key} className="px-4 py-3 text-sm text-slate-700">{column.render ? column.render(row) : String(row[column.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SecurityProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [state, setState] = useState(() => readJson(STORAGE_KEY, createInitialState()));
  const previousPathRef = useRef(location.pathname);
  const lastEventRef = useRef(0);

  useEffect(() => {
    writeJson(STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    if (!user) {
      setState(createInitialState());
      removeJson(STORAGE_KEY);
      return;
    }
    const storedState = readJson(STORAGE_KEY, null);
    if (!storedState) {
      setState(createInitialState());
    }
  }, [user]);

  const updateFromPayload = useCallback((payload) => {
    if (!payload) return;
    setState((current) => ({
      ...current,
      score: Number(payload.score ?? current.score ?? 0),
      intent: payload.intent || bandLabel(Number(payload.score ?? current.score ?? 0)),
      intentDetail: payload.intentDetail || payload.message || current.intentDetail,
      warnings: Number(payload.warnings ?? current.warnings ?? 0),
      blocked: Boolean(payload.blocked ?? current.blocked),
      lastEventAt: payload.timestamp || new Date().toISOString(),
      alerts: keepRecent([
        ...(payload.alert ? [payload.alert] : []),
        ...current.alerts
      ]),
      activity: keepRecent([
        payload.activity || payload.event,
        ...current.activity
      ].filter(Boolean)),
      workflow: keepRecent(payload.workflow || current.workflow),
      forcedLogouts: keepRecent([
        ...(payload.forceLogout ? [payload.forceLogout] : []),
        ...current.forcedLogouts
      ]),
      activeDocument: current.activeDocument
    }));
  }, []);

  const openSecureDocument = useCallback((document) => {
    setState((current) => ({
      ...current,
      activeDocument: {
        ...document,
        createdAt: document.createdAt || new Date().toISOString(),
        username: user?.name || 'Unknown Employee'
      }
    }));
  }, [user?.name]);

  const closeSecureDocument = useCallback(() => {
    setState((current) => ({ ...current, activeDocument: null }));
  }, []);

  const reportSecurityEvent = useCallback(async (event) => {
    if (!user) return null;
    const now = Date.now();
    if (now - lastEventRef.current < 150) return null;
    lastEventRef.current = now;
    try {
      const response = await api.post('/security/events', {
        ...event,
        sessionId: state.sessionId,
        route: location.pathname,
        timestamp: new Date().toISOString()
      });
      updateFromPayload(response.data?.data || response.data);
      return response.data?.data || response.data;
    } catch (error) {
      return { error };
    }
  }, [location.pathname, state.sessionId, updateFromPayload, user]);

  useEffect(() => {
    if (!user) return undefined;
    if (location.pathname !== previousPathRef.current) {
      reportSecurityEvent({ type: 'navigation', route: location.pathname, previousRoute: previousPathRef.current, metadata: { page: location.pathname } });
      previousPathRef.current = location.pathname;
    }
    return undefined;
  }, [location.pathname, reportSecurityEvent, user]);

  useEffect(() => {
    if (!user) return undefined;

    const handleBlur = () => {
      reportSecurityEvent({ type: 'window-blur', metadata: { blurCount: state.warnings + 1 } }).then((result) => {
        if (result?.action === 'logout') {
          logout({ reason: result.reason || 'Security policy violation', securityAction: 'window-blur' });
        }
      });
    };

    const handleFocus = () => {
      reportSecurityEvent({ type: 'window-focus', metadata: { score: state.score } });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    const blockAndReport = (type, metadata = {}) => {
      reportSecurityEvent({ type, metadata });
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isCopy = (event.ctrlKey || event.metaKey) && key === 'c';
      const isCut = (event.ctrlKey || event.metaKey) && key === 'x';
      const isPaste = (event.ctrlKey || event.metaKey) && key === 'v';
      const isSave = (event.ctrlKey || event.metaKey) && key === 's';
      const isPrint = (event.ctrlKey || event.metaKey) && key === 'p';
      const isInspect = key === 'f12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'i');
      const isAltTab = event.altKey && key === 'tab';
      if (isCopy || isCut || isPaste || isSave || isPrint || isInspect || isAltTab) {
        event.preventDefault();
        event.stopPropagation();
        blockAndReport(isPrint ? 'print-attempt' : isSave ? 'download-attempt' : isCopy ? 'copy-attempt' : isCut ? 'cut-attempt' : isPaste ? 'paste-attempt' : isInspect ? 'inspect-attempt' : 'app-switch', { key: event.key, altKey: event.altKey, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey });
      }
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      blockAndReport('context-menu');
    };

    const handleCopyCutPaste = (event) => {
      event.preventDefault();
      blockAndReport(event.type, { target: event.target?.tagName });
    };

    const handleDrag = (event) => {
      event.preventDefault();
      if (event.type === 'drop') {
        blockAndReport('drag-outside', { target: event.target?.tagName });
      }
    };

    const handleBeforePrint = (event) => {
      event.preventDefault();
      blockAndReport('print-attempt', { via: 'beforeprint' });
    };

    const handleFileChange = (event) => {
      const target = event.target;
      if (target?.type === 'file' && target.files?.length) {
        target.value = '';
        blockAndReport('upload-attempt', { fileCount: target.files.length, fileNames: Array.from(target.files).map((file) => file.name) });
      }
    };

    const handleSecureDocument = (event) => {
      openSecureDocument(event.detail);
      blockAndReport('secure-preview', { filename: event.detail?.filename });
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleCopyCutPaste, true);
    window.addEventListener('cut', handleCopyCutPaste, true);
    window.addEventListener('paste', handleCopyCutPaste, true);
    window.addEventListener('dragover', handleDrag, true);
    window.addEventListener('drop', handleDrag, true);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('change', handleFileChange, true);
    window.addEventListener('bank:secure-document', handleSecureDocument);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleCopyCutPaste, true);
      window.removeEventListener('cut', handleCopyCutPaste, true);
      window.removeEventListener('paste', handleCopyCutPaste, true);
      window.removeEventListener('dragover', handleDrag, true);
      window.removeEventListener('drop', handleDrag, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('change', handleFileChange, true);
      window.removeEventListener('bank:secure-document', handleSecureDocument);
    };
  }, [logout, openSecureDocument, reportSecurityEvent, state.score, state.warnings, user]);

  useEffect(() => {
    if (!user) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const handleSecurityEvent = (payload) => {
      if (!payload || (payload.employeeId && payload.employeeId !== user.employeeId)) return;
      updateFromPayload(payload);
    };

    const handleSecurityLogout = (payload) => {
      if (payload?.employeeId && payload.employeeId !== user.employeeId) return;
      setState((current) => ({ ...current, blocked: true, intent: 'Malicious', intentDetail: payload?.message || 'Session terminated due to security policy violation', alerts: keepRecent([{ level: 'HIGH', message: payload?.message || 'Security policy violation detected' }, ...current.alerts]), forcedLogouts: keepRecent([{ reason: payload?.message || 'Policy violation', at: new Date().toISOString() }, ...current.forcedLogouts]) }));
      logout({ reason: payload?.message || 'Session terminated due to security policy violation', securityAction: payload?.eventType || 'remote-force-logout' });
    };

    socket.on('security:event', handleSecurityEvent);
    socket.on('security:logout', handleSecurityLogout);

    return () => {
      socket.off('security:event', handleSecurityEvent);
      socket.off('security:logout', handleSecurityLogout);
    };
  }, [logout, updateFromPayload, user]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({
    securityState: state,
    reportSecurityEvent,
    updateFromPayload,
    openSecureDocument,
    closeSecureDocument
  }), [closeSecureDocument, openSecureDocument, reportSecurityEvent, state, updateFromPayload]);

  return (
    <SecurityContext.Provider value={value}>
      {children}
      {state.blocked && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[75] flex justify-center px-4">
          <div className="pointer-events-auto max-w-2xl rounded-3xl border border-rose-200 bg-white px-5 py-4 text-sm font-semibold text-rose-700 shadow-[0_24px_80px_rgba(244,63,94,0.2)]">
            Session terminated due to security policy violation.
          </div>
        </div>
      )}
      <SecureDocumentModal document={state.activeDocument} onClose={closeSecureDocument} />
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);