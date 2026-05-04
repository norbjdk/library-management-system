from __future__ import annotations

from collections.abc import Iterable
from datetime import date, timedelta

from django.db import models
from django.utils import timezone


class LibraryRole(models.TextChoices):
    READER = "reader", "Reader"
    LIBRARIAN = "librarian", "Librarian"
    ADMIN = "admin", "Admin"


class BookCondition(models.TextChoices):
    NEW = "new", "New"
    GOOD = "good", "Good"
    WORN = "worn", "Worn"
    DAMAGED = "damaged", "Damaged"


LOANABLE_BOOK_CONDITIONS = (
    BookCondition.NEW,
    BookCondition.GOOD,
    BookCondition.WORN,
)

RESERVATION_QUEUE_STEP_DAYS = 7


class LoanStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    RETURNED = "returned", "Returned"
    OVERDUE = "overdue", "Overdue"


class ReservationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    FULFILLED = "fulfilled", "Fulfilled"
    CANCELLED = "cancelled", "Cancelled"
    EXPIRED = "expired", "Expired"


class OrderStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    PROCESSING = "processing", "Processing"
    RECEIVED = "received", "Received"
    CANCELLED = "cancelled", "Cancelled"


class NotificationType(models.TextChoices):
    LOAN_DUE = "loan_due", "Loan due"
    RESERVATION_READY = "reservation_ready", "Reservation ready"
    FINE_ISSUED = "fine_issued", "Fine issued"
    ORDER_UPDATE = "order_update", "Order update"
    SYSTEM = "system", "System"


class LibraryUser(models.Model):
    first_name = models.CharField(max_length=50, db_column="firstName")
    last_name = models.CharField(max_length=50, db_column="lastName")
    email = models.EmailField(max_length=100, unique=True)
    birthdate = models.DateField()
    password = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=LibraryRole.choices,
        default=LibraryRole.READER,
    )
    created_at = models.DateTimeField(db_column="createDate", default=timezone.now)

    class Meta:
        db_table = "users"
        ordering = ["last_name", "first_name", "id"]

    def __str__(self) -> str:
        return self.full_name

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_staff_member(self) -> bool:
        return self.role in {LibraryRole.LIBRARIAN, LibraryRole.ADMIN}


