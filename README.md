# Музыкалити

Музыкальный плеер в стиле Spotify (фиолетовая тема) на Vue 3 + FastAPI.
Музыку берёт из YouTube Music через `ytmusicapi`, поток отдаёт через `yt-dlp`.

- Поиск по двум источникам: **треки** YouTube Music и **видео** YouTube (переключатель в строке поиска). Выдача выглядит одинаково.
- Чарты на главной, очередь и панель «Сейчас играет», shuffle / repeat, автопереход к следующему треку.
- Вход через Google, лайки и свои плейлисты хранятся на бэкенде (SQLite).
- Горячие клавиши (нажмите `?`), Media Session (медиаклавиши и шторка ОС), состояние плеера сохраняется между перезагрузками.

## Запуск

### 1. Бэкенд

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # и заполнить GOOGLE_CLIENT_ID
uvicorn app:app --reload --port 8000
```

Про авторизацию в YouTube Music (`browser.json` / `oauth.json`) см. [backend/README.md](backend/README.md).

### 2. Фронтенд

```bash
npm install
npm run dev
```

Откройте http://localhost:3000. Vite проксирует `/api` на бэкенд.

## Вход через Google

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID** → тип **Web application**.
2. В **Authorized JavaScript origins** добавьте `http://localhost:3000` (и прод-домен, если есть).
3. Скопируйте Client ID в `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```
4. Перезапустите бэкенд. Фронт получает Client ID с `/api/auth/config`, отдельно его настраивать не нужно.

Фронт получает от Google ID-токен, бэкенд проверяет его и выставляет httpOnly-cookie с сессией на 30 дней.

## Структура

```
backend/
  app.py        музыкальное API: поиск, чарты, поток; нормализует треки в единый формат
  user_api.py   Google-вход, сессии, лайки, плейлисты
  db.py         SQLite-схема
src/
  stores/       player (очередь, воспроизведение), library (лайки, плейлисты), auth, ui
  views/        Главная, Поиск, Любимые треки, Плейлист, Медиатека (мобильная)
  components/
    layout/     TopBar, SearchBox, Sidebar, QueuePanel, PlayerBar
    tracks/     TrackList, TrackRow
    overlays/   контекстное меню трека, логин, диалоги, тосты, горячие клавиши
```

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/search?q=&source=songs\|videos` | поиск |
| GET | `/api/charts?country=RU` | чарты |
| GET | `/api/track?id=` | прямая ссылка на аудиопоток |
| GET | `/api/auth/config` | Google Client ID |
| POST | `/api/auth/google` | вход по Google ID-токену |
| GET | `/api/auth/me` | текущий пользователь |
| POST | `/api/auth/logout` | выход |
| GET / PUT / DELETE | `/api/likes`, `/api/likes/{videoId}` | лайки |
| GET / POST | `/api/playlists` | список / создание |
| GET / PATCH / DELETE | `/api/playlists/{id}` | плейлист |
| POST / DELETE | `/api/playlists/{id}/tracks[/{videoId}]` | треки плейлиста |
