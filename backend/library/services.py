from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.utils import timezone
from library.models import (
    DEFAULT_LOAN_PERIOD_DAYS,
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


def build_default_due_date(
    *,
    as_of: date | None = None,
    loan_period_days: int = DEFAULT_LOAN_PERIOD_DAYS,
) -> date:
    reference_date = as_of or timezone.localdate()
    return reference_date + timedelta(days=loan_period_days)


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


def issue_reservation_loan(reservation: Reservation) -> Loan:
    if reservation.status != ReservationStatus.PENDING:
        raise ValueError("Tylko oczekującą rezerwację można zamienić na wypożyczenie.")

    available_copy = reservation.book.next_available_copy()
    if available_copy is None:
        raise ValueError("Brak dostępnego egzemplarza do realizacji tej rezerwacji.")

    if reservation.queue_position > reservation.book.available_copies_count:
        raise ValueError(
            "Przed tą rezerwacją znajdują się wcześniejsze pozycje w kolejce."
        )

    loan = Loan.objects.create(
        copy=available_copy,
        user=reservation.user,
        loan_date=timezone.localdate(),
        due_date=build_default_due_date(),
        status=LoanStatus.ACTIVE,
    )
    available_copy.mark_unavailable()
    reservation.fulfill()
    create_notification(
        reservation.user,
        notification_type=NotificationType.SYSTEM,
        title="Wydano książkę z rezerwacji",
        message=(
            f"Rezerwacja #{reservation.id} książki {reservation.book.title} "
            f"została zrealizowana jako wypożyczenie #{loan.id}. "
            f"Termin zwrotu: {loan.due_date.isoformat()}."
        ),
        related_object_type="loan",
        related_object_id=loan.id,
    )
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
