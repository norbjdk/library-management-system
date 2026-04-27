from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from library.models import (
    Fine,
    Loan,
    LoanStatus,
    Notification,
    NotificationType,
    Order,
    OrderStatus,
    ReservationStatus,
)

from .base import LibraryAPITestCase


class CirculationApiTests(LibraryAPITestCase):
    def test_staff_can_create_loan_and_marks_copy_unavailable(self):
        payload = {
            "copy": self.available_copy.id,
            "user": self.reader.id,
            "due_date": (self.today + timedelta(days=14)).isoformat(),
        }

        response = self.authenticated_client(self.staff).post(
            reverse("loan-list"), payload, format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.available_copy.refresh_from_db()
        self.assertFalse(self.available_copy.available)
        created_loan = Loan.objects.get(pk=response.data["id"])
        self.assertEqual(created_loan.status, LoanStatus.ACTIVE)
        self.assertEqual(response.data["book_title"], self.book.title)

    def test_damaged_copy_is_rejected_for_loan_creation(self):
        payload = {
            "copy": self.damaged_copy.id,
            "user": self.reader.id,
            "due_date": (self.today + timedelta(days=14)).isoformat(),
        }

        response = self.authenticated_client(self.staff).post(
            reverse("loan-list"), payload, format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("copy", response.data)

    def test_reader_cannot_create_loan(self):
        payload = {
            "copy": self.available_copy.id,
            "user": self.reader.id,
            "due_date": (self.today + timedelta(days=14)).isoformat(),
        }

        response = self.authenticated_client(self.reader).post(
            reverse("loan-list"), payload, format="json"
        )

        self.assertEqual(response.status_code, 403)

    def test_mark_overdue_updates_loan_status(self):
        response = self.authenticated_client(self.staff).post(
            reverse("loan-mark-overdue", args=[self.loan.id])
        )

        self.assertEqual(response.status_code, 200)
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.status, LoanStatus.OVERDUE)

    def test_return_loan_creates_fine_and_releases_copy(self):
        response = self.authenticated_client(self.staff).post(
            reverse("loan-return-loan", args=[self.loan.id])
        )

        self.assertEqual(response.status_code, 200)
        self.loan.refresh_from_db()
        self.loan_copy.refresh_from_db()
        self.assertEqual(self.loan.status, LoanStatus.RETURNED)
        self.assertEqual(self.loan.return_date, self.today)
        self.assertTrue(self.loan_copy.available)

        fine = Fine.objects.get(loan=self.loan)
        self.assertEqual(fine.amount, Decimal("7.50"))
        self.assertTrue(
            Notification.objects.filter(
                user=self.reader,
                notification_type=NotificationType.FINE_ISSUED,
                related_object_type="loan",
                related_object_id=self.loan.id,
            ).exists()
        )

    def test_reservation_queue_positions_and_ready_dates(self):
        response = self.authenticated_client(self.staff).get(
            reverse("reservation-list")
        )

        self.assertEqual(response.status_code, 200)
        reservations = {item["id"]: item for item in response.data}
        self.assertEqual(reservations[self.reservation.id]["queue_position"], 1)
        self.assertEqual(
            reservations[self.reservation.id]["estimated_ready_date"],
            self.today.isoformat(),
        )
        self.assertEqual(reservations[self.second_reservation.id]["queue_position"], 2)
        self.assertEqual(
            reservations[self.second_reservation.id]["estimated_ready_date"],
            (self.today + timedelta(days=7)).isoformat(),
        )

    def test_owner_can_cancel_reservation(self):
        response = self.authenticated_client(self.reader).post(
            reverse("reservation-cancel", args=[self.reservation.id])
        )

        self.assertEqual(response.status_code, 200)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.status, ReservationStatus.CANCELLED)

    def test_staff_can_fulfill_reservation_and_notify_user(self):
        response = self.authenticated_client(self.staff).post(
            reverse("reservation-fulfill", args=[self.reservation.id])
        )

        self.assertEqual(response.status_code, 200)
        self.reservation.refresh_from_db()
        self.available_copy.refresh_from_db()
        self.assertEqual(self.reservation.status, ReservationStatus.FULFILLED)
        self.assertFalse(self.available_copy.available)
        self.assertTrue(
            Notification.objects.filter(
                user=self.reader,
                notification_type=NotificationType.RESERVATION_READY,
                related_object_type="reservation",
                related_object_id=self.reservation.id,
            ).exists()
        )

    def test_fulfill_reservation_without_loanable_copy_returns_400(self):
        self.available_copy.mark_unavailable()

        response = self.authenticated_client(self.staff).post(
            reverse("reservation-fulfill", args=[self.second_reservation.id])
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("book", response.data)

    def test_mark_notification_read_sets_timestamp(self):
        response = self.authenticated_client(self.reader).post(
            reverse("notification-mark-read", args=[self.unread_notification.id])
        )

        self.assertEqual(response.status_code, 200)
        self.unread_notification.refresh_from_db()
        self.assertTrue(self.unread_notification.is_read)
        self.assertIsNotNone(self.unread_notification.read_at)

    def test_staff_can_progress_order_statuses(self):
        client = self.authenticated_client(self.staff)
        create_response = client.post(
            reverse("order-list"),
            {
                "book": self.book.id,
                "quantity": 2,
                "supplier": "Media Rodzina",
                "notes": "Uzupełnienie stanu magazynowego.",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        order = Order.objects.get(pk=create_response.data["id"])
        self.assertEqual(order.status, OrderStatus.DRAFT)

        submit_response = client.post(reverse("order-submit", args=[order.id]))
        order.refresh_from_db()
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(order.status, OrderStatus.SUBMITTED)

        receive_response = client.post(reverse("order-receive", args=[order.id]))
        order.refresh_from_db()
        self.assertEqual(receive_response.status_code, 200)
        self.assertEqual(order.status, OrderStatus.RECEIVED)

        cancel_response = client.post(reverse("order-cancel", args=[order.id]))
        order.refresh_from_db()
        self.assertEqual(cancel_response.status_code, 200)
        self.assertEqual(order.status, OrderStatus.CANCELLED)

    def test_staff_can_settle_fines(self):
        fine = Fine.objects.create(
            loan=self.loan,
            user=self.reader,
            amount=Decimal("5.00"),
        )

        response = self.authenticated_client(self.staff).post(
            reverse("fine-settle", args=[fine.id])
        )

        self.assertEqual(response.status_code, 200)
        fine.refresh_from_db()
        self.assertTrue(fine.paid)
        self.assertEqual(fine.paid_date, self.today)
        self.assertTrue(
            Notification.objects.filter(
                user=self.reader,
                notification_type=NotificationType.SYSTEM,
                related_object_type="fine",
                related_object_id=fine.id,
            ).exists()
        )
