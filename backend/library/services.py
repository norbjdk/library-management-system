from __future__ import annotations

from decimal import Decimal

from django.utils import timezone
from library.models import Book, LibraryUser, Loan, Notification, Reservation

QUEUE_STEP_DAYS = 7
DEFAULT_OVERDUE_DAILY_FEE = Decimal("2.50")


def calculate_reservation_queue_position(reservation: Reservation) -> int:
    return reservation.queue_position


def build_book_availability_snapshot(book: Book) -> dict[str, object]:
    return book.availability_snapshot(queue_step_days=QUEUE_STEP_DAYS)


def calculate_overdue_amount(
    loan: Loan, as_of=None, daily_rate: Decimal = DEFAULT_OVERDUE_DAILY_FEE
) -> Decimal:
    reference_date = as_of or timezone.localdate()
    if loan.return_date and loan.return_date < reference_date:
        reference_date = loan.return_date

    overdue_days = (reference_date - loan.due_date).days
    if overdue_days <= 0:
        return Decimal("0.00")

    return (daily_rate * overdue_days).quantize(Decimal("0.01"))


def update_loan_status(loan: Loan, as_of=None) -> Loan:
    loan.refresh_status(as_of=as_of)
    return loan


def create_notification(
    user: LibraryUser,
    *,
    notification_type: str,
    title: str,
    message: str,
    related_object_type: str | None = None,
    related_object_id: int | None = None,
) -> Notification:
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
    )
