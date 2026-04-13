import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ytmusicapi import OAuthCredentials, YTMusic
from yt_dlp import YoutubeDL

app = FastAPI(title="Music Player API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_ytmusic_client() -> YTMusic:
    backend_dir = Path(__file__).parent
    auth_mode = os.getenv("YTMUSIC_AUTH_MODE", "headers").lower()

    headers_file = Path(
        os.getenv("YTMUSIC_HEADERS_FILE", backend_dir / "headers_auth.json")
    )
    browser_file = Path(os.getenv("YTMUSIC_BROWSER_FILE", backend_dir / "browser.json"))
    oauth_file = Path(
        os.getenv("YTMUSIC_OAUTH_FILE", backend_dir / "oauth.json")
    )
    client_id = os.getenv("YTMUSIC_CLIENT_ID")
    client_secret = os.getenv("YTMUSIC_CLIENT_SECRET")

    if auth_mode in ("headers", "auto"):
        if headers_file.exists():
            return YTMusic(str(headers_file))
        if browser_file.exists():
            return YTMusic(str(browser_file))

    if oauth_file.exists() and client_id and client_secret:
        credentials = OAuthCredentials(client_id=client_id, client_secret=client_secret)
        return YTMusic(str(oauth_file), oauth_credentials=credentials)

    # Fallback mode (without auth) - some endpoints may return 403.
    return YTMusic()


ytmusic = create_ytmusic_client()


def _get_fallback_audio_url(video_id: str) -> str | None:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": "bestaudio/best",
        "noplaylist": True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(
            f"https://music.youtube.com/watch?v={video_id}", download=False
        )
        if isinstance(info, dict):
            return info.get("url")
    return None


@app.get("/api/health")
def health():
    backend_dir = Path(__file__).parent
    headers_enabled = (
        Path(os.getenv("YTMUSIC_HEADERS_FILE", backend_dir / "headers_auth.json")).exists()
        or Path(os.getenv("YTMUSIC_BROWSER_FILE", backend_dir / "browser.json")).exists()
    )
    oauth_enabled = bool(os.getenv("YTMUSIC_CLIENT_ID")) and Path(
        os.getenv("YTMUSIC_OAUTH_FILE", backend_dir / "oauth.json")
    ).exists()
    return {"ok": True, "headers_auth_enabled": headers_enabled, "oauth_enabled": oauth_enabled}


@app.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    try:
        return ytmusic.search(q, filter="videos")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc


@app.get("/api/charts")
def charts(country: str = Query("US", min_length=2, max_length=2)):
    try:
        charts_data = ytmusic.get_charts(country=country.upper())
        playlist = charts_data if isinstance(charts_data, dict) else {}
        videos = playlist.get("videos") if isinstance(playlist.get("videos"), list) else []

        if not videos:
            raise HTTPException(status_code=404, detail="No videos found in charts playlist")

        return ytmusic.get_playlist(videos[3].get('playlistId'))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc

@app.get("/api/track")
def track(id: str = Query(..., min_length=1)):
    try:
        song = ytmusic.get_song(id)
        if not isinstance(song, dict):
            raise HTTPException(status_code=502, detail="Invalid track response")

        audio_url = None
        streaming_data = song.get("streamingData")
        if isinstance(streaming_data, dict):
            adaptive_formats = streaming_data.get("adaptiveFormats")
            if isinstance(adaptive_formats, list):
                audio_formats = [
                    fmt
                    for fmt in adaptive_formats
                    if isinstance(fmt, dict)
                    and isinstance(fmt.get("mimeType"), str)
                    and "audio" in fmt.get("mimeType")
                ]
                if audio_formats:
                    best = sorted(
                        audio_formats, key=lambda x: x.get("bitrate", 0), reverse=True
                    )[0]
                    if isinstance(best.get("url"), str):
                        audio_url = best.get("url")

        if not audio_url:
            audio_url = _get_fallback_audio_url(id)

        song["audioUrl"] = audio_url
        return song
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc
