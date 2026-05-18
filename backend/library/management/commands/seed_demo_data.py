from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from library.demo_seed_data import (
    BOOK_DATA,
    BOOK_PUBLISHER_KEYS,
    CATEGORY_DEFINITIONS,
    EXTRA_COPY_COUNTS,
    FINE_SCENARIOS,
    LOAN_SCENARIOS,
    LOCATION_DEFINITIONS,
    NOTIFICATION_SCENARIOS,
    ORDER_SCENARIOS,
    PUBLISHER_DEFINITIONS,
    RESERVATION_SCENARIOS,
    USER_DEFINITIONS,
)
from library.models import (
    Author,
    Book,
    BookCondition,
    Category,
    Copy,
    Fine,
    LibraryUser,
    Loan,
    Location,
    Notification,
    Order,
    Publisher,
    Reservation,
)


class Command(BaseCommand):
    help = "Wypelnia aplikacje realistycznym zestawem 100 ksiazek demo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Dodaj dane demo tylko wtedy, gdy baza nie zawiera jeszcze uzytkownikow.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["if_empty"] and LibraryUser.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Dane demo sa juz obecne. Pomijam ponowne zasilenie."
                )
            )
            return

        self._clear_existing_data()
        seed_state = self._seed_reference_data()
        self._seed_catalog(seed_state)
        self._seed_circulation(seed_state)

        self.stdout.write(
            self.style.SUCCESS(
                (
                    f"Dodano {Book.objects.count()} ksiazek, {Copy.objects.count()} egzemplarzy, "
                    f"{Loan.objects.count()} wypozyczen i {Reservation.objects.count()} rezerwacji."
                )
            )
        )

    def _clear_existing_data(self) -> None:
        Notification.objects.all().delete()
        Fine.objects.all().delete()
        Order.objects.all().delete()
        Reservation.objects.all().delete()
        Loan.objects.all().delete()
        Copy.objects.all().delete()
        Book.objects.all().delete()
        Author.objects.all().delete()
        Category.objects.all().delete()
        Publisher.objects.all().delete()
        Location.objects.all().delete()
        LibraryUser.objects.all().delete()

    def _seed_reference_data(self) -> dict[str, dict[str, object]]:
        users: dict[str, LibraryUser] = {}
        categories: dict[str, Category] = {}
        locations: dict[str, Location] = {}
        publishers: dict[str, Publisher] = {}

        for definition in USER_DEFINITIONS:
            users[definition["key"]] = LibraryUser.objects.create(
                first_name=definition["first_name"],
                last_name=definition["last_name"],
                email=definition["email"],
                birthdate=definition["birthdate"],
                password=definition["password"],
                role=definition["role"],
            )

        for definition in CATEGORY_DEFINITIONS:
            category_key = definition["key"]
            category = Category.objects.create(
                name=definition["name"],
                description=definition["description"],
            )
            categories[category_key] = category
            locations[category_key] = Location.objects.create(
                **LOCATION_DEFINITIONS[category_key]
            )

        for key, values in PUBLISHER_DEFINITIONS.items():
            name, city, country = values
            publishers[key] = Publisher.objects.create(
                name=name,
                city=city,
                country=country,
            )

        return {
            "users": users,
            "categories": categories,
            "locations": locations,
            "publishers": publishers,
            "authors": {},
            "books": {},
            "copies": {},
        }

    def _seed_catalog(self, seed_state: dict[str, dict[str, object]]) -> None:
        authors: dict[tuple[str, str], Author] = seed_state["authors"]
        books: dict[str, Book] = seed_state["books"]
        copies: dict[str, list[Copy]] = seed_state["copies"]
        categories: dict[str, Category] = seed_state["categories"]
        locations: dict[str, Location] = seed_state["locations"]
        publishers: dict[str, Publisher] = seed_state["publishers"]

        condition_cycle = [BookCondition.NEW, BookCondition.GOOD, BookCondition.WORN]

        for index, book_data in enumerate(BOOK_DATA):
            category_key, title, author_first_name, author_last_name, publish_year = (
                book_data
            )
            author_key = (author_first_name, author_last_name)
            if author_key not in authors:
                authors[author_key] = Author.objects.create(
                    first_name=author_first_name,
                    last_name=author_last_name,
                )

            publisher_key = BOOK_PUBLISHER_KEYS.get(title)
            publisher = publishers.get(publisher_key) if publisher_key else None
            author_full_name = f"{author_first_name} {author_last_name}".strip()
            category = categories[category_key]
            book = Book.objects.create(
                title=title,
                publish_year=publish_year,
                description=(
                    f"{title} to rozpoznawalna ksiazka z kategorii {category.name.lower()} "
                    f"autorstwa {author_full_name}."
                ),
                publisher=publisher,
            )
            book.set_authors([authors[author_key]])
            book.set_categories([category])

            books[title] = book
            copies[title] = []
            copy_count = EXTRA_COPY_COUNTS.get(title, 1)
            for copy_index in range(copy_count):
                copy = Copy.objects.create(
                    book=book,
                    location=locations[category_key],
                    condition=condition_cycle[
                        (index + copy_index) % len(condition_cycle)
                    ],
                    available=True,
                )
                copies[title].append(copy)

    def _seed_circulation(self, seed_state: dict[str, dict[str, object]]) -> None:
        users: dict[str, LibraryUser] = seed_state["users"]
        books: dict[str, Book] = seed_state["books"]
        copies_by_title: dict[str, list[Copy]] = seed_state["copies"]
        today = timezone.localdate()
        loans_by_title: dict[str, Loan] = {}
        reservations_by_key: dict[str, Reservation] = {}
        fines_by_title: dict[str, Fine] = {}
        orders_by_title: dict[str, Order] = {}

        for scenario in LOAN_SCENARIOS:
            copy = copies_by_title[scenario["title"]][scenario["copy_index"]]
            return_date = (
                today + timedelta(days=scenario["return_offset_days"])
                if scenario["return_offset_days"] is not None
                else None
            )
            loan = Loan.objects.create(
                copy=copy,
                user=users[scenario["user"]],
                loan_date=today + timedelta(days=scenario["loan_offset_days"]),
                due_date=today + timedelta(days=scenario["due_offset_days"]),
                return_date=return_date,
                status=scenario["status"],
            )
            if return_date is None and scenario["status"] != "returned":
                copy.mark_unavailable()
            else:
                copy.mark_available()
            loans_by_title[scenario["title"]] = loan

        for scenario in RESERVATION_SCENARIOS:
            reservation = Reservation.objects.create(
                book=books[scenario["title"]],
                user=users[scenario["user"]],
                reservation_date=today
                + timedelta(days=scenario["reservation_offset_days"]),
                expiry_date=today + timedelta(days=scenario["expiry_offset_days"]),
                status=scenario["status"],
            )
            reservations_by_key[f"{scenario['title']}:{scenario['user']}"] = reservation

        for scenario in FINE_SCENARIOS:
            paid_date = (
                today + timedelta(days=scenario["paid_offset_days"])
                if scenario["paid"] and scenario["paid_offset_days"] is not None
                else None
            )
            fine = Fine.objects.create(
                loan=loans_by_title[scenario["loan_title"]],
                user=users[scenario["user"]],
                amount=Decimal(scenario["amount"]),
                issue_date=today + timedelta(days=scenario["issue_offset_days"]),
                paid=scenario["paid"],
                paid_date=paid_date,
            )
            fines_by_title[scenario["loan_title"]] = fine

        for scenario in ORDER_SCENARIOS:
            order = Order.objects.create(
                book=books[scenario["title"]],
                requested_by=users[scenario["requested_by"]],
                quantity=scenario["quantity"],
                supplier=scenario["supplier"],
                status=scenario["status"],
                requested_at=timezone.now()
                + timedelta(days=scenario["requested_offset_days"]),
                expected_delivery_date=today
                + timedelta(days=scenario["expected_offset_days"]),
                notes=scenario["notes"],
            )
            orders_by_title[scenario["title"]] = order

        for scenario in NOTIFICATION_SCENARIOS:
            related_object_id = None
            if scenario["related_type"] == "loan":
                related_object_id = loans_by_title[scenario["related_key"]].id
            elif scenario["related_type"] == "fine":
                related_object_id = fines_by_title[scenario["related_key"]].id
            elif scenario["related_type"] == "reservation":
                related_object_id = reservations_by_key[scenario["related_key"]].id
            elif scenario["related_type"] == "order":
                related_object_id = orders_by_title[scenario["related_key"]].id

            notification = Notification.objects.create(
                user=users[scenario["user"]],
                notification_type=scenario["notification_type"],
                title=scenario["title"],
                message=scenario["message"],
                related_object_type=scenario["related_type"],
                related_object_id=related_object_id,
                created_at=timezone.now()
                + timedelta(days=scenario["created_offset_days"]),
                is_read=scenario["is_read"],
            )
            if scenario["is_read"]:
                notification.read_at = notification.created_at
                notification.save(update_fields=["read_at"])
