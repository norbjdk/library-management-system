from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from library.models import (
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
    Order,
    Publisher,
    Reservation,
    ReservationStatus,
)
from library.services import (
    build_book_availability_snapshot,
    calculate_reservation_queue_position,
)
from rest_framework import serializers


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "first_name", "last_name", "birthdate", "nationality"]


class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ["id", "name", "city", "country"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "shelf", "section", "floor"]


class CopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    location_label = serializers.SerializerMethodField()

    class Meta:
        model = Copy
        fields = [
            "id",
            "book",
            "book_title",
            "location",
            "location_label",
            "condition",
            "available",
        ]

    def get_location_label(self, obj):
        if obj.location is None:
            return None
        return str(obj.location)


class BookSerializer(serializers.ModelSerializer):
    publisher_name = serializers.CharField(source="publisher.name", read_only=True)
    authors = AuthorSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    author_ids = serializers.PrimaryKeyRelatedField(
        source="authors",
        many=True,
        queryset=Author.objects.all(),
        write_only=True,
        required=False,
    )
    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        many=True,
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
    )
    copies_count = serializers.SerializerMethodField()
    available_copies = serializers.SerializerMethodField()
    active_loans = serializers.SerializerMethodField()
    active_reservations = serializers.SerializerMethodField()
    estimated_wait_days = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "ean",
            "publish_year",
            "description",
            "publisher",
            "publisher_name",
            "authors",
            "categories",
            "author_ids",
            "category_ids",
            "copies_count",
            "available_copies",
            "active_loans",
            "active_reservations",
            "estimated_wait_days",
        ]

    def get_copies_count(self, obj):
        return obj.copies.count()

    def get_available_copies(self, obj):
        return obj.copies.filter(available=True).count()

    def get_active_loans(self, obj):
        return Loan.objects.filter(
            copy__book=obj,
            status__in=[LoanStatus.ACTIVE, LoanStatus.OVERDUE],
            return_date__isnull=True,
        ).count()

    def get_active_reservations(self, obj):
        return Reservation.objects.filter(
            book=obj,
            status=ReservationStatus.PENDING,
        ).count()

    def get_estimated_wait_days(self, obj):
        snapshot = build_book_availability_snapshot(obj)
        return snapshot["estimated_wait_days"]

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        categories = validated_data.pop("categories", [])
        book = Book.objects.create(**validated_data)
        if authors:
            book.authors.set(authors)
        if categories:
            book.categories.set(categories)
        return book

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        categories = validated_data.pop("categories", None)
        book = super().update(instance, validated_data)
        if authors is not None:
            book.authors.set(authors)
        if categories is not None:
            book.categories.set(categories)
        return book


class ReaderSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    loan_count = serializers.SerializerMethodField()
    reservation_count = serializers.SerializerMethodField()
    fine_total = serializers.SerializerMethodField()

    class Meta:
        model = LibraryUser
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "birthdate",
            "password",
            "role",
            "created_at",
            "loan_count",
            "reservation_count",
            "fine_total",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "created_at": {"read_only": True},
        }

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_loan_count(self, obj):
        return obj.loans.count()

    def get_reservation_count(self, obj):
        return obj.reservations.count()

    def get_fine_total(self, obj):
        total = obj.fines.aggregate(total=Sum("amount"))["total"]
        return total or Decimal("0.00")


class ReaderProfileSerializer(ReaderSerializer):
    class Meta(ReaderSerializer.Meta):
        extra_kwargs = {
            **ReaderSerializer.Meta.extra_kwargs,
            "role": {"read_only": True},
        }


class LoanSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    book_id = serializers.IntegerField(source="copy.book_id", read_only=True)
    book_title = serializers.CharField(source="copy.book.title", read_only=True)
    days_until_due = serializers.SerializerMethodField()
    overdue_days = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "copy",
            "book_id",
            "book_title",
            "user",
            "user_name",
            "loan_date",
            "due_date",
            "return_date",
            "status",
            "days_until_due",
            "overdue_days",
            "is_overdue",
        ]

    def get_user_name(self, obj):
        return str(obj.user)

    def get_days_until_due(self, obj):
        if obj.return_date:
            return 0
        return (obj.due_date - timezone.localdate()).days

    def get_overdue_days(self, obj):
        reference_date = obj.return_date or timezone.localdate()
        return max((reference_date - obj.due_date).days, 0)

    def get_is_overdue(self, obj):
        return obj.status == LoanStatus.OVERDUE or (
            obj.return_date is None and obj.due_date < timezone.localdate()
        )


class ReservationSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    book_title = serializers.CharField(source="book.title", read_only=True)
    queue_position = serializers.SerializerMethodField()
    estimated_ready_date = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "book",
            "book_title",
            "user",
            "user_name",
            "reservation_date",
            "expiry_date",
            "status",
            "queue_position",
            "estimated_ready_date",
        ]

    def get_user_name(self, obj):
        return str(obj.user)

    def get_queue_position(self, obj):
        return calculate_reservation_queue_position(obj)

    def get_estimated_ready_date(self, obj):
        queue_position = calculate_reservation_queue_position(obj)
        if queue_position == 0:
            return None
        available_copies = obj.book.copies.filter(available=True).count()
        wait_days = max(queue_position - available_copies, 0) * 7
        return (timezone.localdate() + timedelta(days=wait_days)).isoformat()


class FineSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    loan_summary = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Fine
        fields = [
            "id",
            "loan",
            "user",
            "user_name",
            "amount",
            "issue_date",
            "paid_date",
            "paid",
            "loan_summary",
            "remaining_amount",
        ]

    def get_user_name(self, obj):
        return str(obj.user)

    def get_loan_summary(self, obj):
        return f"{obj.loan.copy.book.title} / loan #{obj.loan_id}"

    def get_remaining_amount(self, obj):
        return Decimal("0.00") if obj.paid else obj.amount


class OrderSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    age_days = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "book",
            "book_title",
            "requested_by",
            "requested_by_name",
            "quantity",
            "supplier",
            "status",
            "requested_at",
            "expected_delivery_date",
            "notes",
            "age_days",
        ]

    def get_requested_by_name(self, obj):
        return str(obj.requested_by) if obj.requested_by_id else None

    def get_age_days(self, obj):
        return (timezone.localdate() - obj.requested_at.date()).days


class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_unread = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "user_name",
            "notification_type",
            "title",
            "message",
            "related_object_type",
            "related_object_id",
            "created_at",
            "read_at",
            "is_read",
            "is_unread",
        ]

    def get_user_name(self, obj):
        return str(obj.user)

    def get_is_unread(self, obj):
        return not obj.is_read
