from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from library.models import (
    Author,
    Book,
    BookCondition,
    Category,
    Copy,
    Fine,
    LibraryUser,
    Loan,
    Location,
    Notification,
    Order,
    Publisher,
    Reservation,
)

CATEGORY_DEFINITIONS = [
    {
        "key": "Fantasy",
        "name": "Fantastyka",
        "description": "Magia, mity i epickie wyprawy w swiatach wyobrazni.",
    },
    {
        "key": "Science Fiction",
        "name": "Fantastyka naukowa",
        "description": "Klasyczne i wspolczesne wizje nauki, technologii i przyszlosci.",
    },
    {
        "key": "Mystery",
        "name": "Kryminal",
        "description": "Zagadki, sledztwa i klasyczna literatura detektywistyczna.",
    },
    {
        "key": "Romance",
        "name": "Romans",
        "description": "Historie uczuc, relacji i dramatow obyczajowych.",
    },
    {
        "key": "Historical Fiction",
        "name": "Powiesc historyczna",
        "description": "Powieci osadzone w realiach historycznych roznych epok.",
    },
    {
        "key": "Horror",
        "name": "Horror",
        "description": "Groza, niesamowitosc i klasyka mrocznej literatury.",
    },
    {
        "key": "Young Adult",
        "name": "Literatura mlodziezowa",
        "description": "Literatura dla mlodszych czytelnikow i nastolatkow.",
    },
    {
        "key": "Adventure",
        "name": "Przygodowa",
        "description": "Podroze, wyprawy i ksiazki o wielkich przygodach.",
    },
    {
        "key": "Classics",
        "name": "Klasyka",
        "description": "Kanoniczne dziela literatury swiatowej.",
    },
    {
        "key": "Biography",
        "name": "Biografia",
        "description": "Autobiografie, wspomnienia i literatura faktu o zyciu ludzi.",
    },
]

LOCATION_DEFINITIONS = {
    "Fantasy": {"shelf": "F1", "section": "Fantastyka", "floor": 1},
    "Science Fiction": {"shelf": "SF1", "section": "Fantastyka naukowa", "floor": 1},
    "Mystery": {"shelf": "M1", "section": "Kryminal", "floor": 1},
    "Romance": {"shelf": "R1", "section": "Romans", "floor": 2},
    "Historical Fiction": {
        "shelf": "H1",
        "section": "Powiesc historyczna",
        "floor": 2,
    },
    "Horror": {"shelf": "HO1", "section": "Horror", "floor": 2},
    "Young Adult": {"shelf": "YA1", "section": "Literatura mlodziezowa", "floor": 2},
    "Adventure": {"shelf": "A1", "section": "Przygodowa", "floor": 3},
    "Classics": {"shelf": "C1", "section": "Klasyka", "floor": 3},
    "Biography": {"shelf": "B1", "section": "Biografia", "floor": 3},
}

USER_DEFINITIONS = [
    {
        "key": "admin",
        "first_name": "Admin",
        "last_name": "Systemu",
        "email": "admin@library.com",
        "birthdate": "1988-05-15",
        "password": "passwd",
        "role": "admin",
    },
    {
        "key": "librarian",
        "first_name": "Marta",
        "last_name": "Bibliotekarz",
        "email": "librarian@library.com",
        "birthdate": "1990-01-20",
        "password": "passwd",
        "role": "librarian",
    },
    {
        "key": "reader1",
        "first_name": "Anna",
        "last_name": "Czytelnik",
        "email": "reader1@library.com",
        "birthdate": "1998-03-12",
        "password": "passwd",
        "role": "reader",
    },
    {
        "key": "reader2",
        "first_name": "Ola",
        "last_name": "Rezerwujaca",
        "email": "reader2@library.com",
        "birthdate": "1996-07-08",
        "password": "passwd",
        "role": "reader",
    },
    {
        "key": "reader3",
        "first_name": "Piotr",
        "last_name": "Historyk",
        "email": "reader3@library.com",
        "birthdate": "1992-11-03",
        "password": "passwd",
        "role": "reader",
    },
]

