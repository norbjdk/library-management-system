from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.deletion import ProtectedError, RestrictedError
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from library.models import (
    DEFAULT_LOAN_PERIOD_DAYS,
    LOAN_EXTENSION_STEP_DAYS,
    Author,
    Book,
    Category,
    Copy,
    Fine,
    LibraryUser,
    Loan,
    LoanStatus,
    Location,
    Notification,
    NotificationType,
    Order,
    Publisher,
    Reservation,
    ReservationStatus,
)
from library.permissions import (
    IsAdminWriteOrReadOnly,
    IsAdminWriteOrStaffReadOnly,
    IsStaffMember,
)
from library.serializers import (
    AuthorSerializer,
    BookSerializer,
    CategorySerializer,
    CopySerializer,
    FineSerializer,
    LoanSerializer,
    LocationSerializer,
    NotificationSerializer,
    OrderSerializer,
    PublisherSerializer,
    ReaderProfileSerializer,
    ReaderSerializer,
    ReservationSerializer,
)
from library.services import (
    build_book_availability_snapshot,
    build_default_due_date,
    calculate_overdue_amount,
    create_notification,
    issue_reservation_loan,
    update_loan_status,
)
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def is_staff_actor(user) -> bool:
    return bool(
        getattr(user, "is_staff", False) or getattr(user, "is_staff_member", False)
    )


def is_authenticated_actor(user) -> bool:
    return bool(
        getattr(user, "is_authenticated", False) or isinstance(user, LibraryUser)
    )


def filter_visible_user_queryset(queryset, user):
    if not is_authenticated_actor(user):
        return queryset.none()
    if is_staff_actor(user):
        return queryset
    return queryset.filter(user_id=user.id)


def build_profile_summary(user) -> dict[str, object]:
    if not is_authenticated_actor(user):
        return {
            "loan_count": 0,
            "reservation_count": 0,
            "fine_total": Decimal("0.00"),
            "notification_count": 0,
        }

    loans = filter_visible_user_queryset(Loan.objects.all(), user)
    reservations = filter_visible_user_queryset(Reservation.objects.all(), user)
    fines = filter_visible_user_queryset(Fine.objects.all(), user)
    notifications = filter_visible_user_queryset(Notification.objects.all(), user)

    return {
        "loan_count": loans.filter(
            status__in=[LoanStatus.ACTIVE, LoanStatus.OVERDUE],
            return_date__isnull=True,
        ).count(),
        "reservation_count": reservations.filter(
            status=ReservationStatus.PENDING,
        ).count(),
        "fine_total": fines.aggregate(total=Sum("amount"))["total"] or Decimal("0.00"),
        "notification_count": notifications.count(),
    }


class ApiRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "health": request.build_absolute_uri(reverse("health")),
                "schema": request.build_absolute_uri(reverse("schema")),
                "docs": request.build_absolute_uri(reverse("swagger-ui")),
                "auth": {
                    "login": request.build_absolute_uri(reverse("auth-login")),
                    "refresh": request.build_absolute_uri(reverse("auth-refresh")),
                    "me": request.build_absolute_uri(reverse("auth-me")),
                    "profile": request.build_absolute_uri(reverse("profile")),
                },
                "catalog": {
                    "books": request.build_absolute_uri(reverse("book-list")),
                    "authors": request.build_absolute_uri(reverse("author-list")),
                    "publishers": request.build_absolute_uri(reverse("publisher-list")),
                    "categories": request.build_absolute_uri(reverse("category-list")),
                    "locations": request.build_absolute_uri(reverse("location-list")),
                    "copies": request.build_absolute_uri(reverse("copy-list")),
                },
                "circulation": {
                    "readers": request.build_absolute_uri(reverse("reader-list")),
                    "loans": request.build_absolute_uri(reverse("loan-list")),
                    "reservations": request.build_absolute_uri(
                        reverse("reservation-list")
                    ),
                    "fines": request.build_absolute_uri(reverse("fine-list")),
                    "orders": request.build_absolute_uri(reverse("order-list")),
                    "notifications": request.build_absolute_uri(
                        reverse("notification-list")
                    ),
                },
            }
        )


class BaseCatalogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminWriteOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    def get_queryset(self):
        return super().get_queryset()


class BookViewSet(BaseCatalogViewSet):
    queryset = (
        Book.objects.select_related("publisher")
        .prefetch_related("authors", "categories", "copies__location")
        .all()
    )
    serializer_class = BookSerializer
    search_fields = [
        "title",
        "ean",
        "description",
        "publisher__name",
        "authors__first_name",
        "authors__last_name",
        "categories__name",
    ]
    ordering_fields = ["title", "publish_year", "ean", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        publisher_id = self.request.query_params.get("publisher")
        author_id = self.request.query_params.get("author")
        category_id = self.request.query_params.get("category")
        available = self.request.query_params.get("available")

        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(ean__icontains=query)
                | Q(description__icontains=query)
                | Q(publisher__name__icontains=query)
                | Q(authors__first_name__icontains=query)
                | Q(authors__last_name__icontains=query)
                | Q(categories__name__icontains=query)
            )
        if publisher_id:
            queryset = queryset.filter(publisher_id=publisher_id)
        if author_id:
            queryset = queryset.filter(authors__id=author_id)
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        if available in {"true", "1", "yes"}:
            queryset = queryset.filter(copies__available=True)
        elif available in {"false", "0", "no"}:
            queryset = queryset.filter(copies__available=False)

        return queryset.distinct()

    @action(detail=True, methods=["get"])
    def availability(self, request, pk=None):
        book = self.get_object()
        return Response(build_book_availability_snapshot(book))

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except (ProtectedError, RestrictedError) as error:
            raise ValidationError(
                {
                    "detail": (
                        "Nie można usunąć książki, która jest powiązana z istniejącymi wypożyczeniami, karami lub zamówieniami."
                    )
                }
            ) from error


