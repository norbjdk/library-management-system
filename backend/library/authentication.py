from __future__ import annotations

from dataclasses import dataclass

from django.core import signing
from library.models import LibraryUser
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

TOKEN_SALT = "library-management-system.auth"
ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60
REFRESH_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60
ACCESS_COOKIE_NAME = "library_access_token"
REFRESH_COOKIE_NAME = "library_refresh_token"


@dataclass(slots=True)
class LibraryPrincipal:
    id: int
    email: str
    first_name: str
    last_name: str
    role: str

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def is_staff(self) -> bool:
        return self.role in {"librarian", "admin"}

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @classmethod
    def from_user(cls, user: LibraryUser) -> "LibraryPrincipal":
        return cls(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
        )


def _dump_token(payload: dict[str, object]) -> str:
    return signing.dumps(payload, salt=TOKEN_SALT)


def _load_token(token: str, *, max_age: int) -> dict[str, object]:
    try:
        data = signing.loads(token, salt=TOKEN_SALT, max_age=max_age)
    except signing.BadSignature as exc:
        raise AuthenticationFailed("Invalid authentication token.") from exc
    except signing.SignatureExpired as exc:
        raise AuthenticationFailed("Authentication token expired.") from exc

    if not isinstance(data, dict):
        raise AuthenticationFailed("Invalid authentication token payload.")

    return data


def issue_token_pair(user: LibraryUser) -> dict[str, str]:
    principal = LibraryPrincipal.from_user(user)
    access_payload = {
        "token_type": "access",
        "user_id": principal.id,
        "role": principal.role,
    }
    refresh_payload = {
        "token_type": "refresh",
        "user_id": principal.id,
        "role": principal.role,
    }
    return {
        "access_token": _dump_token(access_payload),
        "refresh_token": _dump_token(refresh_payload),
        "token_type": "Bearer",
        "access_expires_in": ACCESS_TOKEN_LIFETIME_SECONDS,
        "refresh_expires_in": REFRESH_TOKEN_LIFETIME_SECONDS,
    }


def refresh_access_token(refresh_token: str) -> dict[str, str]:
    payload = _load_token(refresh_token, max_age=REFRESH_TOKEN_LIFETIME_SECONDS)
    if payload.get("token_type") != "refresh":
        raise AuthenticationFailed("Expected a refresh token.")

    user_id = payload.get("user_id")
    if user_id is None:
        raise AuthenticationFailed("Refresh token payload is incomplete.")

    user = LibraryUser.objects.filter(pk=user_id).first()
    if user is None:
        raise AuthenticationFailed("User linked to this token no longer exists.")

    return issue_token_pair(user)


class LibraryTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()

        token: str | None = None

        if not header:
            token = request.COOKIES.get(ACCESS_COOKIE_NAME)
            if not token:
                return None

        if header:
            if len(header) != 2:
                raise AuthenticationFailed("Invalid authorization header.")

            keyword = header[0].decode("utf-8")
            if keyword.lower() != self.keyword.lower():
                return None

            token = header[1].decode("utf-8")

        if token is None:
            return None

        payload = _load_token(token, max_age=ACCESS_TOKEN_LIFETIME_SECONDS)
        if payload.get("token_type") != "access":
            raise AuthenticationFailed("Expected an access token.")

        user_id = payload.get("user_id")
        if user_id is None:
            raise AuthenticationFailed("Authentication token payload is incomplete.")

        user = LibraryUser.objects.filter(pk=user_id).first()
        if user is None:
            raise AuthenticationFailed("User linked to this token no longer exists.")

        return LibraryPrincipal.from_user(user), token

    def authenticate_header(self, request):
        return self.keyword
