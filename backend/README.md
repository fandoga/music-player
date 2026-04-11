# Python backend for ytmusicapi

## Install

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

If you updated backend dependencies, run `pip install -r requirements.txt` again.

## Run

```bash
cd backend
.venv\Scripts\activate
uvicorn app:app --reload --port 8000
```

After that, run frontend in another terminal:

```bash
npm run dev
```

## API endpoints

- `GET /api/search?q=<query>` - search songs
- `GET /api/charts?country=US` - get charts by country code

## headers_auth (recommended for 403)

1. Generate auth headers file:

```bash
cd backend
.venv\Scripts\activate
ytmusicapi browser
```

By default this creates `browser.json` in `backend`.
You can also save it as `headers_auth.json`.

2. Start backend:

```bash
uvicorn app:app --reload --port 8000
```

3. Check health:

- `GET /api/health`
- expect `"headers_auth_enabled": true`

Optional env vars:

```powershell
$env:YTMUSIC_AUTH_MODE="headers"
$env:YTMUSIC_BROWSER_FILE="C:\path\to\browser.json"
$env:YTMUSIC_HEADERS_FILE="C:\path\to\headers_auth.json"
```

## OAuth (optional fallback)

1. Generate OAuth token file:

```bash
cd backend
.venv\Scripts\activate
ytmusicapi oauth
```

This creates `oauth.json` in the current directory (`backend`).

2. Set Google OAuth credentials (PowerShell):

```powershell
$env:YTMUSIC_CLIENT_ID="your_client_id"
$env:YTMUSIC_CLIENT_SECRET="your_client_secret"
```

Optional (if `oauth.json` is not in `backend`):

```powershell
$env:YTMUSIC_OAUTH_FILE="C:\path\to\oauth.json"
```

3. Restart backend:

```bash
uvicorn app:app --reload --port 8000
```