PUBLISHER_DEFINITIONS = {
    "allen-unwin": ("George Allen & Unwin", "London", "Wielka Brytania"),
    "bloomsbury": ("Bloomsbury", "London", "Wielka Brytania"),
    "scholastic": ("Scholastic Press", "New York", "Stany Zjednoczone"),
    "crown": ("Crown Publishing Group", "New York", "Stany Zjednoczone"),
    "chilton": ("Chilton Books", "Philadelphia", "Stany Zjednoczone"),
    "knopf": ("Alfred A. Knopf", "New York", "Stany Zjednoczone"),
    "little-brown": ("Little, Brown and Company", "Boston", "Stany Zjednoczone"),
    "random-house": ("Random House", "New York", "Stany Zjednoczone"),
    "spiegel-grau": ("Spiegel & Grau", "New York", "Stany Zjednoczone"),
    "dutton": ("Dutton Books", "New York", "Stany Zjednoczone"),
    "katherine-tegen": ("Katherine Tegen Books", "New York", "Stany Zjednoczone"),
    "bompiani": ("Bompiani", "Milan", "Wlochy"),
    "fourth-estate": ("Fourth Estate", "London", "Wielka Brytania"),
    "macmillan": ("Macmillan", "London", "Wielka Brytania"),
    "warner-books": ("Warner Books", "New York", "Stany Zjednoczone"),
    "houghton-mifflin": ("Houghton Mifflin", "Boston", "Stany Zjednoczone"),
    "doubleday": ("Doubleday", "New York", "Stany Zjednoczone"),
}

DEFAULT_CATEGORY_PUBLISHER_KEYS = {
    "Fantasy": "allen-unwin",
    "Science Fiction": "crown",
    "Mystery": "macmillan",
    "Romance": "knopf",
    "Historical Fiction": "fourth-estate",
    "Horror": "doubleday",
    "Young Adult": "scholastic",
    "Adventure": "random-house",
    "Classics": "random-house",
    "Biography": "little-brown",
}

BOOK_PUBLISHER_KEYS = {
    "The Hobbit": "allen-unwin",
    "The Fellowship of the Ring": "allen-unwin",
    "The Two Towers": "allen-unwin",
    "The Return of the King": "allen-unwin",
    "Harry Potter and the Philosopher's Stone": "bloomsbury",
    "The Hunger Games": "scholastic",
    "Catching Fire": "scholastic",
    "Mockingjay": "scholastic",
    "The Martian": "crown",
    "Dune": "chilton",
    "Interview with the Vampire": "knopf",
    "Love in the Time of Cholera": "knopf",
    "Long Walk to Freedom": "little-brown",
    "Educated": "random-house",
    "Born a Crime": "spiegel-grau",
    "The Fault in Our Stars": "dutton",
    "Divergent": "katherine-tegen",
    "The Name of the Rose": "bompiani",
    "Wolf Hall": "fourth-estate",
    "The Pillars of the Earth": "macmillan",
    "The Notebook": "warner-books",
    "The Giver": "houghton-mifflin",
    "The Shining": "doubleday",
}

EXTRA_COPY_COUNTS = {
    "The Hobbit": 2,
    "Harry Potter and the Philosopher's Stone": 2,
    "The Hunger Games": 2,
    "Pride and Prejudice": 2,
    "A Study in Scarlet": 2,
    "The Fellowship of the Ring": 2,
    "The Martian": 2,
    "The Diary of a Young Girl": 2,
    "The Count of Monte Cristo": 2,
    "The Little Prince": 2,
}

