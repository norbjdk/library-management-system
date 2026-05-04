from __future__ import annotations

from django.shortcuts import get_object_or_404
from library.authentication import issue_token_pair, refresh_access_token
from library.models import LibraryUser
from library.serializers import ReaderProfileSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email or not password:
            raise AuthenticationFailed("Email and password are required.")

        user = LibraryUser.objects.filter(email__iexact=email).first()
        if user is None or user.password != password:
            raise AuthenticationFailed("Invalid credentials.")

        tokens = issue_token_pair(user)
        profile = ReaderProfileSerializer(user).data
        return Response({"user": profile, **tokens})


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh_token") or ""
        if not refresh_token:
            raise AuthenticationFailed("Refresh token is required.")
        tokens = refresh_access_token(refresh_token)
        return Response(tokens)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise AuthenticationFailed("Authentication required.")
        profile = get_object_or_404(LibraryUser, pk=user.id)
        return Response(ReaderProfileSerializer(profile).data)
