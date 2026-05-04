from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from library.models import (
    Author,
    Book,
    BookCondition,
    Category,
    Copy,
    Fine,
    LibraryRole,
    LibraryUser,
    Loan,
    LoanStatus,
    Location,
    Notification,
    NotificationType,
    Order,
    OrderStatus,
    Publisher,
    Reservation,
    ReservationStatus,
)


def _upsert_user(
    *,
    email: str,
    first_name: str,
    last_name: str,
    birthdate,
    password: str,
    role: str,
) -> LibraryUser:
    user, _ = LibraryUser.objects.update_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "birthdate": birthdate,
            "password": password,
            "role": role,
        },
    )
    return user


def _upsert_author(
    *,
    first_name: str,
    last_name: str,
    birthdate,
    nationality: str,
) -> Author:
    author, _ = Author.objects.update_or_create(
        first_name=first_name,
        last_name=last_name,
        defaults={"birthdate": birthdate, "nationality": nationality},
    )
    return author


def _upsert_publisher(*, name: str, city: str, country: str) -> Publisher:
    publisher, _ = Publisher.objects.update_or_create(
        name=name,
        defaults={"city": city, "country": country},
    )
    return publisher


def _upsert_category(*, name: str, description: str) -> Category:
    category, _ = Category.objects.update_or_create(
        name=name,
        defaults={"description": description},
    )
    return category


def _upsert_location(*, shelf: str, section: str, floor: int) -> Location:
    location, _ = Location.objects.update_or_create(
        shelf=shelf,
        section=section,
        floor=floor,
        defaults={},
    )
    return location


def _upsert_book(
    *,
    title: str,
    ean: str,
    publish_year: int,
    description: str,
    publisher: Publisher,
    authors: list[Author],
    categories: list[Category],
) -> Book:
    book, _ = Book.objects.update_or_create(
        ean=ean,
        defaults={
            "title": title,
            "publish_year": publish_year,
            "description": description,
            "publisher": publisher,
        },
    )
    book.set_authors(authors)
    book.set_categories(categories)
    return book


def _upsert_copy(
    *,
    book: Book,
    location: Location,
    condition: str,
    available: bool,
) -> Copy:
    copy, _ = Copy.objects.update_or_create(
        book=book,
        location=location,
        condition=condition,
        defaults={"available": available},
    )
    return copy


def _upsert_loan(
    *,
    copy: Copy,
    user: LibraryUser,
    loan_date,
    due_date,
    return_date,
    status: str,
) -> Loan:
    loan, _ = Loan.objects.update_or_create(
        copy=copy,
        user=user,
        defaults={
            "loan_date": loan_date,
            "due_date": due_date,
            "return_date": return_date,
            "status": status,
        },
    )
    return loan


def _upsert_reservation(
    *,
    book: Book,
    user: LibraryUser,
    reservation_date,
    expiry_date,
    status: str,
) -> Reservation:
    reservation, _ = Reservation.objects.update_or_create(
        book=book,
        user=user,
        defaults={
            "reservation_date": reservation_date,
            "expiry_date": expiry_date,
            "status": status,
        },
    )
    return reservation


def _upsert_fine(
    *,
    loan: Loan,
    user: LibraryUser,
    amount: Decimal,
    issue_date,
    paid_date,
    paid: bool,
) -> Fine:
    fine, _ = Fine.objects.update_or_create(
        loan=loan,
        user=user,
        defaults={
            "amount": amount,
            "issue_date": issue_date,
            "paid_date": paid_date,
            "paid": paid,
        },
    )
    return fine


def _upsert_order(
    *,
    book: Book,
    requested_by: LibraryUser,
    quantity: int,
    supplier: str,
    status: str,
    requested_at,
    expected_delivery_date,
    notes: str,
) -> Order:
    order, _ = Order.objects.update_or_create(
        book=book,
        supplier=supplier,
        notes=notes,
        defaults={
            "requested_by": requested_by,
            "quantity": quantity,
            "status": status,
            "requested_at": requested_at,
            "expected_delivery_date": expected_delivery_date,
        },
    )
    return order


def _upsert_notification(
    *,
    user: LibraryUser,
    notification_type: str,
    title: str,
    message: str,
    related_object_type: str,
    related_object_id: int,
    created_at,
    read_at,
    is_read: bool,
) -> Notification:
    notification, _ = Notification.objects.update_or_create(
        user=user,
        notification_type=notification_type,
        title=title,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
        defaults={
            "message": message,
            "created_at": created_at,
            "read_at": read_at,
            "is_read": is_read,
        },
    )
    return notification


