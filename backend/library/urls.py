from django.urls import include, path
from library.auth_views import LoginView, MeView, RefreshView
from library.views import (
    ApiRootView,
    AuthorViewSet,
    BookViewSet,
    CategoryViewSet,
    CopyViewSet,
    CurrentUserView,
    FineViewSet,
    LoanViewSet,
    LocationViewSet,
    NotificationViewSet,
    OrderViewSet,
    PublisherViewSet,
    ReaderViewSet,
    ReservationViewSet,
)
from rest_framework.routers import SimpleRouter

catalog_router = SimpleRouter()
catalog_router.register(r"books", BookViewSet, basename="book")
catalog_router.register(r"authors", AuthorViewSet, basename="author")
catalog_router.register(r"publishers", PublisherViewSet, basename="publisher")
catalog_router.register(r"categories", CategoryViewSet, basename="category")
catalog_router.register(r"locations", LocationViewSet, basename="location")
catalog_router.register(r"copies", CopyViewSet, basename="copy")

operations_router = SimpleRouter()
operations_router.register(r"readers", ReaderViewSet, basename="reader")
operations_router.register(r"loans", LoanViewSet, basename="loan")
operations_router.register(r"reservations", ReservationViewSet, basename="reservation")
operations_router.register(r"fines", FineViewSet, basename="fine")
operations_router.register(r"orders", OrderViewSet, basename="order")
operations_router.register(
    r"notifications", NotificationViewSet, basename="notification"
)

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("profile/", CurrentUserView.as_view(), name="profile"),
    path("catalog/", include(catalog_router.urls)),
] + operations_router.urls