BOOK_DATA = [
    ("Fantasy", "Alice's Adventures in Wonderland", "Lewis", "Carroll", 1865),
    ("Fantasy", "The Wonderful Wizard of Oz", "L. Frank", "Baum", 1900),
    ("Fantasy", "Through the Looking-Glass", "Lewis", "Carroll", 1871),
    ("Fantasy", "The Hobbit", "J.R.R.", "Tolkien", 1937),
    ("Fantasy", "The Fellowship of the Ring", "J.R.R.", "Tolkien", 1954),
    ("Fantasy", "The Two Towers", "J.R.R.", "Tolkien", 1954),
    ("Fantasy", "The Return of the King", "J.R.R.", "Tolkien", 1955),
    ("Fantasy", "Harry Potter and the Philosopher's Stone", "J.K.", "Rowling", 1997),
    ("Fantasy", "Northern Lights", "Philip", "Pullman", 1995),
    ("Fantasy", "The Princess and the Goblin", "George", "MacDonald", 1872),
    ("Science Fiction", "Frankenstein", "Mary", "Shelley", 1818),
    ("Science Fiction", "The Time Machine", "H. G.", "Wells", 1895),
    ("Science Fiction", "The Invisible Man", "H. G.", "Wells", 1897),
    ("Science Fiction", "The War of the Worlds", "H. G.", "Wells", 1898),
    (
        "Science Fiction",
        "Twenty Thousand Leagues Under the Sea",
        "Jules",
        "Verne",
        1870,
    ),
    ("Science Fiction", "Brave New World", "Aldous", "Huxley", 1932),
    ("Science Fiction", "Nineteen Eighty-Four", "George", "Orwell", 1949),
    ("Science Fiction", "Fahrenheit 451", "Ray", "Bradbury", 1953),
    ("Science Fiction", "Dune", "Frank", "Herbert", 1965),
    ("Science Fiction", "The Martian", "Andy", "Weir", 2011),
    ("Mystery", "A Study in Scarlet", "Arthur Conan", "Doyle", 1887),
    ("Mystery", "The Sign of Four", "Arthur Conan", "Doyle", 1890),
    ("Mystery", "The Adventures of Sherlock Holmes", "Arthur Conan", "Doyle", 1892),
    ("Mystery", "The Memoirs of Sherlock Holmes", "Arthur Conan", "Doyle", 1894),
    ("Mystery", "The Hound of the Baskervilles", "Arthur Conan", "Doyle", 1902),
    ("Mystery", "The Return of Sherlock Holmes", "Arthur Conan", "Doyle", 1905),
    ("Mystery", "The Moonstone", "Wilkie", "Collins", 1868),
    ("Mystery", "The Woman in White", "Wilkie", "Collins", 1859),
    ("Mystery", "The Mysterious Affair at Styles", "Agatha", "Christie", 1920),
    ("Mystery", "The Murder of Roger Ackroyd", "Agatha", "Christie", 1926),
    ("Romance", "Pride and Prejudice", "Jane", "Austen", 1813),
    ("Romance", "Sense and Sensibility", "Jane", "Austen", 1811),
    ("Romance", "Emma", "Jane", "Austen", 1815),
    ("Romance", "Persuasion", "Jane", "Austen", 1817),
    ("Romance", "Jane Eyre", "Charlotte", "Bronte", 1847),
    ("Romance", "Wuthering Heights", "Emily", "Bronte", 1847),
    ("Romance", "Anna Karenina", "Leo", "Tolstoy", 1878),
    ("Romance", "Little Women", "Louisa May", "Alcott", 1868),
    ("Romance", "Love in the Time of Cholera", "Gabriel Garcia", "Marquez", 1985),
    ("Romance", "The Notebook", "Nicholas", "Sparks", 1996),
    ("Historical Fiction", "War and Peace", "Leo", "Tolstoy", 1869),
    ("Historical Fiction", "A Tale of Two Cities", "Charles", "Dickens", 1859),
    ("Historical Fiction", "The Three Musketeers", "Alexandre", "Dumas", 1844),
    ("Historical Fiction", "Les Miserables", "Victor", "Hugo", 1862),
    (
        "Historical Fiction",
        "The Last of the Mohicans",
        "James Fenimore",
        "Cooper",
        1826,
    ),
    ("Historical Fiction", "Ben-Hur", "Lew", "Wallace", 1880),
    ("Historical Fiction", "The Name of the Rose", "Umberto", "Eco", 1980),
    ("Historical Fiction", "Wolf Hall", "Hilary", "Mantel", 2009),
    ("Historical Fiction", "The Pillars of the Earth", "Ken", "Follett", 1989),
    ("Historical Fiction", "Gone with the Wind", "Margaret", "Mitchell", 1936),
    ("Horror", "Dracula", "Bram", "Stoker", 1897),
    ("Horror", "Carmilla", "Sheridan", "Le Fanu", 1872),
    ("Horror", "The Turn of the Screw", "Henry", "James", 1898),
    ("Horror", "The Picture of Dorian Gray", "Oscar", "Wilde", 1890),
    (
        "Horror",
        "Strange Case of Dr Jekyll and Mr Hyde",
        "Robert Louis",
        "Stevenson",
        1886,
    ),
    ("Horror", "The Fall of the House of Usher", "Edgar Allan", "Poe", 1839),
    ("Horror", "The Great God Pan", "Arthur", "Machen", 1894),
    ("Horror", "The Haunting of Hill House", "Shirley", "Jackson", 1959),
    ("Horror", "Interview with the Vampire", "Anne", "Rice", 1976),
    ("Horror", "The Shining", "Stephen", "King", 1977),
    ("Young Adult", "The Hunger Games", "Suzanne", "Collins", 2008),
    ("Young Adult", "Catching Fire", "Suzanne", "Collins", 2009),
    ("Young Adult", "Mockingjay", "Suzanne", "Collins", 2010),
    ("Young Adult", "The Fault in Our Stars", "John", "Green", 2012),
    ("Young Adult", "The Perks of Being a Wallflower", "Stephen", "Chbosky", 1999),
    ("Young Adult", "The Outsiders", "S. E.", "Hinton", 1967),
    ("Young Adult", "The Giver", "Lois", "Lowry", 1993),
    ("Young Adult", "Divergent", "Veronica", "Roth", 2011),
    ("Young Adult", "Anne of Green Gables", "L. M.", "Montgomery", 1908),
    ("Young Adult", "A Little Princess", "Frances Hodgson", "Burnett", 1905),
    ("Adventure", "Treasure Island", "Robert Louis", "Stevenson", 1883),
    ("Adventure", "Robinson Crusoe", "Daniel", "Defoe", 1719),
    ("Adventure", "Gulliver's Travels", "Jonathan", "Swift", 1726),
    ("Adventure", "Around the World in Eighty Days", "Jules", "Verne", 1872),
    ("Adventure", "King Solomon's Mines", "H. Rider", "Haggard", 1885),
    ("Adventure", "The Prisoner of Zenda", "Anthony", "Hope", 1894),
    ("Adventure", "The Coral Island", "R. M.", "Ballantyne", 1858),
    ("Adventure", "The Count of Monte Cristo", "Alexandre", "Dumas", 1844),
    ("Adventure", "The Call of the Wild", "Jack", "London", 1903),
    ("Adventure", "Moby-Dick", "Herman", "Melville", 1851),
    ("Classics", "Don Quixote", "Miguel de", "Cervantes", 1605),
    ("Classics", "A Christmas Carol", "Charles", "Dickens", 1843),
    ("Classics", "Candide", "Voltaire", "Voltaire", 1759),
    ("Classics", "The Tempest", "William", "Shakespeare", 1611),
    ("Classics", "Dubliners", "James", "Joyce", 1914),
    ("Classics", "Three Men in a Boat", "Jerome K.", "Jerome", 1889),
    ("Classics", "The Little Prince", "Antoine de Saint-", "Exupery", 1943),
    ("Classics", "My Antonia", "Willa", "Cather", 1918),
    ("Classics", "Great Expectations", "Charles", "Dickens", 1861),
    ("Classics", "Crime and Punishment", "Fyodor", "Dostoevsky", 1866),
    ("Biography", "The Diary of a Young Girl", "Anne", "Frank", 1947),
    ("Biography", "Long Walk to Freedom", "Nelson", "Mandela", 1994),
    ("Biography", "I Know Why the Caged Bird Sings", "Maya", "Angelou", 1969),
    ("Biography", "Night", "Elie", "Wiesel", 1956),
    (
        "Biography",
        "Narrative of the Life of Frederick Douglass",
        "Frederick",
        "Douglass",
        1845,
    ),
    ("Biography", "Twelve Years a Slave", "Solomon", "Northup", 1853),
    ("Biography", "The Story of My Life", "Helen", "Keller", 1903),
    (
        "Biography",
        "The Autobiography of Benjamin Franklin",
        "Benjamin",
        "Franklin",
        1791,
    ),
    ("Biography", "Born a Crime", "Trevor", "Noah", 2016),
    ("Biography", "Educated", "Tara", "Westover", 2018),
]

