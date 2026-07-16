from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class SecurityEventIn(BaseModel):
    user_id: str = Field(..., examples=['EMP-001'])
    username: str = Field(..., examples=['Asha'])
    event_type: str = Field(default='navigation')
    login_hour: Optional[int] = Field(default=None, ge=0, le=23)
    downloads_count: int = Field(default=0, ge=0)
    failed_logins: int = Field(default=0, ge=0)
    tab_switch_detected: bool = Field(default=False)
    unusual_time: bool = Field(default=False)
    honeypot_triggered: bool = Field(default=False)
    route: str = Field(default='')
    previous_route: str = Field(default='')
    activity_label: str = Field(default='')
    actions_per_minute: int = Field(default=0, ge=0)
    files_accessed: int = Field(default=0, ge=0)
    file_size_mb: float = Field(default=0.0, ge=0.0)
    current_step: str = Field(default='')
    requested_file_name: str = Field(default='')
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SecurityAnalysisOut(BaseModel):
    user_id: str
    username: str
    timestamp: datetime
    anomaly: bool
    anomaly_score: float
    risk_score: int
    intent: str
    action: Literal['ALLOW', 'ALERT', 'FORCE_LOGOUT']
    reasons: List[str]
    decision: str
    session_flags: Dict[str, Any]
    log_entry: Dict[str, Any]


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
    sandboxed: bool = True
    view_only: bool = True


class StoredFileInfo(BaseModel):
    file_id: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_by: str
    username: str
    uploaded_at: datetime
    sandboxed: bool = True
    view_only: bool = True


class SessionSnapshot(BaseModel):
    user_id: str
    username: str
    total_events: int
    cumulative_downloads: int
    failed_logins: int
    tab_switch_count: int
    workflow_deviation: bool
    repeated_sensitive_access: bool
    last_route: str
    last_event_at: Optional[datetime] = None
