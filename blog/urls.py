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