LOAN_SCENARIOS = [
    {
        "title": "Harry Potter and the Philosopher's Stone",
        "copy_index": 1,
        "user": "reader2",
        "loan_offset_days": -5,
        "due_offset_days": 2,
        "return_offset_days": None,
        "status": "active",
    },
    {
        "title": "The Hobbit",
        "copy_index": 1,
        "user": "reader3",
        "loan_offset_days": -2,
        "due_offset_days": 5,
        "return_offset_days": None,
        "status": "active",
    },
    {
        "title": "Dune",
        "copy_index": 0,
        "user": "reader1",
        "loan_offset_days": -14,
        "due_offset_days": -3,
        "return_offset_days": None,
        "status": "overdue",
    },
    {
        "title": "A Study in Scarlet",
        "copy_index": 0,
        "user": "reader2",
        "loan_offset_days": -3,
        "due_offset_days": 4,
        "return_offset_days": None,
        "status": "active",
    },
    {
        "title": "Pride and Prejudice",
        "copy_index": 0,
        "user": "reader3",
        "loan_offset_days": -10,
        "due_offset_days": -3,
        "return_offset_days": -1,
        "status": "returned",
    },
]

RESERVATION_SCENARIOS = [
    {
        "title": "The Hobbit",
        "user": "reader1",
        "reservation_offset_days": -1,
        "expiry_offset_days": 6,
        "status": "pending",
    },
    {
        "title": "The Hobbit",
        "user": "reader2",
        "reservation_offset_days": 0,
        "expiry_offset_days": 7,
        "status": "pending",
    },
    {
        "title": "Dune",
        "user": "reader2",
        "reservation_offset_days": -2,
        "expiry_offset_days": 5,
        "status": "pending",
    },
    {
        "title": "The Hunger Games",
        "user": "reader3",
        "reservation_offset_days": -1,
        "expiry_offset_days": 8,
        "status": "pending",
    },
    {
        "title": "Dracula",
        "user": "reader1",
        "reservation_offset_days": -5,
        "expiry_offset_days": -1,
        "status": "cancelled",
    },
    {
        "title": "A Little Princess",
        "user": "reader2",
        "reservation_offset_days": -10,
        "expiry_offset_days": -2,
        "status": "expired",
    },
]

