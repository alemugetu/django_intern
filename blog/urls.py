from django.urls import path

from .api_views import (
    # Blog
    BlogListCreateAPIView,
    BlogRetrieveUpdateDestroyAPIView,
    # Tags
    TagListCreateAPIView,
    TagRetrieveUpdateDestroyAPIView,
    # Comments
    CommentListCreateAPIView,
    CommentRetrieveUpdateDestroyAPIView,
    # Auth
    login,
    logout,
    me,
    register,
)

# ─── REST API routes ──────────────────────────────────────────────────────────
#
# Posts
#   GET  /api/posts/                       paginated list; ?search= ?tag= ?ordering=
#   POST /api/posts/                       create post (auth required)
#   GET  /api/posts/<slug>/                retrieve post + increment views
#   PUT|PATCH  /api/posts/<slug>/          update post (author only)
#   DELETE     /api/posts/<slug>/          delete post (author only)
#
# Comments
#   GET  /api/posts/<slug>/comments/       list top-level comments w/ nested replies
#   POST /api/posts/<slug>/comments/       add comment (auth required)
#   GET|PATCH|DELETE /api/comments/<id>/   manage a single comment (author only)
#
# Tags
#   GET  /api/tags/                        list all tags
#   POST /api/tags/                        create tag (admin only)
#   GET|PUT|DELETE /api/tags/<slug>/       manage a single tag (admin only)
#
# Auth
#   POST /api/auth/register/               create account → token
#   POST /api/auth/login/                  credentials → token
#   POST /api/auth/logout/                 invalidate token
#   GET  /api/auth/me/                     current user profile

urlpatterns = [
    # Posts
    path('posts/', BlogListCreateAPIView.as_view(), name='api_post_list'),
    path('posts/<slug:slug>/', BlogRetrieveUpdateDestroyAPIView.as_view(), name='api_post_detail'),

    # Comments (scoped to a post)
    path('posts/<slug:slug>/comments/', CommentListCreateAPIView.as_view(), name='api_comment_list'),

    # Comments (standalone — for edit / delete by ID)
    path('comments/<int:pk>/', CommentRetrieveUpdateDestroyAPIView.as_view(), name='api_comment_detail'),

    # Tags
    path('tags/', TagListCreateAPIView.as_view(), name='api_tag_list'),
    path('tags/<slug:slug>/', TagRetrieveUpdateDestroyAPIView.as_view(), name='api_tag_detail'),

    # Auth
    path('auth/register/', register, name='api_register'),
    path('auth/login/', login, name='api_login'),
    path('auth/logout/', logout, name='api_logout'),
    path('auth/me/', me, name='api_me'),
]
