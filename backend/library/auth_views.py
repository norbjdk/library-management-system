from __future__ import annotations

from django.shortcuts import get_object_or_404
from library.authentication import (
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    issue_token_pair,
    refresh_access_token,
)
from library.models import LibraryUser
from library.serializers import ReaderProfileSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def _attach_auth_cookies(response: Response, tokens: dict[str, str]) -> Response:
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        tokens["access_token"],
        max_age=tokens["access_expires_in"],
        httponly=True,
        samesite="Lax",
        path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        tokens["refresh_token"],
        max_age=tokens["refresh_expires_in"],
        httponly=True,
        samesite="Lax",
        path="/",
    )
    return response


def _clear_auth_cookies(response: Response) -> Response:
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/", samesite="Lax")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/", samesite="Lax")
    return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email or not password:
            raise AuthenticationFailed("Email i hasło są wymagane.")

        user = LibraryUser.objects.filter(email__iexact=email).first()
        if user is None or user.password != password:
            raise AuthenticationFailed("Nieprawidłowe dane logowania.")

        tokens = issue_token_pair(user)
        profile = ReaderProfileSerializer(user).data
        return _attach_auth_cookies(Response({"user": profile, **tokens}), tokens)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data.copy()
        payload["email"] = (payload.get("email") or "").strip().lower()
        payload["first_name"] = (payload.get("first_name") or "").strip()
        payload["last_name"] = (payload.get("last_name") or "").strip()

        serializer = ReaderProfileSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = issue_token_pair(user)
        profile = ReaderProfileSerializer(user).data
        return _attach_auth_cookies(
            Response({"user": profile, **tokens}, status=201),
            tokens,
        )


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = (
            request.data.get("refresh_token")
            or request.COOKIES.get(REFRESH_COOKIE_NAME)
            or ""
        )
        if not refresh_token:
            raise AuthenticationFailed("Refresh token jest wymagany.")
        tokens = refresh_access_token(refresh_token)
        return _attach_auth_cookies(Response(tokens), tokens)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return _clear_auth_cookies(Response(status=204))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise AuthenticationFailed("Wymagana autentykacja.")
        profile = get_object_or_404(LibraryUser, pk=user.id)
        return Response(ReaderProfileSerializer(profile).data)