FINE_SCENARIOS = [
    {
        "loan_title": "Dune",
        "user": "reader1",
        "amount": "7.50",
        "issue_offset_days": 0,
        "paid": False,
        "paid_offset_days": None,
    },
    {
        "loan_title": "Pride and Prejudice",
        "user": "reader3",
        "amount": "5.00",
        "issue_offset_days": -1,
        "paid": True,
        "paid_offset_days": 0,
    },
]

ORDER_SCENARIOS = [
    {
        "title": "The Martian",
        "requested_by": "librarian",
        "quantity": 3,
        "supplier": "Crown Publishing Group",
        "status": "submitted",
        "requested_offset_days": -2,
        "expected_offset_days": 12,
        "notes": "Popularna nowoczesna fantastyka naukowa.",
    },
    {
        "title": "Wolf Hall",
        "requested_by": "admin",
        "quantity": 2,
        "supplier": "Fourth Estate",
        "status": "processing",
        "requested_offset_days": -1,
        "expected_offset_days": 10,
        "notes": "Utrzymanie mocnej sekcji powiesci historycznej.",
    },
    {
        "title": "Educated",
        "requested_by": "librarian",
        "quantity": 4,
        "supplier": "Random House",
        "status": "draft",
        "requested_offset_days": 0,
        "expected_offset_days": 15,
        "notes": "Rozbudowa polki z biografiami.",
    },
    {
        "title": "The Hunger Games",
        "requested_by": "admin",
        "quantity": 5,
        "supplier": "Scholastic Press",
        "status": "received",
        "requested_offset_days": -6,
        "expected_offset_days": -1,
        "notes": "Wysoka rotacja w dziale literatury mlodziezowej.",
    },
]

