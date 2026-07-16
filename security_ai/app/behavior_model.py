from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from random import Random
from typing import Deque, Dict, Iterable, List

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .schemas import SecurityEventIn


FEATURE_ORDER = [
    'login_hour',
    'downloads_count',
    'failed_logins',
    'tab_switch_detected',
    'unusual_time',
    'honeypot_triggered',
    'actions_per_minute',
    'files_accessed',
    'file_size_mb'
]


@dataclass
class BehaviorSignal:
    anomaly: bool
    anomaly_score: float
    feature_vector: Dict[str, float]


class BehaviorModel:
    """IsolationForest-based baseline model for user-behavior anomaly detection."""

    def __init__(self, random_state: int = 42, contamination: float = 0.08) -> None:
        self.random_state = random_state
        self.contamination = contamination
        self.model: Pipeline | None = None
        self.normal_buffer: Deque[List[float]] = deque(maxlen=600)
        self._fit_baseline()

    def _generate_baseline_sample(self, rng: Random) -> List[float]:
        hour = rng.randint(8, 18)
        downloads = max(0, int(rng.gauss(0.25, 0.45)))
        failed_logins = max(0, int(rng.gauss(0.2, 0.35)))
        tab_switch = 0
        unusual_time = 0
        honeypot = 0
        actions_per_minute = max(1, int(rng.gauss(14, 5)))
        files_accessed = max(0, int(rng.gauss(1.1, 0.8)))
        file_size_mb = max(0.0, float(max(0, rng.gauss(2.4, 1.9))))
        return [
            float(hour),
            float(downloads),
            float(failed_logins),
            float(tab_switch),
            float(unusual_time),
            float(honeypot),
            float(actions_per_minute),
            float(files_accessed),
            float(file_size_mb)
        ]

    def _fit_baseline(self) -> None:
        rng = Random(self.random_state)
        samples = [self._generate_baseline_sample(rng) for _ in range(600)]
        self.normal_buffer.extend(samples)
        self.model = Pipeline(
            steps=[
                ('scaler', StandardScaler()),
                (
                    'forest',
                    IsolationForest(
                        n_estimators=180,
                        contamination=self.contamination,
                        random_state=self.random_state
                    )
                )
            ]
        )
        self.model.fit(np.array(samples, dtype=float))

    def _vectorize(self, event: SecurityEventIn | Dict[str, object]) -> List[float]:
        data = event.model_dump() if isinstance(event, SecurityEventIn) else dict(event)
        login_hour = data.get('login_hour')
        if login_hour is None:
            login_hour = 12
        vector = [
            float(login_hour),
            float(data.get('downloads_count', 0)),
            float(data.get('failed_logins', 0)),
            1.0 if data.get('tab_switch_detected', False) else 0.0,
            1.0 if data.get('unusual_time', False) else 0.0,
            1.0 if data.get('honeypot_triggered', False) else 0.0,
            float(data.get('actions_per_minute', 0)),
            float(data.get('files_accessed', 0)),
            float(data.get('file_size_mb', 0.0))
        ]
        return vector

    def score_event(self, event: SecurityEventIn | Dict[str, object]) -> BehaviorSignal:
        if self.model is None:
            self._fit_baseline()
        vector = self._vectorize(event)
        array = np.array([vector], dtype=float)
        forest: IsolationForest = self.model.named_steps['forest']  # type: ignore[assignment]
        scaler: StandardScaler = self.model.named_steps['scaler']  # type: ignore[assignment]
        scaled = scaler.transform(array)
        prediction = forest.predict(scaled)[0]
        decision_score = float(forest.decision_function(scaled)[0])
        anomaly = prediction == -1
        anomaly_score = self._normalize_score(decision_score)
        feature_vector = {name: value for name, value in zip(FEATURE_ORDER, vector)}
        if not anomaly and anomaly_score < 0.35:
            self.normal_buffer.append(vector)
        return BehaviorSignal(anomaly=anomaly, anomaly_score=anomaly_score, feature_vector=feature_vector)

    def maybe_retrain(self) -> None:
        """Refresh the baseline with recent normal samples when enough clean history exists."""
        if len(self.normal_buffer) < 120:
            return
        clean_samples = np.array(list(self.normal_buffer)[-300:], dtype=float)
        self.model = Pipeline(
            steps=[
                ('scaler', StandardScaler()),
                (
                    'forest',
                    IsolationForest(
                        n_estimators=180,
                        contamination=self.contamination,
                        random_state=self.random_state
                    )
                )
            ]
        )
        self.model.fit(clean_samples)

    @staticmethod
    def _normalize_score(raw_score: float) -> float:
        # IsolationForest decision_function is centered around zero. Normalize it to 0..1 for downstream scoring.
        scaled = 1.0 / (1.0 + np.exp(raw_score * 6.0))
        return float(np.clip(scaled, 0.0, 1.0))
