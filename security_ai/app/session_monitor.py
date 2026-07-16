from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional, Tuple

from .schemas import SecurityEventIn


WORKFLOW_BASELINES = {
    'teller': ['login', 'dashboard', 'accounts', 'transactions'],
    'manager': ['login', 'dashboard', 'customers', 'accounts', 'transactions', 'reports'],
    'auditor': ['login', 'dashboard', 'audit_logs', 'risk'],
    'admin': ['login', 'dashboard', 'admin', 'risk', 'audit_logs']
}


@dataclass
class EventRecord:
    event_type: str
    route: str
    timestamp: datetime
    downloads_count: int
    failed_logins: int
    tab_switch_detected: bool
    unusual_time: bool
    honeypot_triggered: bool
    file_name: str = ''
    risk_score: int = 0
    decision: str = ''
    intent: str = ''
    action: str = ''


@dataclass
class SessionState:
    user_id: str
    username: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_event_at: Optional[datetime] = None
    total_events: int = 0
    cumulative_downloads: int = 0
    failed_logins: int = 0
    tab_switch_count: int = 0
    workflow_deviation: bool = False
    repeated_sensitive_access: bool = False
    last_route: str = ''
    workflow_index: int = 0
    recent_routes: Deque[str] = field(default_factory=lambda: deque(maxlen=30))
    recent_files: Deque[str] = field(default_factory=lambda: deque(maxlen=30))
    event_log: Deque[EventRecord] = field(default_factory=lambda: deque(maxlen=200))


class SessionMonitor:
    """Tracks per-user secure-workspace session state and workflow deviations."""

    def __init__(self) -> None:
        self.sessions: Dict[str, SessionState] = {}

    def get_session(self, user_id: str, username: str) -> SessionState:
        session = self.sessions.get(user_id)
        if session is None:
            session = SessionState(user_id=user_id, username=username)
            self.sessions[user_id] = session
        elif username and session.username != username:
            session.username = username
        return session

    def clear_session(self, user_id: str) -> None:
        self.sessions.pop(user_id, None)

    def record_event(self, event: SecurityEventIn, risk_score: int = 0, decision: str = '', intent: str = '', action: str = '') -> Tuple[SessionState, Dict[str, object]]:
        session = self.get_session(event.user_id, event.username)
        timestamp = event.timestamp
        session.total_events += 1
        session.last_event_at = timestamp
        session.cumulative_downloads += int(event.downloads_count)
        session.failed_logins += int(event.failed_logins)
        if event.tab_switch_detected:
            session.tab_switch_count += 1
        session.recent_routes.append(event.route or event.activity_label or event.current_step)
        session.last_route = event.route or session.last_route
        if event.requested_file_name:
            session.recent_files.append(event.requested_file_name)

        workflow_deviation = self._detect_workflow_deviation(session, event)
        repeated_sensitive_access = self._detect_repeated_sensitive_access(session, event)
        session.workflow_deviation = workflow_deviation
        session.repeated_sensitive_access = repeated_sensitive_access

        record = EventRecord(
            event_type=event.event_type,
            route=event.route,
            timestamp=timestamp,
            downloads_count=event.downloads_count,
            failed_logins=event.failed_logins,
            tab_switch_detected=event.tab_switch_detected,
            unusual_time=event.unusual_time,
            honeypot_triggered=event.honeypot_triggered,
            file_name=event.requested_file_name,
            risk_score=risk_score,
            decision=decision,
            intent=intent,
            action=action
        )
        session.event_log.append(record)

        snapshot = {
            'user_id': session.user_id,
            'username': session.username,
            'total_events': session.total_events,
            'cumulative_downloads': session.cumulative_downloads,
            'failed_logins': session.failed_logins,
            'tab_switch_count': session.tab_switch_count,
            'workflow_deviation': workflow_deviation,
            'repeated_sensitive_access': repeated_sensitive_access,
            'last_route': session.last_route,
            'last_event_at': session.last_event_at,
        }
        return session, snapshot

    def build_behavior_features(self, event: SecurityEventIn, session: SessionState) -> Dict[str, float]:
        return {
            'login_hour': float(event.login_hour if event.login_hour is not None else datetime.now(timezone.utc).hour),
            'downloads_count': float(event.downloads_count),
            'failed_logins': float(event.failed_logins + session.failed_logins),
            'tab_switch_detected': 1.0 if event.tab_switch_detected else 0.0,
            'unusual_time': 1.0 if event.unusual_time else 0.0,
            'honeypot_triggered': 1.0 if event.honeypot_triggered else 0.0,
            'actions_per_minute': float(event.actions_per_minute),
            'files_accessed': float(event.files_accessed),
            'file_size_mb': float(event.file_size_mb),
        }

    def _detect_workflow_deviation(self, session: SessionState, event: SecurityEventIn) -> bool:
        route = (event.route or event.activity_label or event.current_step or '').lower().strip('/')
        if not route:
            return False
        role = self._route_role_hint(route)
        baseline = WORKFLOW_BASELINES.get(role, WORKFLOW_BASELINES['teller'])
        normalized_route = route.replace('/', '_')
        if normalized_route not in baseline:
            return True
        expected_index = baseline.index(normalized_route)
        if session.workflow_index and expected_index > session.workflow_index + 1:
            return True
        session.workflow_index = max(session.workflow_index, expected_index)
        return False

    def _detect_repeated_sensitive_access(self, session: SessionState, event: SecurityEventIn) -> bool:
        file_name = (event.requested_file_name or '').lower()
        if not file_name:
            return False
        recent_same = sum(1 for item in session.recent_files if item.lower() == file_name)
        return recent_same >= 2

    @staticmethod
    def _route_role_hint(route: str) -> str:
        if route.startswith('audit') or 'risk' in route:
            return 'auditor'
        if route.startswith('admin'):
            return 'admin'
        if route.startswith('reports'):
            return 'manager'
        return 'teller'