NOTIFICATION_SCENARIOS = [
    {
        "user": "reader1",
        "notification_type": "fine_issued",
        "title": "Naliczono kare za Dune",
        "message": "Wypozyczenie ksiazki Dune jest przeterminowane i ma przypisana kare.",
        "related_type": "fine",
        "related_key": "Dune",
        "created_offset_days": 0,
        "is_read": False,
    },
    {
        "user": "reader2",
        "notification_type": "system",
        "title": "Aktywna rezerwacja The Hobbit",
        "message": "Masz aktywna rezerwacje ksiazki The Hobbit i oczekujesz w kolejce.",
        "related_type": "reservation",
        "related_key": "The Hobbit:reader2",
        "created_offset_days": 0,
        "is_read": False,
    },
    {
        "user": "reader2",
        "notification_type": "loan_due",
        "title": "Zbliza sie termin zwrotu",
        "message": "Termin zwrotu ksiazki Harry Potter and the Philosopher's Stone przypada wkrotce.",
        "related_type": "loan",
        "related_key": "Harry Potter and the Philosopher's Stone",
        "created_offset_days": -1,
        "is_read": False,
    },
    {
        "user": "librarian",
        "notification_type": "order_update",
        "title": "Zamowienie dla The Martian",
        "message": "Zamowienie egzemplarzy The Martian zostalo wyslane do realizacji.",
        "related_type": "order",
        "related_key": "The Martian",
        "created_offset_days": -1,
        "is_read": True,
    },
]


def build_demo_ean(book_number: int) -> str:
    base = f"978830{book_number:06d}"
    checksum = (
        10
        - sum(
            digit * (1 if index % 2 == 0 else 3)
            for index, digit in enumerate(int(char) for char in base)
        )
        % 10
    ) % 10
    return f"{base}{checksum}"


