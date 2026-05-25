from library.models import LibraryRole
from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_staff_principal(user) -> bool:
    return getattr(user, "is_authenticated", False) and getattr(user, "role", None) in {
        LibraryRole.LIBRARIAN,
        LibraryRole.ADMIN,
    }


def is_admin_principal(user) -> bool:
    return (
        getattr(user, "is_authenticated", False)
        and getattr(user, "role", None) == LibraryRole.ADMIN
    )


class IsStaffWriteOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_staff_principal(getattr(request, "user", None))


class IsAdminWriteOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_admin_principal(getattr(request, "user", None))


class IsAdminWriteOrStaffReadOnly(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if request.method in SAFE_METHODS:
            return is_staff_principal(user)
        return is_admin_principal(user)


class IsStaffMember(BasePermission):
    def has_permission(self, request, view):
        return is_staff_principal(getattr(request, "user", None))


class IsAdminMember(BasePermission):
    def has_permission(self, request, view):
        return is_admin_principal(getattr(request, "user", None))


class IsAuthenticatedPrincipal(BasePermission):
    def has_permission(self, request, view):
        return getattr(request, "user", None) is not None and getattr(
            request.user, "is_authenticated", False
        )


class IsCurrentUserOrStaff(BasePermission):
    def has_permission(self, request, view):
        return getattr(request, "user", None) is not None and getattr(
            request.user, "is_authenticated", False
        )

    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)
        if is_staff_principal(user):
            return True

        owner_id = getattr(obj, "user_id", None)
        if owner_id is None:
            owner_id = getattr(obj, "id", None)

        return owner_id == getattr(user, "id", None)
