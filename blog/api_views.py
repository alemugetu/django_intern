from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import filters, generics, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes as pc
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Blog, Comment, Tag
from .permissions import IsAdminOrReadOnly, IsAuthorOrReadOnly
from .serializers import (
    BlogDetailSerializer,
    BlogListSerializer,
    CommentSerializer,
    TagSerializer,
)


# ─── Blog endpoints ───────────────────────────────────────────────────────────

class BlogListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/posts/
        Paginated list of published posts.
        Query params:
          ?search=<term>    — case-insensitive match on title + content
          ?ordering=<field> — created_at | number_of_views (prefix - for desc)
          ?tag=<slug>       — filter by tag slug  e.g. ?tag=python

    POST /api/posts/
        Create a new post. Requires authentication.
        Author is auto-assigned to the requesting user.
    """

    permission_classes = [IsAuthorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'number_of_views']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            qs = (
                Blog.objects.filter(status=Blog.Status.PUBLISHED) |
                Blog.objects.filter(author=user)
            ).distinct().select_related('author').prefetch_related('tags')
        else:
            qs = (
                Blog.objects
                .filter(status=Blog.Status.PUBLISHED)
                .select_related('author')
                .prefetch_related('tags')
            )

        # Tag filtering: /api/posts/?tag=python
        tag_slug = self.request.query_params.get('tag')
        if tag_slug:
            qs = qs.filter(tags__slug=tag_slug)

        return qs

    def get_serializer_class(self):
        return BlogListSerializer if self.request.method == 'GET' else BlogDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class BlogRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/posts/<slug>/   Retrieve a published post. Increments view count.
    PUT    /api/posts/<slug>/   Full update — author only.
    PATCH  /api/posts/<slug>/   Partial update — author only.
    DELETE /api/posts/<slug>/   Delete — author only.
    """

    serializer_class = BlogDetailSerializer
    permission_classes = [IsAuthorOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            return (
                Blog.objects.filter(status=Blog.Status.PUBLISHED) |
                Blog.objects.filter(author=user)
            ).distinct().select_related('author').prefetch_related('tags', 'comments__author', 'comments__replies__author')
        return (
            Blog.objects
            .filter(status=Blog.Status.PUBLISHED)
            .select_related('author')
            .prefetch_related('tags', 'comments__author', 'comments__replies__author')
        )

    def retrieve(self, request, *args, **kwargs):
        """Increment view counter atomically on every detail GET."""
        instance = self.get_object()
        Blog.objects.filter(pk=instance.pk).update(
            number_of_views=instance.number_of_views + 1
        )
        instance.refresh_from_db(fields=['number_of_views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ─── Tag endpoints ────────────────────────────────────────────────────────────

class TagListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/tags/   List all tags. Public.
    POST /api/tags/   Create a tag. Admin only.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class TagRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/tags/<slug>/   Tag detail. Public.
    PUT    /api/tags/<slug>/   Update — admin only.
    DELETE /api/tags/<slug>/   Delete — admin only.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


# ─── Comment endpoints ────────────────────────────────────────────────────────

class CommentListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/posts/<slug>/comments/
        All top-level comments for a post, with replies nested inside.

    POST /api/posts/<slug>/comments/
        Add a comment. Authenticated users only.
        To reply, include "parent": <comment_id> in the body.
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]

    def get_queryset(self):
        return (
            Comment.objects
            .filter(post__slug=self.kwargs['slug'], parent=None)
            .select_related('author')
            .prefetch_related('replies__author')
        )

    def perform_create(self, serializer):
        post = generics.get_object_or_404(Blog, slug=self.kwargs['slug'])
        serializer.save(author=self.request.user, post=post)


class CommentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/comments/<id>/   Comment detail.
    PATCH  /api/comments/<id>/   Edit body — author only.
    DELETE /api/comments/<id>/   Delete — author only (cascades to replies).
    """
    queryset = Comment.objects.select_related('author').prefetch_related('replies__author')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]


# ─── Auth endpoints ───────────────────────────────────────────────────────────

@api_view(['POST'])
@pc([AllowAny])
def register(request):
    """
    POST /api/auth/register/
    Body: { "username": "...", "password": "...", "email": "..." }

    Creates a new account and immediately returns an auth token.
    Django's built-in password validators run via set_password.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()

    if not username or not password:
        return Response(
            {'error': 'username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'A user with that username already exists.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(username=username, password=password, email=email)
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {'token': token.key, 'user_id': user.pk, 'username': user.username},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@pc([AllowAny])
def login(request):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }

    Returns a token the client attaches to subsequent requests as:
        Authorization: Token <token>
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        # Intentionally vague — don't reveal which field was wrong
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user_id': user.pk, 'username': user.username})


@api_view(['POST'])
@pc([IsAuthenticated])
def logout(request):
    """
    POST /api/auth/logout/
    Authorization: Token <token>

    Deletes the token server-side. Client must discard it locally too.
    """
    request.user.auth_token.delete()
    return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@pc([IsAuthenticated])
def me(request):
    """
    GET /api/auth/me/
    Authorization: Token <token>

    Returns the currently authenticated user's profile and their post stats.
    Useful for the frontend to personalise the UI after login.
    """
    user = request.user
    return Response({
        'user_id': user.pk,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'post_count': user.blog_posts.filter(status=Blog.Status.PUBLISHED).count(),
        'draft_count': user.blog_posts.filter(status=Blog.Status.DRAFT).count(),
    })