class Command(BaseCommand):
    help = "Wypelnia aplikacje realistycznym zestawem 100 ksiazek demo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Dodaj dane demo tylko wtedy, gdy baza nie zawiera jeszcze uzytkownikow.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["if_empty"] and LibraryUser.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Dane demo sa juz obecne. Pomijam ponowne zasilenie."
                )
            )
            return

        self._clear_existing_data()
        seed_state = self._seed_reference_data()
        self._seed_catalog(seed_state)
        self._validate_seed_catalog()
        self._seed_circulation(seed_state)

        self.stdout.write(
            self.style.SUCCESS(
                (
                    f"Dodano {Book.objects.count()} ksiazek, {Copy.objects.count()} egzemplarzy, "
                    f"{Loan.objects.count()} wypozyczen i {Reservation.objects.count()} rezerwacji."
                )
            )
        )

    def _validate_seed_catalog(self) -> None:
        missing_publishers = Book.objects.filter(publisher__isnull=True).count()
        missing_eans = Book.objects.filter(ean__isnull=True).count()

        if missing_publishers or missing_eans:
            raise CommandError(
                "Seed demo nie jest kompletny: "
                f"brakujacy wydawcy={missing_publishers}, brakujacy EAN={missing_eans}."
            )

    def _clear_existing_data(self) -> None:
        Notification.objects.all().delete()
        Fine.objects.all().delete()
        Order.objects.all().delete()
        Reservation.objects.all().delete()
        Loan.objects.all().delete()
        Copy.objects.all().delete()
        Book.objects.all().delete()
        Author.objects.all().delete()
        Category.objects.all().delete()
        Publisher.objects.all().delete()
        Location.objects.all().delete()
        LibraryUser.objects.all().delete()

    def _seed_reference_data(self) -> dict[str, dict[str, object]]:
        users: dict[str, LibraryUser] = {}
        categories: dict[str, Category] = {}
        locations: dict[str, Location] = {}
        publishers: dict[str, Publisher] = {}

        for definition in USER_DEFINITIONS:
            users[definition["key"]] = LibraryUser.objects.create(
                first_name=definition["first_name"],
                last_name=definition["last_name"],
                email=definition["email"],
                birthdate=definition["birthdate"],
                password=definition["password"],
                role=definition["role"],
            )

        for definition in CATEGORY_DEFINITIONS:
            category_key = definition["key"]
            category = Category.objects.create(
                name=definition["name"],
                description=definition["description"],
            )
            categories[category_key] = category
            locations[category_key] = Location.objects.create(
                **LOCATION_DEFINITIONS[category_key]
            )

        for key, values in PUBLISHER_DEFINITIONS.items():
            name, city, country = values
            publishers[key] = Publisher.objects.create(
                name=name,
                city=city,
                country=country,
            )

        return {
            "users": users,
            "categories": categories,
            "locations": locations,
            "publishers": publishers,
            "authors": {},
            "books": {},
            "copies": {},
        }

    def _seed_catalog(self, seed_state: dict[str, dict[str, object]]) -> None:
        authors: dict[tuple[str, str], Author] = seed_state["authors"]
        books: dict[str, Book] = seed_state["books"]
        copies: dict[str, list[Copy]] = seed_state["copies"]
        categories: dict[str, Category] = seed_state["categories"]
        locations: dict[str, Location] = seed_state["locations"]
        publishers: dict[str, Publisher] = seed_state["publishers"]

        condition_cycle = [BookCondition.NEW, BookCondition.GOOD, BookCondition.WORN]

        for index, book_data in enumerate(BOOK_DATA):
            category_key, title, author_first_name, author_last_name, publish_year = (
                book_data
            )
            author_key = (author_first_name, author_last_name)
            if author_key not in authors:
                authors[author_key] = Author.objects.create(
                    first_name=author_first_name,
                    last_name=author_last_name,
                )
            publisher_key = BOOK_PUBLISHER_KEYS.get(
                title, DEFAULT_CATEGORY_PUBLISHER_KEYS[category_key]
            )
            publisher = publishers[publisher_key]
            author_full_name = f"{author_first_name} {author_last_name}".strip()
            category = categories[category_key]
            book = Book.objects.create(
                title=title,
                ean=build_demo_ean(index + 1),
                publish_year=publish_year,
                description=(
                    f"{title} to rozpoznawalna ksiazka z kategorii {category.name.lower()} "
                    f"autorstwa {author_full_name}."
                ),
                publisher=publisher,
            )
            book.set_authors([authors[author_key]])
            book.set_categories([category])

            books[title] = book
            copies[title] = []
            copy_count = EXTRA_COPY_COUNTS.get(title, 1)
            for copy_index in range(copy_count):
                copy = Copy.objects.create(
                    book=book,
                    location=locations[category_key],
                    condition=condition_cycle[
                        (index + copy_index) % len(condition_cycle)
                    ],
                    available=True,
                )
                copies[title].append(copy)

    def _seed_circulation(self, seed_state: dict[str, dict[str, object]]) -> None:
        users: dict[str, LibraryUser] = seed_state["users"]
        books: dict[str, Book] = seed_state["books"]
        copies_by_title: dict[str, list[Copy]] = seed_state["copies"]
        today = timezone.localdate()
        loans_by_title: dict[str, Loan] = {}
        reservations_by_key: dict[str, Reservation] = {}
        fines_by_title: dict[str, Fine] = {}
        orders_by_title: dict[str, Order] = {}

        for scenario in LOAN_SCENARIOS:
            copy = copies_by_title[scenario["title"]][scenario["copy_index"]]
            return_date = (
                today + timedelta(days=scenario["return_offset_days"])
                if scenario["return_offset_days"] is not None
                else None
            )
            loan = Loan.objects.create(
                copy=copy,
                user=users[scenario["user"]],
                loan_date=today + timedelta(days=scenario["loan_offset_days"]),
                due_date=today + timedelta(days=scenario["due_offset_days"]),
                return_date=return_date,
                status=scenario["status"],
            )
            if return_date is None and scenario["status"] != "returned":
                copy.mark_unavailable()
            else:
                copy.mark_available()
            loans_by_title[scenario["title"]] = loan

        for scenario in RESERVATION_SCENARIOS:
            reservation = Reservation.objects.create(
                book=books[scenario["title"]],
                user=users[scenario["user"]],
                reservation_date=today
                + timedelta(days=scenario["reservation_offset_days"]),
                expiry_date=today + timedelta(days=scenario["expiry_offset_days"]),
                status=scenario["status"],
            )
            reservations_by_key[f"{scenario['title']}:{scenario['user']}"] = reservation

        for scenario in FINE_SCENARIOS:
            paid_date = (
                today + timedelta(days=scenario["paid_offset_days"])
                if scenario["paid"] and scenario["paid_offset_days"] is not None
                else None
            )
            fine = Fine.objects.create(
                loan=loans_by_title[scenario["loan_title"]],
                user=users[scenario["user"]],
                amount=Decimal(scenario["amount"]),
                issue_date=today + timedelta(days=scenario["issue_offset_days"]),
                paid=scenario["paid"],
                paid_date=paid_date,
            )
            fines_by_title[scenario["loan_title"]] = fine

        for scenario in ORDER_SCENARIOS:
            order = Order.objects.create(
                book=books[scenario["title"]],
                requested_by=users[scenario["requested_by"]],
                quantity=scenario["quantity"],
                supplier=scenario["supplier"],
                status=scenario["status"],
                requested_at=timezone.now()
                + timedelta(days=scenario["requested_offset_days"]),
                expected_delivery_date=today
                + timedelta(days=scenario["expected_offset_days"]),
                notes=scenario["notes"],
            )
            orders_by_title[scenario["title"]] = order

        for scenario in NOTIFICATION_SCENARIOS:
            related_object_id = None
            if scenario["related_type"] == "loan":
                related_object_id = loans_by_title[scenario["related_key"]].id
            elif scenario["related_type"] == "fine":
                related_object_id = fines_by_title[scenario["related_key"]].id
            elif scenario["related_type"] == "reservation":
                related_object_id = reservations_by_key[scenario["related_key"]].id
            elif scenario["related_type"] == "order":
                related_object_id = orders_by_title[scenario["related_key"]].id

            notification = Notification.objects.create(
                user=users[scenario["user"]],
                notification_type=scenario["notification_type"],
                title=scenario["title"],
                message=scenario["message"],
                related_object_type=scenario["related_type"],
                related_object_id=related_object_id,
                created_at=timezone.now()
                + timedelta(days=scenario["created_offset_days"]),
                is_read=scenario["is_read"],
            )
            if scenario["is_read"]:
                notification.read_at = notification.created_at
                notification.save(update_fields=["read_at"])
