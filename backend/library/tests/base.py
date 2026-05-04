from __future__ import annotations

from datetime import date, timedelta

from django.test import TestCase
from django.utils import timezone
from library.authentication import issue_token_pair
from library.models import (
    Author,
    Book,
    BookCondition,
    Category,
    Copy,
    LibraryRole,
    LibraryUser,
    Loan,
    LoanStatus,
    Location,
    Notification,
    NotificationType,
    Publisher,
    Reservation,
    ReservationStatus,
)
from rest_framework.test import APIClient


class LibraryAPITestCase(TestCase):
    today: date

    @classmethod
    def setUpTestData(cls):
        cls.today = timezone.localdate()
        cls.staff = LibraryUser.objects.create(
            first_name="Marta",
            last_name="Bibliotekarz",
            email="librarian@library.com",
            birthdate=date(1990, 1, 20),
            password="passwd",
            role=LibraryRole.LIBRARIAN,
        )
        cls.reader = LibraryUser.objects.create(
            first_name="Anna",
            last_name="Czytelnik",
            email="reader@library.com",
            birthdate=date(1998, 3, 12),
            password="passwd",
            role=LibraryRole.READER,
        )
        cls.other_reader = LibraryUser.objects.create(
            first_name="Ola",
            last_name="Rezerwująca",
            email="ola@example.com",
            birthdate=date(1995, 6, 18),
            password="passwd",
            role=LibraryRole.READER,
        )
        cls.author = Author.objects.create(
            first_name="J.K.",
            last_name="Rowling",
            birthdate=date(1965, 7, 31),
            nationality="British",
        )
        cls.publisher = Publisher.objects.create(
            name="Media Rodzina",
            city="Poznań",
            country="Poland",
        )
        cls.category = Category.objects.create(
            name="Fantasy",
            description="Literatura fantasy i science-fiction",
        )
        cls.location = Location.objects.create(shelf="A1", section="Fantasy", floor=1)
        cls.book = Book.objects.create(
            title="Harry Potter i Kamień Filozoficzny",
            ean="111-11-1111-111-1",
            publish_year=1997,
            description="Harry dowiaduje się, że jest czarodziejem i trafia do Hogwartu.",
            publisher=cls.publisher,
        )
        cls.book.set_authors([cls.author])
        cls.book.set_categories([cls.category])
        cls.available_copy = Copy.objects.create(
            book=cls.book,
            location=cls.location,
            condition=BookCondition.GOOD,
            available=True,
        )
        cls.loan_copy = Copy.objects.create(
            book=cls.book,
            location=cls.location,
            condition=BookCondition.GOOD,
            available=False,
        )
        cls.damaged_copy = Copy.objects.create(
            book=cls.book,
            location=cls.location,
            condition=BookCondition.DAMAGED,
            available=True,
        )
        cls.loan = Loan.objects.create(
            copy=cls.loan_copy,
            user=cls.reader,
            loan_date=cls.today - timedelta(days=30),
            due_date=cls.today - timedelta(days=3),
            return_date=None,
            status=LoanStatus.ACTIVE,
        )
        cls.reservation = Reservation.objects.create(
            book=cls.book,
            user=cls.reader,
            reservation_date=cls.today - timedelta(days=1),
            expiry_date=cls.today + timedelta(days=7),
            status=ReservationStatus.PENDING,
        )
        cls.second_reservation = Reservation.objects.create(
            book=cls.book,
            user=cls.other_reader,
            reservation_date=cls.today,
            expiry_date=cls.today + timedelta(days=8),
            status=ReservationStatus.PENDING,
        )
        cls.unread_notification = Notification.objects.create(
            user=cls.reader,
            notification_type=NotificationType.SYSTEM,
            title="Przypomnienie",
            message="Sprawdzenie powiadomienia.",
        )

    def authenticated_client(self, user: LibraryUser) -> APIClient:
        client = APIClient()
        token = issue_token_pair(user)["access_token"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client

    def token_pair(self, user: LibraryUser) -> dict[str, str]:
        return issue_token_pair(user)
