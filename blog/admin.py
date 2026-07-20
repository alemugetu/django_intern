from django.contrib import admin

from .models import Blog, Comment, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


class CommentInline(admin.TabularInline):
    """Show top-level comments directly on the post admin page."""
    model = Comment
    fields = ('author', 'body', 'parent', 'created_at')
    readonly_fields = ('created_at',)
    extra = 0
    # Only show top-level comments in the inline; replies are accessible separately
    def get_queryset(self, request):
        return super().get_queryset(request).filter(parent=None)


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'tag_list', 'number_of_views', 'created_at')
    list_filter = ('status', 'tags', 'created_at', 'author')
    search_fields = ('title', 'content', 'author__username')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'number_of_views')
    list_editable = ('status',)
    filter_horizontal = ('tags',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    inlines = [CommentInline]

    def tag_list(self, obj):
        return ', '.join(t.name for t in obj.tags.all())
    tag_list.short_description = 'Tags'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'parent', 'created_at', 'is_reply')
    list_filter = ('created_at',)
    search_fields = ('author__username', 'body', 'post__title')
    readonly_fields = ('created_at', 'updated_at')

    def is_reply(self, obj):
        return obj.is_reply
    is_reply.boolean = True
    is_reply.short_description = 'Reply?'
