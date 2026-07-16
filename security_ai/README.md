# Banking Security Layer

Standalone FastAPI service that adds an AI-powered secure workspace layer to the existing banking application.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Endpoints

- `POST /analyze`
- `POST /upload`
- `GET /files`
- `GET /view/{file_id}`
- `GET /health`

## Example Requests

### Analyze event

```json
{
  "user_id": "EMP-001",
  "username": "Asha",
  "event_type": "navigation",
  "login_hour": 22,
  "downloads_count": 0,
  "failed_logins": 1,
  "tab_switch_detected": true,
  "unusual_time": true,
  "honeypot_triggered": false,
  "route": "/transactions",
  "previous_route": "/accounts",
  "activity_label": "transactions",
  "actions_per_minute": 24,
  "files_accessed": 1
}
```

### Upload file

```bash
curl -F "file=@report.pdf" -F "user_id=EMP-001" -F "username=Asha" http://localhost:8001/upload
```

### View file in-app

```bash
curl http://localhost:8001/view/<file_id> --output -
```

## Security responses

- `ALLOW` for score 0-50
- `ALERT` for score 51-70
- `FORCE_LOGOUT` for score 71-100
