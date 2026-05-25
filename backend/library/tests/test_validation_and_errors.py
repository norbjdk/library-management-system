from __future__ import annotations

from datetime import timedelta

from django.urls import reverse
from rest_framework.test import APIClient

from .base import LibraryAPITestCase


class ValidationAndErrorApiTests(LibraryAPITestCase):
    def test_admin_request_with_missing_title_returns_400(self):
        response = self.authenticated_client(self.admin).post(
            reverse("book-list"),
            {"publisher": self.publisher.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.data)

    def test_librarian_request_for_book_create_returns_403(self):
        response = self.authenticated_client(self.staff).post(
            reverse("book-list"),
            {"publisher": self.publisher.id},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_duplicate_reservation_for_same_book_and_user_is_rejected(self):
        response = self.authenticated_client(self.reader).post(
            reverse("reservation-list"),
            {
                "book": self.book.id,
                "expiry_date": (self.today + timedelta(days=7)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(
            response.data["non_field_errors"][0],
            "Masz już rezerwację tej książki. Sprawdź jej status w kolejce.",
        )

    def test_negative_order_quantity_returns_400(self):
        response = self.authenticated_client(self.staff).post(
            reverse("order-list"),
            {
                "book": self.book.id,
                "quantity": -1,
                "supplier": "Media Rodzina",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.data)

    def test_reader_cannot_access_reader_list(self):
        response = self.authenticated_client(self.reader).get(reverse("reader-list"))

        self.assertEqual(response.status_code, 403)

    def test_invalid_access_token_returns_401(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")

        response = client.get(reverse("profile"))

        self.assertEqual(response.status_code, 401)
        self.assertIn("detail", response.data)

    def test_unauthenticated_profile_access_returns_401(self):
        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, 401)
