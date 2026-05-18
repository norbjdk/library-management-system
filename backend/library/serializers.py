from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from library.models import (
    Author,
    Book,
    Category,
    Copy,
    Fine,
    LibraryRole,
    LibraryUser,
    Loan,
    Location,
    Notification,
    Order,
    Publisher,
    Reservation,
    ReservationStatus,
)
from library.services import calculate_reservation_queue_position
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
    user_has_active_reservation = serializers.SerializerMethodField()

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
            "user_has_active_reservation",
        ]

    def get_copies_count(self, obj):
        return obj.copies_count

    def get_available_copies(self, obj):
        return obj.available_copies_count

    def get_active_loans(self, obj):
        return obj.active_loans_count

    def get_active_reservations(self, obj):
        return obj.active_reservations_count

    def get_estimated_wait_days(self, obj):
        return obj.estimated_wait_days()

    def get_user_has_active_reservation(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not getattr(user, "is_authenticated", False):
            return False

        if getattr(user, "is_staff", False):
            return False

        return Reservation.objects.filter(
            book=obj,
            user_id=user.id,
            status=ReservationStatus.PENDING,
        ).exists()

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        categories = validated_data.pop("categories", [])
        book = Book.objects.create(**validated_data)
        if authors:
            book.set_authors(authors)
        if categories:
            book.set_categories(categories)
        return book

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        categories = validated_data.pop("categories", None)
        book = super().update(instance, validated_data)
        if authors is not None:
            book.set_authors(authors)
        if categories is not None:
            book.set_categories(categories)
        return book


class ReaderSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    loan_count = serializers.SerializerMethodField()
    reservation_count = serializers.SerializerMethodField()
    fine_total = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source="is_staff_member", read_only=True)

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
            "is_staff",
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
        return obj.full_name

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

    def create(self, validated_data):
        validated_data["role"] = LibraryRole.READER
        return super().create(validated_data)


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
        extra_kwargs = {
            "due_date": {"required": False},
        }

    def get_user_name(self, obj):
        return obj.user.full_name

    def get_days_until_due(self, obj):
        return obj.days_until_due

    def get_overdue_days(self, obj):
        return obj.overdue_days

    def get_is_overdue(self, obj):
        return obj.is_overdue


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
        extra_kwargs = {
            "user": {"required": False},
        }
        validators = []

    def get_user_name(self, obj):
        return obj.user.full_name

    def validate(self, attrs):
        request = self.context.get("request")
        book = attrs.get("book") or getattr(self.instance, "book", None)
        user = attrs.get("user")

        if user is None and request is not None:
            principal = getattr(request, "user", None)
            if getattr(principal, "is_authenticated", False):
                user = LibraryUser.objects.filter(pk=principal.id).first()

        if book is not None and user is not None:
            queryset = Reservation.objects.filter(book=book, user=user)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Masz już rezerwację tej książki. Sprawdź jej status w kolejce."
                        ]
                    }
                )

        return attrs

    def get_queue_position(self, obj):
        return calculate_reservation_queue_position(obj)

    def get_estimated_ready_date(self, obj):
        estimated_ready_date = obj.estimated_ready_date
        if estimated_ready_date is None:
            return None
        return estimated_ready_date.isoformat()


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
        return obj.user.full_name

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
        return obj.requested_by.full_name if obj.requested_by_id else None

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
        return obj.user.full_name

    def get_is_unread(self, obj):
        return not obj.is_read
