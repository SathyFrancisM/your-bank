from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from .schemas import SecurityEventIn


@dataclass
class RiskResult:
    score: int
    reasons: List[str]
    action: str


class RiskEngine:
    """Combines rule-based signals with ML anomaly output into a 0-100 risk score."""

    def calculate(
        self,
        event: SecurityEventIn | Dict[str, object],
        anomaly: bool,
        anomaly_score: float,
        session_flags: Dict[str, object],
    ) -> RiskResult:
        data = event.model_dump() if isinstance(event, SecurityEventIn) else dict(event)
        score = 0
        reasons: List[str] = []

        def add(points: int, reason: str) -> None:
            nonlocal score
            score += points
            reasons.append(reason)

        downloads = int(data.get('downloads_count', 0))
        failed_logins = int(data.get('failed_logins', 0))
        file_size_mb = float(data.get('file_size_mb', 0.0))
        actions_per_minute = int(data.get('actions_per_minute', 0))

        if data.get('honeypot_triggered'):
            add(100, 'Honeypot access detected')
        if data.get('tab_switch_detected'):
            add(35, 'Tab switch or focus loss detected')
        if data.get('unusual_time'):
            add(15, 'Login or access at unusual time')
        if downloads > 0:
            add(min(30, downloads * 6), f'Download activity detected ({downloads})')
        if downloads >= 5:
            add(18, 'Bulk download pattern detected')
        if failed_logins > 0:
            add(min(25, failed_logins * 5), f'Failed logins observed ({failed_logins})')
        if file_size_mb >= 25:
            add(18, f'Large file access ({file_size_mb:.1f} MB)')
        if actions_per_minute >= 40:
            add(12, 'High interaction burst rate')
        if session_flags.get('workflow_deviation'):
            add(18, 'Workflow deviation detected')
        if session_flags.get('repeated_sensitive_access'):
            add(14, 'Repeated sensitive data access')
        if anomaly:
            add(22, f'ML anomaly score {anomaly_score:.2f}')
        elif anomaly_score >= 0.7:
            add(10, f'Behavior drift score {anomaly_score:.2f}')

        score = max(0, min(100, score))
        if score <= 50:
            action = 'ALLOW'
        elif score <= 70:
            action = 'ALERT'
        else:
            action = 'FORCE_LOGOUT'

        return RiskResult(score=score, reasons=reasons, action=action)
