from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from .schemas import SecurityEventIn


@dataclass
class IntentResult:
    label: str
    explanation: str
    signals: List[str]


class IntentEngine:
    """Simple AI-style policy classifier with deterministic security labels."""

    def classify(self, event: SecurityEventIn | Dict[str, object], risk_score: int, anomaly: bool) -> IntentResult:
        data = event.model_dump() if isinstance(event, SecurityEventIn) else dict(event)
        signals: List[str] = []

        if data.get('honeypot_triggered'):
            return IntentResult(
                label='Malicious Insider',
                explanation='Honeypot asset accessed; behavior treated as malicious insider activity.',
                signals=['honeypot_triggered']
            )

        if data.get('downloads_count', 0) >= 5 or risk_score >= 80:
            signals.append('bulk_download_pattern')
            if data.get('downloads_count', 0) >= 5:
                signals.append('high_download_volume')
            return IntentResult(
                label='Data Exfiltration Attempt',
                explanation='Bulk downloads or critical risk pattern detected.',
                signals=signals
            )

        suspicious_signals = []
        if anomaly:
            suspicious_signals.append('ml_anomaly')
        if data.get('tab_switch_detected'):
            suspicious_signals.append('tab_switch')
        if data.get('unusual_time'):
            suspicious_signals.append('unusual_time')
        if data.get('failed_logins', 0) >= 2:
            suspicious_signals.append('failed_logins')
        if risk_score >= 51:
            suspicious_signals.append('policy_escalation')

        if suspicious_signals:
            return IntentResult(
                label='Suspicious Activity',
                explanation='Behavior deviates from the expected workspace pattern and requires alerting.',
                signals=suspicious_signals
            )

        return IntentResult(
            label='Normal Activity',
            explanation='No high-risk indicators found in the current event.',
            signals=['baseline']
        )