def seed_demo_data() -> dict[str, int]:
    today = timezone.localdate()

    admin = _upsert_user(
        email="admin@library.com",
        first_name="Admin",
        last_name="LMS",
        birthdate=today - timedelta(days=10_000),
        password="passwd",
        role=LibraryRole.ADMIN,
    )
    librarian = _upsert_user(
        email="librarian@library.com",
        first_name="Marta",
        last_name="Bibliotekarz",
        birthdate=today - timedelta(days=13_000),
        password="passwd",
        role=LibraryRole.LIBRARIAN,
    )
    reader_one = _upsert_user(
        email="reader1@library.com",
        first_name="Anna",
        last_name="Czytelnik",
        birthdate=today - timedelta(days=9_800),
        password="passwd",
        role=LibraryRole.READER,
    )
    reader_two = _upsert_user(
        email="reader2@library.com",
        first_name="Ola",
        last_name="Rezerwująca",
        birthdate=today - timedelta(days=11_000),
        password="passwd",
        role=LibraryRole.READER,
    )
    reader_three = _upsert_user(
        email="reader3@library.com",
        first_name="Piotr",
        last_name="Czytający",
        birthdate=today - timedelta(days=12_000),
        password="passwd",
        role=LibraryRole.READER,
    )

    rowling = _upsert_author(
        first_name="J.K.",
        last_name="Rowling",
        birthdate=today - timedelta(days=22_000),
        nationality="British",
    )
    sapkowski = _upsert_author(
        first_name="Andrzej",
        last_name="Sapkowski",
        birthdate=today - timedelta(days=24_000),
        nationality="Polish",
    )
    orwell = _upsert_author(
        first_name="George",
        last_name="Orwell",
        birthdate=today - timedelta(days=29_000),
        nationality="British",
    )

    media_rodzina = _upsert_publisher(
        name="Media Rodzina",
        city="Poznań",
        country="Poland",
    )
    literackie = _upsert_publisher(
        name="Wydawnictwo Literackie",
        city="Kraków",
        country="Poland",
    )

    fantasy = _upsert_category(
        name="Fantasy",
        description="Literatura fantasy i science-fiction",
    )
    classic = _upsert_category(
        name="Classic",
        description="Klasyka literatury światowej",
    )
    dystopia = _upsert_category(
        name="Dystopia",
        description="Powieści antyutopijne",
    )

    shelf_a1 = _upsert_location(shelf="A1", section="Fantasy", floor=1)
    shelf_b2 = _upsert_location(shelf="B2", section="Classics", floor=2)
    shelf_c3 = _upsert_location(shelf="C3", section="Dystopia", floor=1)
    shelf_d4 = _upsert_location(shelf="D4", section="Archives", floor=3)

    harry_potter = _upsert_book(
        title="Harry Potter i Kamień Filozoficzny",
        ean="111-11-1111-111-1",
        publish_year=1997,
        description="Harry dowiaduje się, że jest czarodziejem i trafia do Hogwartu.",
        publisher=media_rodzina,
        authors=[rowling],
        categories=[fantasy],
    )
    witcher = _upsert_book(
        title="Wiedźmin: Ostatnie życzenie",
        ean="222-22-2222-222-2",
        publish_year=1993,
        description="Zbiór opowiadań o Geralcie z Rivii.",
        publisher=literackie,
        authors=[sapkowski],
        categories=[fantasy],
    )
    book_1984 = _upsert_book(
        title="Rok 1984",
        ean="333-33-3333-333-3",
        publish_year=1949,
        description="Antyutopia o totalitarnej przyszłości.",
        publisher=media_rodzina,
        authors=[orwell],
        categories=[classic, dystopia],
    )

    harry_display_copy = _upsert_copy(
        book=harry_potter,
        location=shelf_a1,
        condition=BookCondition.GOOD,
        available=True,
    )
    harry_archive_copy = _upsert_copy(
        book=harry_potter,
        location=shelf_d4,
        condition=BookCondition.GOOD,
        available=True,
    )
    witcher_loan_copy = _upsert_copy(
        book=witcher,
        location=shelf_b2,
        condition=BookCondition.GOOD,
        available=False,
    )
    witcher_backup_copy = _upsert_copy(
        book=witcher,
        location=shelf_c3,
        condition=BookCondition.WORN,
        available=True,
    )
    book_1984_copy = _upsert_copy(
        book=book_1984,
        location=shelf_b2,
        condition=BookCondition.GOOD,
        available=False,
    )

    overdue_loan = _upsert_loan(
        copy=witcher_loan_copy,
        user=reader_one,
        loan_date=today - timedelta(days=28),
        due_date=today - timedelta(days=2),
        return_date=None,
        status=LoanStatus.OVERDUE,
    )
    active_loan = _upsert_loan(
        copy=book_1984_copy,
        user=reader_two,
        loan_date=today - timedelta(days=4),
        due_date=today + timedelta(days=10),
        return_date=None,
        status=LoanStatus.ACTIVE,
    )
    returned_loan = _upsert_loan(
        copy=harry_archive_copy,
        user=reader_three,
        loan_date=today - timedelta(days=18),
        due_date=today - timedelta(days=8),
        return_date=today - timedelta(days=1),
        status=LoanStatus.RETURNED,
    )

    reservation_one = _upsert_reservation(
        book=witcher,
        user=reader_one,
        reservation_date=today - timedelta(days=1),
        expiry_date=today + timedelta(days=6),
        status=ReservationStatus.PENDING,
    )
    reservation_two = _upsert_reservation(
        book=witcher,
        user=reader_two,
        reservation_date=today,
        expiry_date=today + timedelta(days=7),
        status=ReservationStatus.PENDING,
    )
    reservation_three = _upsert_reservation(
        book=harry_potter,
        user=reader_three,
        reservation_date=today,
        expiry_date=today + timedelta(days=10),
        status=ReservationStatus.EXPIRED,
    )

    overdue_fine = _upsert_fine(
        loan=overdue_loan,
        user=reader_one,
        amount=Decimal("7.50"),
        issue_date=today,
        paid_date=None,
        paid=False,
    )
    settled_fine = _upsert_fine(
        loan=returned_loan,
        user=reader_three,
        amount=Decimal("3.00"),
        issue_date=today - timedelta(days=1),
        paid_date=today,
        paid=True,
    )

    submitted_order = _upsert_order(
        book=harry_potter,
        requested_by=librarian,
        quantity=5,
        supplier="Media Rodzina",
        status=OrderStatus.SUBMITTED,
        requested_at=timezone.now() - timedelta(days=2),
        expected_delivery_date=today + timedelta(days=12),
        notes="Uzupełnienie serii fantasy.",
    )
    processing_order = _upsert_order(
        book=book_1984,
        requested_by=admin,
        quantity=3,
        supplier="Wydawnictwo Literackie",
        status=OrderStatus.PROCESSING,
        requested_at=timezone.now() - timedelta(days=1),
        expected_delivery_date=today + timedelta(days=9),
        notes="Zakup klasyki i dystopii.",
    )

    fine_notification = _upsert_notification(
        user=reader_one,
        notification_type=NotificationType.FINE_ISSUED,
        title="Nowa kara",
        message="Wypożyczenie zostało oznaczone jako przeterminowane.",
        related_object_type="fine",
        related_object_id=overdue_fine.id,
        created_at=timezone.now() - timedelta(hours=2),
        read_at=None,
        is_read=False,
    )
    reservation_notification = _upsert_notification(
        user=reader_two,
        notification_type=NotificationType.RESERVATION_READY,
        title="Rezerwacja gotowa",
        message="Rezerwacja oczekuje na odbiór.",
        related_object_type="reservation",
        related_object_id=reservation_two.id,
        created_at=timezone.now() - timedelta(hours=1),
        read_at=None,
        is_read=False,
    )
    order_notification = _upsert_notification(
        user=librarian,
        notification_type=NotificationType.ORDER_UPDATE,
        title="Zamówienie zaktualizowane",
        message="Zamówienie zostało przeniesione do realizacji.",
        related_object_type="order",
        related_object_id=processing_order.id,
        created_at=timezone.now() - timedelta(minutes=30),
        read_at=timezone.now() - timedelta(minutes=15),
        is_read=True,
    )

    return {
        "users": LibraryUser.objects.count(),
        "authors": Author.objects.count(),
        "publishers": Publisher.objects.count(),
        "categories": Category.objects.count(),
        "locations": Location.objects.count(),
        "books": Book.objects.count(),
        "copies": Copy.objects.count(),
        "loans": Loan.objects.count(),
        "reservations": Reservation.objects.count(),
        "fines": Fine.objects.count(),
        "orders": Order.objects.count(),
        "notifications": Notification.objects.count(),
    }


class Command(BaseCommand):
    help = "Seed demo library data for local development and restore checks."

    @transaction.atomic
    def handle(self, *args, **options):
        summary = seed_demo_data()
        self.stdout.write(
            self.style.SUCCESS(
                "Seeded demo data: "
                f"{summary['users']} users, {summary['authors']} authors, "
                f"{summary['books']} books, {summary['copies']} copies, "
                f"{summary['loans']} loans, {summary['reservations']} reservations, "
                f"{summary['fines']} fines, {summary['orders']} orders, "
                f"{summary['notifications']} notifications."
            )
        )
