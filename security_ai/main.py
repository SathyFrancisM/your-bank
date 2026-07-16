from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from app.behavior_model import BehaviorModel
from app.intent_engine import IntentEngine
from app.risk_engine import RiskEngine
from app.schemas import SecurityAnalysisOut, SecurityEventIn, StoredFileInfo, UploadResponse
from app.secure_file_handler import SecureFileHandler
from app.session_monitor import SessionMonitor

app = FastAPI(
    title='Banking Secure Workspace Layer',
    version='1.0.0',
    description='AI-powered zero-trust security layer for the banking application.'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

behavior_model = BehaviorModel()
risk_engine = RiskEngine()
intent_engine = IntentEngine()
session_monitor = SessionMonitor()
secure_files = SecureFileHandler()


@app.get('/health')
def health() -> Dict[str, str]:
    return {'status': 'ok', 'service': 'bank-security-layer'}


@app.post('/analyze', response_model=SecurityAnalysisOut)
def analyze(event: SecurityEventIn, request: Request) -> SecurityAnalysisOut:
    session, session_flags = session_monitor.record_event(event)
    behavior_signal = behavior_model.score_event(event)
    risk_result = risk_engine.calculate(event, behavior_signal.anomaly, behavior_signal.anomaly_score, session_flags)
    intent_result = intent_engine.classify(event, risk_result.score, behavior_signal.anomaly)
    decision = risk_result.action

    log_entry = {
        'user': event.username,
        'user_id': event.user_id,
        'timestamp': event.timestamp.isoformat(),
        'activity': event.event_type,
        'risk_score': risk_result.score,
        'ai_decision': decision,
        'anomaly': behavior_signal.anomaly,
        'intent': intent_result.label,
        'request_ip': request.client.host if request.client else '',
    }

    if decision == 'FORCE_LOGOUT':
        session_monitor.clear_session(event.user_id)

    behavior_model.maybe_retrain()

    return SecurityAnalysisOut(
        user_id=event.user_id,
        username=event.username,
        timestamp=event.timestamp,
        anomaly=behavior_signal.anomaly,
        anomaly_score=behavior_signal.anomaly_score,
        risk_score=risk_result.score,
        intent=intent_result.label,
        action=decision,
        reasons=_dedupe_reasons(risk_result.reasons + intent_result.signals),
        decision=_decision_summary(decision, risk_result.score, intent_result.label, intent_result.explanation),
        session_flags=session_flags,
        log_entry=log_entry,
    )


@app.post('/upload', response_model=UploadResponse)
async def upload_file(
    user_id: str,
    username: str,
    file: UploadFile = File(...),
) -> UploadResponse:
    try:
        record = await secure_files.store(file, uploaded_by=user_id, username=username)
    except ValueError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc

    # Uploads are sandboxed in memory and later streamed only through /view/{file_id}.
    return UploadResponse(
        file_id=record.file_id,
        filename=record.filename,
        content_type=record.content_type,
        size_bytes=record.size_bytes,
        uploaded_at=record.uploaded_at,
        sandboxed=True,
        view_only=True,
    )


@app.get('/files', response_model=List[StoredFileInfo])
def list_files() -> List[StoredFileInfo]:
    return secure_files.list_files()


@app.get('/view/{file_id}')
def view_file(file_id: str):
    record = secure_files.get_file(file_id)
    if record is None:
        raise HTTPException(status_code=404, detail='File not found')

    stream = secure_files.as_stream(file_id)
    if stream is None:
        raise HTTPException(status_code=404, detail='File not found')

    headers = {
        'Content-Disposition': f'inline; filename="{record.filename}"',
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    }
    return StreamingResponse(stream, media_type=record.content_type, headers=headers)


@app.get('/sessions/{user_id}')
def session_snapshot(user_id: str):
    session = session_monitor.sessions.get(user_id)
    if session is None:
        raise HTTPException(status_code=404, detail='Session not found')
    return {
        'user_id': session.user_id,
        'username': session.username,
        'total_events': session.total_events,
        'cumulative_downloads': session.cumulative_downloads,
        'failed_logins': session.failed_logins,
        'tab_switch_count': session.tab_switch_count,
        'workflow_deviation': session.workflow_deviation,
        'repeated_sensitive_access': session.repeated_sensitive_access,
        'last_route': session.last_route,
        'last_event_at': session.last_event_at,
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return Response(content=f'{{"detail":"{exc.detail}"}}', status_code=exc.status_code, media_type='application/json')


def _dedupe_reasons(reasons: List[str]) -> List[str]:
    seen = set()
    ordered: List[str] = []
    for reason in reasons:
        if reason and reason not in seen:
            seen.add(reason)
            ordered.append(reason)
    return ordered


def _decision_summary(action: str, score: int, intent: str, explanation: str) -> str:
    return f'{action} | score={score} | intent={intent} | {explanation}'
