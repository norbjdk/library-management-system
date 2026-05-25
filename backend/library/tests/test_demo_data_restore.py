from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.management import call_command
from django.test import TransactionTestCase
from library.models import (
    Author,
    Book,
    Category,
    Copy,
    Fine,
    LibraryUser,
    Loan,
    Order,
    Publisher,
    Reservation,
)


class DemoDataRestoreTests(TransactionTestCase):
    reset_sequences = True

    def test_seed_command_recreates_dataset_from_clean_database(self):
        call_command("flush", interactive=False, verbosity=0)
        call_command("seed_demo_data", verbosity=0)

        self.assertEqual(LibraryUser.objects.count(), 5)
        self.assertEqual(Category.objects.count(), 10)
        self.assertGreaterEqual(Author.objects.count(), 70)
        self.assertEqual(Publisher.objects.count(), 17)
        self.assertEqual(Book.objects.count(), 100)
        self.assertEqual(Book.objects.filter(publisher__isnull=True).count(), 0)
        self.assertEqual(Book.objects.filter(ean__isnull=True).count(), 0)
        self.assertEqual(Book.objects.values("ean").distinct().count(), 100)
        self.assertEqual(Copy.objects.count(), 110)
        self.assertEqual(Loan.objects.count(), 5)
        self.assertEqual(Reservation.objects.count(), 6)
        self.assertEqual(Fine.objects.count(), 2)
        self.assertEqual(Order.objects.count(), 4)

        hobbit = Book.objects.get(title="The Hobbit")
        self.assertEqual(hobbit.authors.count(), 1)
        self.assertEqual(hobbit.categories.count(), 1)
        self.assertEqual(hobbit.categories.first().name, "Fantastyka")
        self.assertEqual(hobbit.publisher.name, "George Allen & Unwin")
        self.assertEqual(hobbit.available_copies_count, 1)
        self.assertEqual(hobbit.active_reservations_count, 2)
        self.assertEqual(hobbit.estimated_wait_days(), 7)

        reservations = {
            reservation.user.email: reservation
            for reservation in hobbit.reservations.all()
        }
        self.assertEqual(reservations["reader1@library.com"].queue_position, 1)
        self.assertEqual(reservations["reader2@library.com"].queue_position, 2)
        self.assertEqual(
            reservations["reader2@library.com"].estimated_ready_date,
            reservations["reader2@library.com"].reservation_date + timedelta(days=7),
        )

        overdue_fine = Fine.objects.get(
            user__email="reader1@library.com", loan__copy__book__title="Dune"
        )
        self.assertEqual(overdue_fine.amount, Decimal("7.50"))
        self.assertFalse(overdue_fine.paid)

        settled_fine = Fine.objects.get(
            user__email="reader3@library.com",
            loan__copy__book__title="Pride and Prejudice",
        )
        self.assertTrue(settled_fine.paid)
        self.assertIsNotNone(settled_fine.paid_date)
