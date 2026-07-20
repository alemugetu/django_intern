from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthorOrReadOnly(BasePermission):
    """
    Object-level permission used on Blog posts and Comments.

    Matrix:
    ┌─────────────────────────────────┬──────────┬────────────┐
    │ Who                             │ Safe     │ Write      │
    ├─────────────────────────────────┼──────────┼────────────┤
    │ Anonymous                       │ ✅ allow │ ❌ deny    │
    │ Authenticated, not the author   │ ✅ allow │ ❌ deny    │
    │ The object's own author         │ ✅ allow │ ✅ allow   │
    └─────────────────────────────────┴──────────┴────────────┘
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user


class IsAdminOrReadOnly(BasePermission):
    """
    Used on Tag endpoints — anyone can read tags, only admin users can
    create, update, or delete them to prevent tag pollution.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
