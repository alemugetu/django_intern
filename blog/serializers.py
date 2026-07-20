from rest_framework import serializers

from .models import Blog, Comment, Tag


# ─── Tag ──────────────────────────────────────────────────────────────────────

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


# ─── Comment ──────────────────────────────────────────────────────────────────

class ReplySerializer(serializers.ModelSerializer):
    """Flat serializer for replies — no further nesting."""
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'body', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class CommentSerializer(serializers.ModelSerializer):
    """
    Top-level comment serializer.
    Nests its direct replies so a single request returns the full thread.
    """
    author = serializers.StringRelatedField(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'body', 'parent', 'replies', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'replies', 'created_at', 'updated_at']

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError('Comment body cannot be blank.')
        return value.strip()


# ─── Blog ─────────────────────────────────────────────────────────────────────

class BlogListSerializer(serializers.ModelSerializer):
    """
    Lightweight card serializer for the list endpoint.
    Keeps the payload small — full content body is excluded.
    Tags are returned as their slug strings for easy filtering on the frontend.
    """
    author = serializers.StringRelatedField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    read_time = serializers.CharField(read_only=True)

    class Meta:
        model = Blog
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'status',
            'tags',
            'featured_image',
            'read_time',
            'number_of_views',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'number_of_views', 'created_at', 'updated_at']


class BlogDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for create / retrieve / update / delete.

    Tag write interface:
      Send tag IDs in a 'tag_ids' list to set tags on a post.
      e.g. { "tag_ids": [1, 3] }
      Tags are read back as full TagSerializer objects.
    """
    author = serializers.StringRelatedField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    read_time = serializers.CharField(read_only=True)

    # Write-only field for setting tags by ID list
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='tags',
    )

    # Nested comments (read-only, only top-level; replies are nested inside each comment)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Blog
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'content',
            'featured_image',
            'status',
            'tags',
            'tag_ids',
            'read_time',
            'comments',
            'number_of_views',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'number_of_views',
            'created_at', 'updated_at',
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip()

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Content cannot be blank.')
        return value

    def get_comments(self, obj):
        """Only return top-level comments; replies are nested inside them."""
        top_level = obj.comments.filter(parent=None).prefetch_related('replies')
        return CommentSerializer(top_level, many=True).data
