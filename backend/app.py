import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from ytmusicapi import OAuthCredentials, YTMusic  # noqa: E402
from yt_dlp import YoutubeDL  # noqa: E402

from db import init_db  # noqa: E402
from user_api import router as user_router  # noqa: E402

app = FastAPI(title="Music Player API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(user_router)


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


@lru_cache(maxsize=1)
def get_ytmusic() -> YTMusic:
    # Created lazily so the API (auth, likes, playlists) still starts
    # when YouTube Music is temporarily unreachable.
    return create_ytmusic_client()


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


# ---------- normalization ----------

_GOOGLE_SIZE_RE = re.compile(r"=w\d+-h\d+.*$")


def _resize_thumbnail(url: str, size: int) -> str:
    # lh3.googleusercontent.com thumbnails accept an arbitrary size suffix.
    if "googleusercontent.com" in url and _GOOGLE_SIZE_RE.search(url):
        return _GOOGLE_SIZE_RE.sub(f"=w{size}-h{size}-l90-rj", url)
    return url


def _duration_to_seconds(duration: str | None) -> int | None:
    if not duration:
        return None
    try:
        seconds = 0
        for part in duration.split(":"):
            seconds = seconds * 60 + int(part)
        return seconds
    except ValueError:
        return None


def normalize_track(item: dict[str, Any], source: Literal["song", "video"]) -> dict[str, Any] | None:
    video_id = item.get("videoId")
    if not video_id or item.get("isAvailable") is False:
        return None

    thumbnails = [t for t in item.get("thumbnails") or [] if isinstance(t, dict) and t.get("url")]
    thumbnails.sort(key=lambda t: t.get("width") or 0)
    small = thumbnails[0]["url"] if thumbnails else None
    large = thumbnails[-1]["url"] if thumbnails else None

    artists = [
        {"name": a.get("name"), "id": a.get("id")}
        for a in item.get("artists") or []
        if isinstance(a, dict) and a.get("name")
    ]
    album = item.get("album") if isinstance(item.get("album"), dict) else None

    duration = item.get("duration")
    duration_seconds = item.get("duration_seconds") or _duration_to_seconds(duration)

    # Charts/playlists mix songs and music videos: trust the item's own type.
    if item.get("videoType") == "MUSIC_VIDEO_TYPE_ATV":
        source = "song"
    elif item.get("videoType") in ("MUSIC_VIDEO_TYPE_OMV", "MUSIC_VIDEO_TYPE_UGC"):
        source = "video"

    return {
        "videoId": video_id,
        "title": item.get("title") or "Без названия",
        "artists": artists,
        "album": {"name": album.get("name"), "id": album.get("id")} if album and album.get("name") else None,
        "duration": duration,
        "durationSeconds": duration_seconds,
        "thumbnail": _resize_thumbnail(large, 544) if large else None,
        "thumbnailSmall": _resize_thumbnail(small, 120) if small else None,
        "source": source,
    }


def normalize_list(items: list[Any], source: Literal["song", "video"]) -> list[dict[str, Any]]:
    result = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        track = normalize_track(item, source)
        if track and track["videoId"] not in seen:
            seen.add(track["videoId"])
            result.append(track)
    return result


# ---------- routes ----------


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
    return {
        "ok": True,
        "headers_auth_enabled": headers_enabled,
        "oauth_enabled": oauth_enabled,
        "google_login_enabled": bool(os.getenv("GOOGLE_CLIENT_ID")),
    }


@app.get("/api/search")
def search(
    q: str = Query(..., min_length=1, max_length=200),
    source: Literal["songs", "videos"] = Query("songs"),
):
    try:
        results = get_ytmusic().search(q, filter=source, limit=40)
        return normalize_list(results, "song" if source == "songs" else "video")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc


@app.get("/api/charts")
def charts(country: str = Query("US", min_length=2, max_length=2)):
    try:
        charts_data = get_ytmusic().get_charts(country=country.upper())
        playlists: list[dict[str, Any]] = []
        for key in ("videos", "daily", "weekly"):
            value = charts_data.get(key) if isinstance(charts_data, dict) else None
            if isinstance(value, list):
                playlists.extend(p for p in value if isinstance(p, dict) and p.get("playlistId"))

        if not playlists:
            raise HTTPException(status_code=404, detail="No chart playlists found")

        # Historically the 4th "videos" chart was used; keep it when present.
        chosen = playlists[3] if len(playlists) > 3 else playlists[0]
        playlist = get_ytmusic().get_playlist(chosen["playlistId"], limit=100)
        return {
            "title": chosen.get("title") or playlist.get("title"),
            "tracks": normalize_list(playlist.get("tracks") or [], "song"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc


@app.get("/api/track")
def track(id: str = Query(..., min_length=1)):
    try:
        song = get_ytmusic().get_song(id)
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

        if not audio_url:
            raise HTTPException(status_code=404, detail="Audio stream not found")

        return {"videoId": id, "audioUrl": audio_url}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YTMusic error: {exc}") from exc
