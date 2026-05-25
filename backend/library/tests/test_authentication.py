from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from library.models import (
    Book,
    BookCondition,
    Copy,
    Fine,
    LibraryRole,
    LibraryUser,
    Loan,
    LoanStatus,
    Notification,
    NotificationType,
    Reservation,
    ReservationStatus,
)

from .base import LibraryAPITestCase


class AuthenticationApiTests(LibraryAPITestCase):
    def test_register_ignores_stale_access_cookie_for_deleted_user(self):
        ghost_user = LibraryUser.objects.create(
            first_name="Ghost",
            last_name="Reader",
            email="ghost.reader@library.com",
            birthdate="1999-01-01",
            password="passwd",
            role=LibraryRole.READER,
        )
        access_token = self.token_pair(ghost_user)["access_token"]
        ghost_user.delete()
        self.client.cookies["library_access_token"] = access_token

        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "recover.reader@library.com",
                "password": "passwd",
                "first_name": "Recover",
                "last_name": "Reader",
                "birthdate": "2001-04-10",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "recover.reader@library.com")

    def test_register_creates_reader_and_returns_token_pair(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "  new.reader@library.com ",
                "password": "new-passwd",
                "first_name": "  Ewa ",
                "last_name": " Nowak ",
                "birthdate": "2000-05-20",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["user"]["email"], "new.reader@library.com")
        self.assertEqual(response.data["user"]["first_name"], "Ewa")
        self.assertEqual(response.data["user"]["last_name"], "Nowak")
        self.assertEqual(response.data["user"]["role"], LibraryRole.READER)
        self.assertFalse(response.data["user"]["is_staff"])
        self.assertIn("library_access_token", response.cookies)
        self.assertIn("library_refresh_token", response.cookies)

    def test_login_returns_token_pair_and_profile(self):
        response = self.client.post(
            reverse("auth-login"),
            {"email": self.reader.email.upper(), "password": self.reader.password},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["token_type"], "Bearer")
        self.assertEqual(response.data["user"]["email"], self.reader.email)
        self.assertEqual(response.data["user"]["full_name"], self.reader.full_name)
        self.assertEqual(response.data["user"]["role"], LibraryRole.READER)
        self.assertFalse(response.data["user"]["is_staff"])
        self.assertIn("library_access_token", response.cookies)
        self.assertIn("library_refresh_token", response.cookies)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse("auth-login"),
            {"email": self.reader.email, "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertIn("detail", response.data)

    def test_refresh_returns_new_token_pair(self):
        refresh_token = self.token_pair(self.reader)["refresh_token"]

        response = self.client.post(
            reverse("auth-refresh"), {"refresh_token": refresh_token}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["token_type"], "Bearer")

    def test_refresh_accepts_refresh_cookie(self):
        refresh_token = self.token_pair(self.reader)["refresh_token"]
        self.client.cookies["library_refresh_token"] = refresh_token

        response = self.client.post(reverse("auth-refresh"), {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.data)
        self.assertIn("library_access_token", response.cookies)

    def test_me_endpoint_accepts_access_cookie(self):
        access_token = self.token_pair(self.reader)["access_token"]
        self.client.cookies["library_access_token"] = access_token

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.reader.email)

    def test_logout_clears_auth_cookies(self):
        self.client.cookies["library_access_token"] = self.token_pair(self.reader)[
            "access_token"
        ]
        self.client.cookies["library_refresh_token"] = self.token_pair(self.reader)[
            "refresh_token"
        ]

        response = self.client.post(reverse("auth-logout"), {}, format="json")

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.cookies["library_access_token"].value, "")
        self.assertEqual(response.cookies["library_refresh_token"].value, "")

    def test_me_endpoint_returns_authenticated_user(self):
        response = self.authenticated_client(self.reader).get(reverse("auth-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.reader.email)
        self.assertEqual(response.data["full_name"], self.reader.full_name)
        self.assertEqual(response.data["role"], self.reader.role)
        self.assertFalse(response.data["is_staff"])

    def test_profile_summary_includes_user_counts(self):
        Fine.objects.create(
            loan=self.loan,
            user=self.reader,
            amount=Decimal("12.50"),
        )

        response = self.authenticated_client(self.reader).get(reverse("profile"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["loan_count"], 1)
        self.assertEqual(response.data["summary"]["reservation_count"], 1)
        self.assertEqual(response.data["summary"]["notification_count"], 1)
        self.assertEqual(
            Decimal(str(response.data["summary"]["fine_total"])), Decimal("12.50")
        )

    def test_staff_profile_summary_uses_visible_system_counts(self):
        Fine.objects.create(
            loan=self.loan,
            user=self.reader,
            amount=Decimal("12.50"),
        )
        returned_copy = Copy.objects.create(
            book=self.book,
            location=self.location,
            condition=BookCondition.GOOD,
            available=True,
        )
        Loan.objects.create(
            copy=returned_copy,
            user=self.staff,
            loan_date=self.today - timedelta(days=14),
            due_date=self.today - timedelta(days=7),
            return_date=self.today - timedelta(days=1),
            status=LoanStatus.RETURNED,
        )
        Reservation.objects.create(
            book=Book.objects.create(title="Archiwum burz", ean="222-22-2222-222-2"),
            user=self.staff,
            reservation_date=self.today - timedelta(days=5),
            expiry_date=self.today + timedelta(days=2),
            status=ReservationStatus.CANCELLED,
        )
        Notification.objects.create(
            user=self.other_reader,
            notification_type=NotificationType.ORDER_UPDATE,
            title="Nowa dostawa",
            message="Do systemu trafiło kolejne powiadomienie.",
        )

        response = self.authenticated_client(self.staff).get(reverse("profile"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["loan_count"], 1)
        self.assertEqual(response.data["summary"]["reservation_count"], 2)
        self.assertEqual(response.data["summary"]["notification_count"], 2)
        self.assertEqual(
            Decimal(str(response.data["summary"]["fine_total"])), Decimal("12.50")
        )

    def test_profile_update_returns_fresh_summary(self):
        Fine.objects.create(
            loan=self.loan,
            user=self.reader,
            amount=Decimal("12.50"),
        )

        response = self.authenticated_client(self.reader).patch(
            reverse("profile"),
            {"first_name": "  Anna Maria  "},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["first_name"], "Anna Maria")
        self.assertEqual(response.data["summary"]["loan_count"], 1)
        self.assertEqual(response.data["summary"]["reservation_count"], 1)
        self.assertEqual(response.data["summary"]["notification_count"], 1)
        self.assertEqual(
            Decimal(str(response.data["summary"]["fine_total"])), Decimal("12.50")
        )
