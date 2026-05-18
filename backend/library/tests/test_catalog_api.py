from __future__ import annotations

from datetime import timedelta

from django.urls import reverse
from library.models import Book

from .base import LibraryAPITestCase


class CatalogApiTests(LibraryAPITestCase):
    def test_api_root_exposes_primary_endpoint_groups(self):
        response = self.client.get(reverse("api-root"))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["auth"]["login"].endswith("/api/auth/login/"))
        self.assertTrue(
            response.data["catalog"]["books"].endswith("/api/catalog/books/")
        )
        self.assertTrue(response.data["circulation"]["loans"].endswith("/api/loans/"))

    def test_books_list_returns_catalog_metadata(self):
        response = self.client.get(reverse("book-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        book = response.data["results"][0]
        self.assertEqual(book["title"], self.book.title)
        self.assertEqual(book["copies_count"], 3)
        self.assertEqual(book["available_copies"], 1)
        self.assertEqual(book["active_loans"], 1)
        self.assertEqual(book["active_reservations"], 2)
        self.assertEqual(book["authors"][0]["id"], self.author.id)
        self.assertEqual(book["categories"][0]["name"], self.category.name)

    def test_book_availability_action_returns_snapshot(self):
        response = self.client.get(reverse("book-availability", args=[self.book.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["book_id"], self.book.id)
        self.assertEqual(response.data["total_copies"], 3)
        self.assertEqual(response.data["available_copies"], 1)
        self.assertEqual(response.data["active_loans"], 1)
        self.assertEqual(response.data["active_reservations"], 2)
        self.assertEqual(response.data["estimated_wait_days"], 7)
        self.assertEqual(
            response.data["estimated_ready_date"],
            (self.today + timedelta(days=7)).isoformat(),
        )

    def test_staff_can_create_book_with_authors_and_categories(self):
        payload = {
            "title": "Nowa Książka",
            "ean": "222-22-2222-222-2",
            "publish_year": 2024,
            "description": "Testowy rekord katalogowy.",
            "publisher": self.publisher.id,
            "author_ids": [self.author.id],
            "category_ids": [self.category.id],
        }

        response = self.authenticated_client(self.staff).post(
            reverse("book-list"), payload, format="json"
        )

        self.assertEqual(response.status_code, 201)
        created_book = Book.objects.get(ean="222-22-2222-222-2")
        self.assertEqual(created_book.authors.count(), 1)
        self.assertEqual(created_book.categories.count(), 1)

    def test_reader_cannot_create_book(self):
        payload = {
            "title": "Niedozwolona Książka",
            "publisher": self.publisher.id,
        }

        response = self.authenticated_client(self.reader).post(
            reverse("book-list"), payload, format="json"
        )

        self.assertEqual(response.status_code, 403)
