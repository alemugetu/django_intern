from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class Tag(models.Model):
    """
    Taxonomy model for organising posts by topic (e.g. #Python, #WebDev).

    Uses a slug as the natural lookup key so the API can filter by
    /api/posts/?tag=python without exposing numeric IDs.
    """

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Blog(models.Model):
    """
    Core blog post model.

    Design decisions:
    - slug       : SEO-friendly URLs, auto-generated from title on first save.
    - status     : Draft/Published workflow — authors stage content before going live.
    - tags       : M2M to Tag; enables category filtering and discovery.
    - featured_image: Optional hero thumbnail served via MEDIA_URL.
    - number_of_views: Lightweight hit counter, incremented atomically per detail request.
    - read_time  : Computed property — no DB column needed.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'

    title = models.CharField(max_length=200)

    # SEO-friendly URL segment — auto-populated from title via save()
    slug = models.SlugField(max_length=250, unique=True, blank=True)

    # Data ownership: every post is tied to a Django User.
    # null=True keeps the migration safe when existing rows have no author yet.
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blog_posts',
        null=True,
        blank=True,
    )

    content = models.TextField()

    # Optional hero/thumbnail image for the post
    featured_image = models.ImageField(
        upload_to='blog/featured_images/',
        blank=True,
        null=True,
    )

    # Draft → Published editorial workflow
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # Many-to-many taxonomy — a post can have many tags, a tag can span many posts
    tags = models.ManyToManyField(
        Tag,
        related_name='posts',
        blank=True,
    )

    number_of_views = models.PositiveIntegerField(default=0)

    # Auto-managed timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['slug']),
        ]
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Auto-generate slug from title on first save. Never overwrite an existing slug."""
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def read_time(self):
        """
        Estimates reading time at 200 wpm (average adult reading speed).
        Returns a human-readable string e.g. '5 min read'.
        Minimum is always 1 minute.
        """
        word_count = len(self.content.split())
        minutes = max(1, round(word_count / 200))
        return f'{minutes} min read'

    @property
    def is_published(self):
        """Convenience property for template/API consumers."""
        return self.status == self.Status.PUBLISHED


class Comment(models.Model):
    """
    Threaded comment model.

    Top-level comments have parent=None.
    Replies set parent to another Comment instance.
    This single self-referential FK supports one level of nesting
    (comment → reply) which covers the vast majority of blog use-cases
    without the complexity of a full adjacency list or MPTT tree.
    """

    post = models.ForeignKey(
        Blog,
        on_delete=models.CASCADE,
        related_name='comments',
    )

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
    )

    # Null parent = top-level comment; non-null = a direct reply
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True,
    )

    body = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
        ]
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'Comment by {self.author} on "{self.post.title}"'

    @property
    def is_reply(self):
        return self.parent is not None
