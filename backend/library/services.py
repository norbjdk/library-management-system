from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from library.models import (
    Book,
    LibraryUser,
    Loan,
    LoanStatus,
    Notification,
    NotificationType,
    Reservation,
    ReservationStatus,
)

QUEUE_STEP_DAYS = 7
DEFAULT_OVERDUE_DAILY_FEE = Decimal("2.50")


def calculate_reservation_queue_position(reservation: Reservation) -> int:
    if reservation.status != ReservationStatus.PENDING:
        return 0

    pending_reservations = Reservation.objects.filter(
        book=reservation.book,
        status=ReservationStatus.PENDING,
    ).order_by("reservation_date", "id")

    for index, queued_reservation in enumerate(pending_reservations, start=1):
        if queued_reservation.pk == reservation.pk:
            return index

    return 0


def build_book_availability_snapshot(book: Book) -> dict[str, object]:
    copies = list(book.copies.select_related("location").all())
    total_copies = len(copies)
    available_copies = sum(1 for copy in copies if copy.available)
    active_loans = Loan.objects.filter(
        copy__book=book,
        status__in=[LoanStatus.ACTIVE, LoanStatus.OVERDUE],
        return_date__isnull=True,
    ).count()
    pending_reservations = Reservation.objects.filter(
        book=book,
        status=ReservationStatus.PENDING,
    ).order_by("reservation_date", "id")
    queue_length = pending_reservations.count()
    estimated_wait_days = max(queue_length - available_copies, 0) * QUEUE_STEP_DAYS

    return {
        "book_id": book.id,
        "title": book.title,
        "total_copies": total_copies,
        "available_copies": available_copies,
        "active_loans": active_loans,
        "active_reservations": queue_length,
        "estimated_wait_days": estimated_wait_days,
        "estimated_ready_date": (
            timezone.localdate() + timedelta(days=estimated_wait_days)
            if estimated_wait_days
            else timezone.localdate()
        ).isoformat(),
    }


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
    if loan.return_date:
        loan.status = LoanStatus.RETURNED
    elif loan.due_date < (as_of or timezone.localdate()):
        loan.status = LoanStatus.OVERDUE
    else:
        loan.status = LoanStatus.ACTIVE
    loan.save(update_fields=["status"])
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