class Author(models.Model):
    first_name = models.CharField(max_length=50, db_column="firstName")
    last_name = models.CharField(max_length=50, db_column="lastName")
    birthdate = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "authors"
        ordering = ["last_name", "first_name", "id"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Publisher(models.Model):
    name = models.CharField(max_length=100, unique=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    country = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "publishers"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Location(models.Model):
    shelf = models.CharField(max_length=20)
    section = models.CharField(max_length=50, null=True, blank=True)
    floor = models.SmallIntegerField(null=True, blank=True)

    class Meta:
        db_table = "locations"
        ordering = ["floor", "section", "shelf", "id"]

    def __str__(self) -> str:
        parts = [self.shelf]
        if self.section:
            parts.append(self.section)
        if self.floor is not None:
            parts.append(f"floor {self.floor}")
        return " / ".join(parts)


class Book(models.Model):
    title = models.CharField(max_length=200)
    ean = models.CharField(max_length=20, unique=True, null=True, blank=True)
    publish_year = models.SmallIntegerField(
        db_column="publishYear", null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    publisher = models.ForeignKey(
        Publisher,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="books",
    )
    authors = models.ManyToManyField(
        Author,
        through="BookAuthor",
        related_name="books",
        blank=True,
    )
    categories = models.ManyToManyField(
        Category,
        through="BookCategory",
        related_name="books",
        blank=True,
    )

    class Meta:
        db_table = "books"
        ordering = ["title", "id"]

    def __str__(self) -> str:
        return self.title

    def set_authors(self, authors: Iterable[Author]) -> None:
        self.authors.set(authors)

    def set_categories(self, categories: Iterable[Category]) -> None:
        self.categories.set(categories)

    @property
    def copies_count(self) -> int:
        return self.copies.count()

    @property
    def available_copies_count(self) -> int:
        return self.copies.filter(
            available=True,
            condition__in=LOANABLE_BOOK_CONDITIONS,
        ).count()

    @property
    def active_loans_count(self) -> int:
        return Loan.objects.filter(
            copy__book=self,
            status__in=[LoanStatus.ACTIVE, LoanStatus.OVERDUE],
            return_date__isnull=True,
        ).count()

    @property
    def active_reservations_count(self) -> int:
        return Reservation.objects.filter(
            book=self,
            status=ReservationStatus.PENDING,
        ).count()

    def next_available_copy(self) -> Copy | None:
        return (
            self.copies.filter(
                available=True,
                condition__in=LOANABLE_BOOK_CONDITIONS,
            )
            .order_by("id")
            .first()
        )

    def estimated_wait_days(
        self, queue_step_days: int = RESERVATION_QUEUE_STEP_DAYS
    ) -> int:
        return (
            max(self.active_reservations_count - self.available_copies_count, 0)
            * queue_step_days
        )

    def availability_snapshot(
        self, queue_step_days: int = RESERVATION_QUEUE_STEP_DAYS
    ) -> dict[str, object]:
        copies = list(self.copies.select_related("location").all())
        total_copies = len(copies)
        available_copies = sum(1 for copy in copies if copy.is_loanable)
        estimated_wait_days = (
            max(self.active_reservations_count - available_copies, 0) * queue_step_days
        )

        return {
            "book_id": self.id,
            "title": self.title,
            "total_copies": total_copies,
            "available_copies": available_copies,
            "active_loans": self.active_loans_count,
            "active_reservations": self.active_reservations_count,
            "estimated_wait_days": estimated_wait_days,
            "estimated_ready_date": (
                timezone.localdate() + timedelta(days=estimated_wait_days)
                if estimated_wait_days
                else timezone.localdate()
            ).isoformat(),
        }


class BookAuthor(models.Model):
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="book_authors"
    )
    author = models.ForeignKey(
        Author, on_delete=models.CASCADE, related_name="author_books"
    )

    class Meta:
        db_table = "book_authors"
        constraints = [
            models.UniqueConstraint(
                fields=["book", "author"], name="unique_book_author"
            )
        ]
        ordering = ["book_id", "author_id"]


class BookCategory(models.Model):
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="book_categories"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="category_books",
    )

    class Meta:
        db_table = "book_categories"
        constraints = [
            models.UniqueConstraint(
                fields=["book", "category"], name="unique_book_category"
            )
        ]
        ordering = ["book_id", "category_id"]


class Copy(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="copies")
    location = models.ForeignKey(
        Location,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="copies",
    )
    condition = models.CharField(
        max_length=20,
        choices=BookCondition.choices,
        default=BookCondition.GOOD,
    )
    available = models.BooleanField(default=True)

    class Meta:
        db_table = "copies"
        ordering = ["book_id", "id"]

    def __str__(self) -> str:
        return f"Copy {self.pk} of {self.book.title}"

    @property
    def is_loanable(self) -> bool:
        return self.available and self.condition in LOANABLE_BOOK_CONDITIONS

    def mark_available(self) -> None:
        if not self.available:
            self.available = True
            self.save(update_fields=["available"])

    def mark_unavailable(self) -> None:
        if self.available:
            self.available = False
            self.save(update_fields=["available"])


class Loan(models.Model):
    copy = models.ForeignKey(Copy, on_delete=models.RESTRICT, related_name="loans")
    user = models.ForeignKey(
        LibraryUser, on_delete=models.RESTRICT, related_name="loans"
    )
    loan_date = models.DateField(db_column="loanDate", default=timezone.localdate)
    due_date = models.DateField(db_column="dueDate")
    return_date = models.DateField(db_column="returnDate", null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=LoanStatus.choices,
        default=LoanStatus.ACTIVE,
    )

    class Meta:
        db_table = "loans"
        ordering = ["-loan_date", "-id"]

    def __str__(self) -> str:
        return f"Loan {self.pk} - {self.copy.book.title}"

    @property
    def days_until_due(self) -> int:
        if self.return_date:
            return 0
        return (self.due_date - timezone.localdate()).days

    @property
    def overdue_days(self) -> int:
        reference_date = self.return_date or timezone.localdate()
        return max((reference_date - self.due_date).days, 0)

    @property
    def is_overdue(self) -> bool:
        return self.status == LoanStatus.OVERDUE or (
            self.return_date is None and self.due_date < timezone.localdate()
        )

    def return_copy(self, return_date: date | None = None) -> None:
        if self.return_date is None:
            self.return_date = return_date or timezone.localdate()
        self.status = LoanStatus.RETURNED
        self.copy.mark_available()
        self.save(update_fields=["return_date", "status"])

    def extend_due_date(self, extension_days: int, as_of: date | None = None) -> None:
        if self.return_date is not None or self.status == LoanStatus.RETURNED:
            raise ValueError("Tylko aktywne wypożyczenie można przedłużyć.")
        if extension_days <= 0:
            raise ValueError("Liczba dni przedłużenia musi być dodatnia.")

        reference_date = as_of or timezone.localdate()
        baseline_due_date = (
            self.due_date if self.due_date >= reference_date else reference_date
        )
        self.due_date = baseline_due_date + timedelta(days=extension_days)
        self.return_date = None
        self.status = (
            LoanStatus.OVERDUE if self.due_date < reference_date else LoanStatus.ACTIVE
        )
        self.save(update_fields=["due_date", "return_date", "status"])

    def refresh_status(self, as_of: date | None = None) -> None:
        reference_date = as_of or timezone.localdate()
        if self.return_date is not None:
            self.status = LoanStatus.RETURNED
        elif self.due_date < reference_date:
            self.status = LoanStatus.OVERDUE
        else:
            self.status = LoanStatus.ACTIVE
        self.save(update_fields=["status"])


class Reservation(models.Model):
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="reservations"
    )
    user = models.ForeignKey(
        LibraryUser, on_delete=models.CASCADE, related_name="reservations"
    )
    reservation_date = models.DateField(
        db_column="reservationDate", default=timezone.localdate
    )
    expiry_date = models.DateField(db_column="expiryDate")
    status = models.CharField(
        max_length=20,
        choices=ReservationStatus.choices,
        default=ReservationStatus.PENDING,
    )

    class Meta:
        db_table = "reservations"
        ordering = ["reservation_date", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["book", "user"], name="unique_reservation_per_book_user"
            )
        ]

    def __str__(self) -> str:
        return f"Reservation {self.pk} - {self.book.title}"

    @property
    def queue_position(self) -> int:
        if self.status != ReservationStatus.PENDING:
            return 0

        pending_reservations = Reservation.objects.filter(
            book=self.book,
            status=ReservationStatus.PENDING,
        ).order_by("reservation_date", "id")

        for index, queued_reservation in enumerate(pending_reservations, start=1):
            if queued_reservation.pk == self.pk:
                return index

        return 0

    @property
    def estimated_ready_date(self) -> date | None:
        queue_position = self.queue_position
        if queue_position == 0:
            return None

        wait_days = (
            max(queue_position - self.book.available_copies_count, 0)
            * RESERVATION_QUEUE_STEP_DAYS
        )
        return timezone.localdate() + timedelta(days=wait_days)

    def cancel(self) -> None:
        if self.status != ReservationStatus.CANCELLED:
            self.status = ReservationStatus.CANCELLED
            self.save(update_fields=["status"])

    def fulfill(self) -> None:
        if self.status != ReservationStatus.FULFILLED:
            self.status = ReservationStatus.FULFILLED
            self.save(update_fields=["status"])


