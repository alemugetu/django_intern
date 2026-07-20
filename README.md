# DevBlog — Full-Stack Blog Application

A production-grade blog platform built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

## Tech Stack

| Layer       | Technology                                                 |
| ----------- | ---------------------------------------------------------- |
| Backend API | Django 6, Django REST Framework 3.16                       |
| Auth        | DRF Token Authentication                                   |
| Database    | SQLite (dev) — swap `DATABASES` for Postgres in production |
| Media       | Pillow + Django `MEDIA_ROOT`                               |
| Frontend    | React 18, Vite 6, Tailwind CSS 3                           |
| HTTP Client | Axios (with token interceptor)                             |
| Markdown    | @uiw/react-md-editor                                       |
| CORS        | django-cors-headers                                        |

---

## Project Structure

```
django_intern/
├── core/               # Django project settings & root URLs
├── blog/               # Main app — models, API views, serializers, permissions
│   ├── models.py       # Blog, Tag, Comment
│   ├── serializers.py  # DRF serializers (list + detail + comment + tag)
│   ├── api_views.py    # Class-based & function-based API views
│   ├── permissions.py  # IsAuthorOrReadOnly, IsAdminOrReadOnly
│   └── migrations/
├── frontend/           # React + Vite SPA
│   ├── src/
│   │   ├── api/        # axios client, posts.js, auth.js
│   │   ├── context/    # AuthContext (global login state)
│   │   ├── components/ # Navbar, PostCard, CommentSection, ProtectedRoute…
│   │   └── pages/      # PostList, PostDetail, CreatePost, Login, Register
│   └── vite.config.js  # Dev proxy → Django :8000
├── .env                # Secret key, DEBUG, CORS origins
├── requirements.txt
└── README.md
```

---

## Backend Setup

### 1. Create & activate the virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` (or edit the existing `.env`):

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Create a superuser (for admin + tag management)

```bash
python manage.py createsuperuser
```

### 6. Start the Django development server

```bash
python manage.py runserver
```

Backend runs at **http://127.0.0.1:8000**

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

The Vite dev server proxies all `/api/*` and `/media/*` requests to Django on port 8000, so no CORS configuration is needed during local development.

---

## API Endpoint Map

### Posts

| Method        | Endpoint             | Auth           | Description                            |
| ------------- | -------------------- | -------------- | -------------------------------------- |
| `GET`         | `/api/posts/`        | No             | Paginated list of published posts      |
| `POST`        | `/api/posts/`        | Token          | Create a new post                      |
| `GET`         | `/api/posts/<slug>/` | No             | Retrieve post detail + increment views |
| `PUT`/`PATCH` | `/api/posts/<slug>/` | Token (author) | Update post                            |
| `DELETE`      | `/api/posts/<slug>/` | Token (author) | Delete post                            |

**Query params on `GET /api/posts/`:**

- `?search=<term>` — case-insensitive search on title and content
- `?tag=<slug>` — filter by tag (e.g. `?tag=python`)
- `?ordering=created_at` or `?ordering=-number_of_views`
- `?page=<n>` — pagination (10 per page)

### Comments

| Method   | Endpoint                      | Auth           | Description                            |
| -------- | ----------------------------- | -------------- | -------------------------------------- |
| `GET`    | `/api/posts/<slug>/comments/` | No             | List comments with nested replies      |
| `POST`   | `/api/posts/<slug>/comments/` | Token          | Add comment (set `parent` ID to reply) |
| `PATCH`  | `/api/comments/<id>/`         | Token (author) | Edit comment body                      |
| `DELETE` | `/api/comments/<id>/`         | Token (author) | Delete comment + replies               |

### Tags

| Method         | Endpoint            | Auth  | Description         |
| -------------- | ------------------- | ----- | ------------------- |
| `GET`          | `/api/tags/`        | No    | List all tags       |
| `POST`         | `/api/tags/`        | Admin | Create tag          |
| `GET`          | `/api/tags/<slug>/` | No    | Tag detail          |
| `PUT`/`DELETE` | `/api/tags/<slug>/` | Admin | Update / delete tag |

### Auth

| Method | Endpoint              | Auth  | Description                       |
| ------ | --------------------- | ----- | --------------------------------- |
| `POST` | `/api/auth/register/` | No    | Create account → returns token    |
| `POST` | `/api/auth/login/`    | No    | Credentials → returns token       |
| `POST` | `/api/auth/logout/`   | Token | Invalidate token                  |
| `GET`  | `/api/auth/me/`       | Token | Current user profile + post stats |

**Token usage:**

```
Authorization: Token <your-token-here>
```

---

## Frontend Routes

| Path            | Access        | Description                          |
| --------------- | ------------- | ------------------------------------ |
| `/`             | Public        | Post grid with search and tag filter |
| `/posts/<slug>` | Public        | Full post with comments              |
| `/login`        | Public        | Login form                           |
| `/register`     | Public        | Registration form                    |
| `/create`       | **Protected** | Rich markdown post editor            |
| `/edit/<slug>`  | **Protected** | Edit existing post (author only)     |

---

## Key Features

- **SEO-friendly slug URLs** — posts live at `/posts/my-post-title/`
- **Draft / Published workflow** — stage posts before making them public
- **Tagging system** — M2M tags with slug-based filtering
- **Threaded comments** — top-level comments with one level of replies
- **Read time calculator** — estimated at 200 wpm, shown on every post card
- **View counter** — atomic increment per detail request
- **Protected routes** — `/create` and `/edit` redirect to login if unauthenticated
- **Token auth** — stored in `localStorage`, auto-attached by axios interceptor
- **CORS configured** — `django-cors-headers` allows the Vite dev origin

---

## Django Admin

Visit **http://127.0.0.1:8000/admin/** after creating a superuser.

The admin includes:

- Inline comment editor on post pages
- Tag management with `prepopulated_fields` for slug
- `list_editable` status toggle — publish multiple posts in one click
- Full search across title, content, and author username
