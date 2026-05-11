from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.management import call_command
from django.test import TransactionTestCase
from library.models import (
    Author,
    Book,
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
        self.assertEqual(Author.objects.count(), 6)
        self.assertEqual(Publisher.objects.count(), 5)
        self.assertEqual(Book.objects.count(), 6)
        self.assertEqual(Copy.objects.count(), 9)
        self.assertEqual(Loan.objects.count(), 5)
        self.assertEqual(Reservation.objects.count(), 6)
        self.assertEqual(Fine.objects.count(), 3)
        self.assertEqual(Order.objects.count(), 4)

        witcher = Book.objects.get(ean="222-22-2222-222-2")
        self.assertEqual(witcher.authors.count(), 1)
        self.assertEqual(witcher.categories.count(), 1)
        self.assertEqual(witcher.available_copies_count, 1)
        self.assertEqual(witcher.active_reservations_count, 2)
        self.assertEqual(witcher.estimated_wait_days(), 7)

        reservations = {
            reservation.user.email: reservation
            for reservation in witcher.reservations.all()
        }
        self.assertEqual(reservations["reader1@library.com"].queue_position, 1)
        self.assertEqual(reservations["reader2@library.com"].queue_position, 2)
        self.assertEqual(
            reservations["reader2@library.com"].estimated_ready_date,
            reservations["reader2@library.com"].reservation_date + timedelta(days=7),
        )

        overdue_fine = Fine.objects.get(user__email="reader1@library.com")
        self.assertEqual(overdue_fine.amount, Decimal("7.50"))
        self.assertFalse(overdue_fine.paid)

        settled_fine = Fine.objects.get(user__email="reader3@library.com")
        self.assertTrue(settled_fine.paid)
        self.assertIsNotNone(settled_fine.paid_date)
