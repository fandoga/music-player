"""Google sign-in, sessions, likes and user playlists."""

import hashlib
import os
import secrets
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field

from db import connect, now, row_to_track, upsert_track

router = APIRouter(prefix="/api")

SESSION_COOKIE = "mp_session"
SESSION_TTL = 60 * 60 * 24 * 30
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def google_client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID", "").strip()


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ---------- models ----------


class Artist(BaseModel):
    name: str
    id: str | None = None


class Album(BaseModel):
    name: str
    id: str | None = None


class TrackIn(BaseModel):
    videoId: str = Field(pattern=r"^[A-Za-z0-9_-]{6,32}$")
    title: str = Field(max_length=500)
    artists: list[Artist] = Field(default_factory=list, max_length=20)
    album: Album | None = None
    duration: str | None = Field(default=None, max_length=16)
    durationSeconds: int | None = None
    thumbnail: str | None = Field(default=None, max_length=2000)
    thumbnailSmall: str | None = Field(default=None, max_length=2000)
    source: Literal["song", "video"] = "song"


class GoogleLoginIn(BaseModel):
    credential: str


class PlaylistIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)


# ---------- auth ----------


def current_user(request: Request) -> dict[str, Any]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    with connect() as conn:
        row = conn.execute(
            """
            SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ?
            """,
            (_hash(token), now()),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Session expired")
    return dict(row)


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user["picture"],
    }


@router.get("/auth/config")
def auth_config():
    return {"googleClientId": google_client_id() or None}


@router.post("/auth/google")
def login_google(payload: GoogleLoginIn, response: Response):
    client_id = google_client_id()
    if not client_id:
        raise HTTPException(status_code=503, detail="GOOGLE_CLIENT_ID is not configured")
    try:
        info = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), client_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    user = {
        "id": info["sub"],
        "email": info.get("email", ""),
        "name": info.get("name") or info.get("email", "").split("@")[0],
        "picture": info.get("picture"),
    }
    token = secrets.token_urlsafe(32)
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO users (id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                email = excluded.email, name = excluded.name, picture = excluded.picture
            """,
            (user["id"], user["email"], user["name"], user["picture"], now()),
        )
        conn.execute("DELETE FROM sessions WHERE expires_at <= ?", (now(),))
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (_hash(token), user["id"], now() + SESSION_TTL),
        )

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_TTL,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )
    return _public_user(user)


@router.get("/auth/me")
def me(user: dict = Depends(current_user)):
    return _public_user(user)


@router.post("/auth/logout", status_code=204)
def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        with connect() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_hash(token),))
    response.delete_cookie(SESSION_COOKIE, path="/")


# ---------- likes ----------


@router.get("/likes")
def list_likes(user: dict = Depends(current_user)):
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT t.data FROM likes l JOIN tracks t ON t.video_id = l.video_id
            WHERE l.user_id = ? ORDER BY l.created_at DESC, l.rowid DESC
            """,
            (user["id"],),
        ).fetchall()
    return [row_to_track(r) for r in rows]


@router.put("/likes/{video_id}", status_code=204)
def like(video_id: str, track: TrackIn, user: dict = Depends(current_user)):
    if track.videoId != video_id:
        raise HTTPException(status_code=400, detail="videoId mismatch")
    with connect() as conn:
        upsert_track(conn, track.model_dump())
        conn.execute(
            "INSERT OR IGNORE INTO likes (user_id, video_id, created_at) VALUES (?, ?, ?)",
            (user["id"], video_id, now()),
        )


@router.delete("/likes/{video_id}", status_code=204)
def unlike(video_id: str, user: dict = Depends(current_user)):
    with connect() as conn:
        conn.execute(
            "DELETE FROM likes WHERE user_id = ? AND video_id = ?", (user["id"], video_id)
        )


# ---------- playlists ----------


def _own_playlist(conn, playlist_id: int, user_id: str):
    row = conn.execute(
        "SELECT * FROM playlists WHERE id = ? AND user_id = ?", (playlist_id, user_id)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return row


def _playlist_summary(conn, row) -> dict[str, Any]:
    tracks = conn.execute(
        """
        SELECT t.data FROM playlist_tracks pt JOIN tracks t ON t.video_id = pt.video_id
        WHERE pt.playlist_id = ? ORDER BY pt.added_at, pt.rowid LIMIT 4
        """,
        (row["id"],),
    ).fetchall()
    count = conn.execute(
        "SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = ?", (row["id"],)
    ).fetchone()[0]
    return {
        "id": row["id"],
        "name": row["name"],
        "trackCount": count,
        "covers": [
            t.get("thumbnail") for t in map(row_to_track, tracks) if t.get("thumbnail")
        ],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@router.get("/playlists")
def list_playlists(user: dict = Depends(current_user)):
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
            (user["id"],),
        ).fetchall()
        return [_playlist_summary(conn, r) for r in rows]


@router.post("/playlists", status_code=201)
def create_playlist(payload: PlaylistIn, user: dict = Depends(current_user)):
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO playlists (user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (user["id"], payload.name.strip(), now(), now()),
        )
        row = _own_playlist(conn, cur.lastrowid, user["id"])
        return _playlist_summary(conn, row)


@router.get("/playlists/{playlist_id}")
def get_playlist(playlist_id: int, user: dict = Depends(current_user)):
    with connect() as conn:
        row = _own_playlist(conn, playlist_id, user["id"])
        tracks = conn.execute(
            """
            SELECT t.data FROM playlist_tracks pt JOIN tracks t ON t.video_id = pt.video_id
            WHERE pt.playlist_id = ? ORDER BY pt.added_at, pt.rowid
            """,
            (playlist_id,),
        ).fetchall()
        return {**_playlist_summary(conn, row), "tracks": [row_to_track(t) for t in tracks]}


@router.patch("/playlists/{playlist_id}")
def rename_playlist(playlist_id: int, payload: PlaylistIn, user: dict = Depends(current_user)):
    with connect() as conn:
        _own_playlist(conn, playlist_id, user["id"])
        conn.execute(
            "UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?",
            (payload.name.strip(), now(), playlist_id),
        )
        return _playlist_summary(conn, _own_playlist(conn, playlist_id, user["id"]))


@router.delete("/playlists/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: int, user: dict = Depends(current_user)):
    with connect() as conn:
        _own_playlist(conn, playlist_id, user["id"])
        conn.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))


@router.post("/playlists/{playlist_id}/tracks", status_code=204)
def add_to_playlist(playlist_id: int, track: TrackIn, user: dict = Depends(current_user)):
    with connect() as conn:
        _own_playlist(conn, playlist_id, user["id"])
        upsert_track(conn, track.model_dump())
        cur = conn.execute(
            "INSERT OR IGNORE INTO playlist_tracks (playlist_id, video_id, added_at) VALUES (?, ?, ?)",
            (playlist_id, track.videoId, now()),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=409, detail="Track already in playlist")
        conn.execute("UPDATE playlists SET updated_at = ? WHERE id = ?", (now(), playlist_id))


@router.delete("/playlists/{playlist_id}/tracks/{video_id}", status_code=204)
def remove_from_playlist(playlist_id: int, video_id: str, user: dict = Depends(current_user)):
    with connect() as conn:
        _own_playlist(conn, playlist_id, user["id"])
        conn.execute(
            "DELETE FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?",
            (playlist_id, video_id),
        )
        conn.execute("UPDATE playlists SET updated_at = ? WHERE id = ?", (now(), playlist_id))