class Fine(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.RESTRICT, related_name="fines")
    user = models.ForeignKey(
        LibraryUser, on_delete=models.RESTRICT, related_name="fines"
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    issue_date = models.DateField(db_column="issueDate", default=timezone.localdate)
    paid_date = models.DateField(db_column="paidDate", null=True, blank=True)
    paid = models.BooleanField(default=False)

    class Meta:
        db_table = "fines"
        ordering = ["-issue_date", "-id"]

    def __str__(self) -> str:
        return f"Fine {self.pk} - {self.amount}"


class Order(models.Model):
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="orders")
    requested_by = models.ForeignKey(
        LibraryUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders_requested",
    )
    quantity = models.PositiveSmallIntegerField(default=1)
    supplier = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.DRAFT,
    )
    requested_at = models.DateTimeField(db_column="requestedAt", default=timezone.now)
    expected_delivery_date = models.DateField(
        db_column="expectedDeliveryDate", null=True, blank=True
    )
    notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "orders"
        ordering = ["-requested_at", "-id"]

    def __str__(self) -> str:
        return f"Order {self.pk} - {self.book.title}"

    def submit(self) -> None:
        if self.status != OrderStatus.SUBMITTED:
            self.status = OrderStatus.SUBMITTED
            self.save(update_fields=["status"])

    def receive(self) -> None:
        if self.status != OrderStatus.RECEIVED:
            self.status = OrderStatus.RECEIVED
            self.save(update_fields=["status"])

    def cancel(self) -> None:
        if self.status != OrderStatus.CANCELLED:
            self.status = OrderStatus.CANCELLED
            self.save(update_fields=["status"])


class Notification(models.Model):
    user = models.ForeignKey(
        LibraryUser, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=30,
        db_column="notificationType",
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_object_type = models.CharField(
        db_column="relatedType",
        max_length=50,
        null=True,
        blank=True,
    )
    related_object_id = models.PositiveIntegerField(
        db_column="relatedId", null=True, blank=True
    )
    created_at = models.DateTimeField(db_column="createdAt", default=timezone.now)
    read_at = models.DateTimeField(db_column="readAt", null=True, blank=True)
    is_read = models.BooleanField(db_column="isRead", default=False)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return f"Notification {self.pk} - {self.title}"

    def mark_read(self) -> None:
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