class AuthorViewSet(BaseCatalogViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    search_fields = ["first_name", "last_name", "nationality"]
    ordering_fields = ["first_name", "last_name", "birthdate", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(nationality__icontains=query)
            )
        return queryset


class PublisherViewSet(BaseCatalogViewSet):
    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer
    search_fields = ["name", "city", "country"]
    ordering_fields = ["name", "city", "country", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(city__icontains=query)
                | Q(country__icontains=query)
            )
        return queryset


class CategoryViewSet(BaseCatalogViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ["name", "description"]
    ordering_fields = ["name", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )
        return queryset


class LocationViewSet(BaseCatalogViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    search_fields = ["shelf", "section"]
    ordering_fields = ["floor", "section", "shelf", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        shelf = self.request.query_params.get("shelf")
        section = self.request.query_params.get("section")
        floor = self.request.query_params.get("floor")
        if shelf:
            queryset = queryset.filter(shelf__icontains=shelf)
        if section:
            queryset = queryset.filter(section__icontains=section)
        if floor not in {None, ""}:
            queryset = queryset.filter(floor=floor)
        return queryset


class CopyViewSet(BaseCatalogViewSet):
    queryset = Copy.objects.select_related("book", "location").all()
    serializer_class = CopySerializer
    search_fields = ["book__title", "book__ean", "location__shelf", "location__section"]
    ordering_fields = ["id", "condition", "available"]

    def get_queryset(self):
        queryset = super().get_queryset()
        book_id = self.request.query_params.get("book")
        location_id = self.request.query_params.get("location")
        available = self.request.query_params.get("available")
        condition = self.request.query_params.get("condition")

        if book_id:
            queryset = queryset.filter(book_id=book_id)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        if available in {"true", "1", "yes"}:
            queryset = queryset.filter(available=True)
        elif available in {"false", "0", "no"}:
            queryset = queryset.filter(available=False)
        if condition:
            queryset = queryset.filter(condition=condition)
        return queryset


class ReaderViewSet(viewsets.ModelViewSet):
    queryset = LibraryUser.objects.all()
    serializer_class = ReaderSerializer
    permission_classes = [IsAdminWriteOrStaffReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email", "role"]
    ordering_fields = ["first_name", "last_name", "email", "role", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q")
        role = self.request.query_params.get("role")
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(email__icontains=query)
            )
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except (ProtectedError, RestrictedError) as error:
            raise ValidationError(
                {
                    "detail": (
                        "Nie można usunąć użytkownika, który ma powiązane wypożyczenia lub kary."
                    )
                }
            ) from error


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.select_related("copy__book", "copy__location", "user").all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["copy__book__title", "user__first_name", "user__last_name"]
    ordering_fields = ["loan_date", "due_date", "return_date", "status", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if not getattr(user, "is_staff", False):
            queryset = queryset.filter(user_id=user.id)

        status_filter = self.request.query_params.get("status")
        book_id = self.request.query_params.get("book")
        overdue = self.request.query_params.get("overdue")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if book_id:
            queryset = queryset.filter(copy__book_id=book_id)
        if overdue in {"true", "1", "yes"}:
            queryset = queryset.filter(
                Q(status=LoanStatus.OVERDUE)
                | Q(return_date__isnull=True, due_date__lt=timezone.localdate())
            )
        elif overdue in {"false", "0", "no"}:
            queryset = queryset.exclude(status=LoanStatus.OVERDUE)
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą tworzyć wypożyczenia."
            )
        copy = serializer.validated_data["copy"]
        if not copy.is_loanable:
            raise ValidationError(
                {"copy": "Wybrany egzemplarz nie jest dostępny do wypożyczenia."}
            )
        due_date = serializer.validated_data.get("due_date") or build_default_due_date()
        serializer.save(due_date=due_date)
        serializer.instance.copy.mark_unavailable()
        update_loan_status(serializer.instance)

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą aktualizować wypożyczenia."
            )
        serializer.save()
        update_loan_status(serializer.instance)

    def perform_destroy(self, instance):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą usuwać wypożyczenia."
            )
        instance.copy.mark_available()
        instance.delete()

    @action(detail=False, methods=["post"], url_path="borrow-book")
    def borrow_book(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise PermissionDenied("Musisz być zalogowany, aby wypożyczyć książkę.")
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Czytelnik może jedynie zarezerwować książkę. Wypożyczenie realizuje bibliotekarz."
            )

        raw_book_id = request.data.get("book")
        if raw_book_id in {None, ""}:
            raise ValidationError({"book": "Wskaż książkę do wypożyczenia."})

        try:
            book_id = int(raw_book_id)
        except (TypeError, ValueError) as error:
            raise ValidationError(
                {"book": "Identyfikator książki jest niepoprawny."}
            ) from error

        due_date = request.data.get("due_date") or build_default_due_date()
        book = get_object_or_404(Book, pk=book_id)
        available_copy = book.next_borrowable_copy()
        if available_copy is None:
            raise ValidationError(
                {
                    "book": (
                        "Ta książka nie ma teraz dostępnych egzemplarzy do nowego wypożyczenia."
                    )
                }
            )

        loan = Loan.objects.create(
            copy=available_copy,
            user_id=user.id,
            loan_date=timezone.localdate(),
            due_date=due_date,
            status=LoanStatus.ACTIVE,
        )
        available_copy.mark_unavailable()

        return Response(self.get_serializer(loan).data, status=201)

    @action(detail=True, methods=["post"])
    def return_loan(self, request, pk=None):
        loan = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą zwracać wypożyczenia."
            )

        loan.return_copy()

        overdue_amount = calculate_overdue_amount(loan)
        if overdue_amount > Decimal("0.00"):
            fine, _ = Fine.objects.get_or_create(
                loan=loan,
                user=loan.user,
                defaults={"amount": overdue_amount},
            )
            if fine.amount != overdue_amount:
                fine.amount = overdue_amount
                fine.paid = False
                fine.paid_date = None
                fine.save(update_fields=["amount", "paid", "paid_date"])
            create_notification(
                loan.user,
                notification_type=NotificationType.FINE_ISSUED,
                title="Naliczono kare po spoznionym zwrocie",
                message=(
                    f"Wypozyczenie #{loan.id} zostalo zwrocone po terminie. "
                    f"Kwota kary: {overdue_amount} PLN."
                ),
                related_object_type="loan",
                related_object_id=loan.id,
            )

        return Response(self.get_serializer(loan).data)

    @action(detail=True, methods=["post"])
    def extend(self, request, pk=None):
        loan = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False) and loan.user_id != getattr(
            user, "id", None
        ):
            raise PermissionDenied(
                "Mozesz przedluzac tylko swoje wypozyczenia lub dzialac jako pracownik biblioteki."
            )

        raw_extension_days = request.data.get(
            "extension_days", LOAN_EXTENSION_STEP_DAYS
        )
        try:
            extension_days = int(raw_extension_days)
        except (TypeError, ValueError) as error:
            raise ValidationError(
                {"extension_days": "Liczba dni przedłużenia musi być liczbą całkowitą."}
            ) from error

        if extension_days <= 0:
            raise ValidationError(
                {"extension_days": "Liczba dni przedłużenia musi być dodatnia."}
            )
        if loan.return_date is not None or loan.status == LoanStatus.RETURNED:
            raise ValidationError(
                {
                    "status": "Nie można przedłużyć wypożyczenia, które zostało już zwrócone."
                }
            )
        if extension_days % LOAN_EXTENSION_STEP_DAYS != 0:
            raise ValidationError(
                {
                    "extension_days": (
                        "Przedłużenie musi obejmować pełne tygodnie "
                        f"(wielokrotność {LOAN_EXTENSION_STEP_DAYS} dni)."
                    )
                }
            )

        loan.extend_due_date(extension_days)
        return Response(self.get_serializer(loan).data)

    @action(detail=True, methods=["post"])
    def mark_overdue(self, request, pk=None):
        loan = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą oznaczać wypożyczenia jako przeterminowane."
            )
        if loan.return_date is None and loan.due_date < timezone.localdate():
            loan.refresh_status()
        return Response(self.get_serializer(loan).data)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related("book", "user").all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["book__title", "user__first_name", "user__last_name"]
    ordering_fields = ["reservation_date", "expiry_date", "status", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if not getattr(user, "is_staff", False):
            queryset = queryset.filter(user_id=user.id)

        book_id = self.request.query_params.get("book")
        status_filter = self.request.query_params.get("status")
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if getattr(user, "is_staff", False):
            requested_user_id = self.request.data.get("user") or user.id
            requested_user = get_object_or_404(LibraryUser, pk=int(requested_user_id))
            serializer.save(user=requested_user)
        else:
            serializer.save(user_id=user.id)

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        instance = self.get_object()
        if not getattr(user, "is_staff", False) and instance.user_id != user.id:
            raise PermissionDenied("Możesz aktualizować tylko swoje rezerwacje.")
        serializer.save()

    def perform_destroy(self, instance):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False) and instance.user_id != user.id:
            raise PermissionDenied("Możesz usuwać tylko swoje rezerwacje.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False) and reservation.user_id != user.id:
            raise PermissionDenied("Możesz anulować tylko swoje rezerwacje.")
        reservation.cancel()
        return Response(self.get_serializer(reservation).data)

    @action(detail=True, methods=["post"])
    def fulfill(self, request, pk=None):
        reservation = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą realizować rezerwacje."
            )
        try:
            issue_reservation_loan(reservation)
        except ValueError as error:
            raise ValidationError({"detail": str(error)}) from error
        return Response(self.get_serializer(reservation).data)

    @action(detail=True, methods=["post"])
    def issue(self, request, pk=None):
        return self.fulfill(request, pk=pk)


