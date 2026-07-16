from __future__ import annotations

import mimetypes
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from io import BytesIO
from threading import Lock
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import UploadFile

from .schemas import StoredFileInfo


@dataclass
class SecureFileRecord:
    file_id: str
    filename: str
    content_type: str
    size_bytes: int
    uploaded_by: str
    username: str
    uploaded_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    content: bytes = b''
    sandboxed: bool = True
    view_only: bool = True


class SecureFileHandler:
    """Keeps uploaded files in application memory only."""

    def __init__(self, max_bytes: int = 25 * 1024 * 1024) -> None:
        self.max_bytes = max_bytes
        self._lock = Lock()
        self._files: Dict[str, SecureFileRecord] = {}

    async def store(self, file: UploadFile, uploaded_by: str, username: str) -> SecureFileRecord:
        raw = await file.read()
        if len(raw) > self.max_bytes:
            raise ValueError(f'File exceeds in-memory sandbox limit of {self.max_bytes} bytes')

        content_type = file.content_type or mimetypes.guess_type(file.filename or '')[0] or 'application/octet-stream'
        record = SecureFileRecord(
            file_id=str(uuid4()),
            filename=file.filename or 'uploaded-file',
            content_type=content_type,
            size_bytes=len(raw),
            uploaded_by=uploaded_by,
            username=username,
            content=raw,
        )
        with self._lock:
            self._files[record.file_id] = record
        return record

    def list_files(self) -> List[StoredFileInfo]:
        with self._lock:
            records = list(self._files.values())
        return [
            StoredFileInfo(
                file_id=record.file_id,
                filename=record.filename,
                content_type=record.content_type,
                size_bytes=record.size_bytes,
                uploaded_by=record.uploaded_by,
                username=record.username,
                uploaded_at=record.uploaded_at,
                sandboxed=True,
                view_only=True,
            )
            for record in records
        ]

    def get_file(self, file_id: str) -> Optional[SecureFileRecord]:
        with self._lock:
            return self._files.get(file_id)

    def as_stream(self, file_id: str) -> Optional[BytesIO]:
        record = self.get_file(file_id)
        if record is None:
            return None
        return BytesIO(record.content)

    def remove(self, file_id: str) -> bool:
        with self._lock:
            return self._files.pop(file_id, None) is not None