class FineViewSet(viewsets.ModelViewSet):
    queryset = Fine.objects.select_related("loan__copy__book", "user").all()
    serializer_class = FineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["loan__copy__book__title", "user__first_name", "user__last_name"]
    ordering_fields = ["issue_date", "paid_date", "amount", "paid", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return queryset.none()
        if not getattr(user, "is_staff", False):
            queryset = queryset.filter(user_id=user.id)

        paid = self.request.query_params.get("paid")
        if paid in {"true", "1", "yes"}:
            queryset = queryset.filter(paid=True)
        elif paid in {"false", "0", "no"}:
            queryset = queryset.filter(paid=False)
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied("Tylko pracownicy biblioteki mogą tworzyć kary.")
        serializer.save()
        create_notification(
            serializer.instance.user,
            notification_type=NotificationType.FINE_ISSUED,
            title="Nałożono karę",
            message=f"Nałożono karę #{serializer.instance.id} za wypożyczenie #{serializer.instance.loan_id}.",
            related_object_type="fine",
            related_object_id=serializer.instance.id,
        )

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą aktualizować kary."
            )
        serializer.save()

    def perform_destroy(self, instance):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied("Tylko pracownicy biblioteki mogą usuwać kary.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def settle(self, request, pk=None):
        fine = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied("Tylko pracownicy biblioteki mogą rozliczać kary.")
        fine.paid = True
        fine.paid_date = timezone.localdate()
        fine.save(update_fields=["paid", "paid_date"])
        create_notification(
            fine.user,
            notification_type=NotificationType.SYSTEM,
            title="Kara rozliczona",
            message=f"Kara #{fine.id} została oznaczona jako opłacona.",
            related_object_type="fine",
            related_object_id=fine.id,
        )
        return Response(self.get_serializer(fine).data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("book", "requested_by").all()
    serializer_class = OrderSerializer
    permission_classes = [IsStaffMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "book__title",
        "book__ean",
        "book__publisher__name",
        "book__authors__first_name",
        "book__authors__last_name",
        "supplier",
        "status",
        "notes",
    ]
    ordering_fields = ["requested_at", "expected_delivery_date", "status", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        book_id = self.request.query_params.get("book")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        serializer.save(
            requested_by_id=(
                user.id if getattr(user, "is_authenticated", False) else None
            )
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        order = self.get_object()
        order.submit()
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        order = self.get_object()
        order.receive()
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        order.cancel()
        return Response(self.get_serializer(order).data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related("user").all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "title",
        "message",
        "notification_type",
        "user__first_name",
        "user__last_name",
    ]
    ordering_fields = ["created_at", "read_at", "notification_type", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, "user", None)
        queryset = filter_visible_user_queryset(queryset, user)
        if not getattr(user, "is_authenticated", False):
            return queryset

        unread = self.request.query_params.get("unread")
        notification_type = self.request.query_params.get("type")
        if unread in {"true", "1", "yes"}:
            queryset = queryset.filter(is_read=False)
        elif unread in {"false", "0", "no"}:
            queryset = queryset.filter(is_read=True)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        return queryset

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą tworzyć powiadomienia."
            )
        serializer.save()

    def perform_update(self, serializer):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_staff", False):
            raise PermissionDenied(
                "Tylko pracownicy biblioteki mogą aktualizować powiadomienia."
            )
        serializer.save()

    def perform_destroy(self, instance):
        user = getattr(self.request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise PermissionDenied("Wymagana autentykacja.")
        if not getattr(user, "is_staff", False) and instance.user_id != user.id:
            raise PermissionDenied("Mozesz usuwac tylko swoje powiadomienia.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        user = getattr(request, "user", None)
        if not getattr(user, "is_staff", False) and notification.user_id != user.id:
            raise PermissionDenied(
                "Możesz oznaczać jako przeczytane tylko swoje powiadomienia."
            )
        notification.mark_read()
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise PermissionDenied("Wymagana autentykacja.")
        queryset = Notification.objects.filter(user_id=user.id)
        updated = queryset.filter(is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"updated": updated})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get_user_model_instance(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            raise PermissionDenied("Wymagana autentykacja.")
        return get_object_or_404(LibraryUser, pk=user.id)

    def build_profile_payload(self, profile):
        serializer = ReaderProfileSerializer(profile)
        payload = serializer.data
        summary = build_profile_summary(profile)
        payload["loan_count"] = summary["loan_count"]
        payload["reservation_count"] = summary["reservation_count"]
        payload["fine_total"] = summary["fine_total"]
        payload["summary"] = summary
        return payload

    def get(self, request):
        profile = self.get_user_model_instance(request)
        return Response(self.build_profile_payload(profile))

    def patch(self, request):
        profile = self.get_user_model_instance(request)
        serializer = ReaderProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.build_profile_payload(profile))

    def put(self, request):
        return self.patch(request)
