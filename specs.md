Zagadnienia

    Dobór tematu, podział na zespoły projektowe, dyskusja i ocena pracochłonności projektu, podziału prac w zespole .Tworzenie i prezentacja diagramu Gantta.

    Dyskusja w zespole projektowym na temat wyboru nowych technologii koniecznych do realizacji zadania; (prezentacje nowych technologii)

    Stworzenie specyfikacji wymagań na podstawie kontaktów z użytkownikiem. Przygotowanie wstępnej wizji i koncepcji projektowanego systemu

    Określenie zakresu odpowiedzialności systemu i założeń do projektu

    Zaproponowanie modelu tworzonego systemu – zwizualizowanego (np. przy pomocy UML – DPU, inne diagramy UML)

    Utworzenie i ocena dokumentacji, prezentacja stanu zaawansowania prac, częściowa recenzja, weryfikacja diagramu Gantta

    Tworzenie projektu systemu – obejmującego część funkcjonalną

    Tworzenie projektu systemu – obejmującego część bazodanową

    Projektowanie interfejsu (GUI) dla użytkownika systemu

    Implementacja systemu; wybór metody, kolejność prac wdrożeniowych

    Tworzenie dokumentacji technicznej, w tym podręcznika użytkownika systemu

    Testowanie jednostkowe i integracyjne; plany testów, dokumentowanie testów

    Testowanie akceptacyjne; plany testów, przypadki testowe, dokumentowanie testów

    Wprowadzanie poprawek

    Podsumowanie prac: prezentacja wyników prac – demonstrowanie stworzonych systemów, wskazania i dyskusje dotyczące dalszych kierunków rozwoju projektu.

Cele projektu zespołowego:

    Realizacja większego projektu programistycznego przez studentów w ramach projektu zespołowego

    Poznanie samodzielne nowych technologii koniecznych do realizacji zadania

    Poznanie podstawowych narzędzi do usprawnienia procesu projektowania (np. Bitbucket, Trello, GitHub )

    Spraktykowanie dobrej organizacji prac projektowych; elementów zarządzania projektem IT

    Nabycie umiejętności tworzenia dokumentacji technicznej projektu informatycznego

Temat projektu zespołowego: Oprogramowanie do zarządzania zasobami biblioteki

System biblioteczny do zarządzania zasobami biblioteki, automatyzujące katalogowanie, wypożyczenia, obsługę czytelników oraz raportowanie.

Wymagania funkcjonalne:

    Przeglądanie katalogu książek

    Autoryzacja operacji

    Lokalizacja zbiorów

    Cykl życia wypożyczenia

    Kolejkowanie i estymacja czasu

    System powiadomień

    Kontrola stanu fizycznego

    Zarządzanie karami

    Moduł zamówień

Przygotowanie środowiska backendu, frontendu + konteneryzacja

    Ustalenie struktury projektu backendowego i frontendowego

    Instalacja wszystkich wymaganych zależności

    Konteneryzacja aplikacji (Docker)

    Konfiguracja ustawień środowiskowych

    Skonfigurowanie rekomendowanych rozszerzeń środowiskowych

    Sprawdzenie poprawności uruchamiania projektu lokalnie

Projekt bazy danych

    Ustalenie głównych tabel systemu

    Zaprojektowanie tabel dla książek

    Zaprojektowanie tabel dla egzemplarzy

    Zaprojektowanie tabel dla użytkowników

    Zaprojektowanie tabel dla wypożyczeń

    Zaprojektowanie tabel dla rezerwacji

    Zaprojektowanie tabel dla kar

    Zaprojektowanie tabel dla zamówień

    Zaprojektowanie tabel dla lokalizacji zbiorów

    Ustalenie relacji między tabelami

    Ustalenie statusów i ograniczeń danych

Implementacja logiki biznesowej

    Modelowanie katalogu książek

    Obsługa egzemplarzy książek

    Obsługa autorów, kategorii i statusów

    Implementacja cyklu życia wypożyczenia

    Obsługa zwrotu i przedłużenia wypożyczenia

    Obsługa rezerwacji i kolejki oczekujących

    Wyznaczanie czasu dostępności zasobu

    System powiadomień o zmianach statusu

    Zarządzanie karami za przetrzymanie

    Obsługa zamówień na zasoby

    Kontrola stanu fizycznego egzemplarza

    Ograniczenie operacji do odpowiednich ról

Konfiguracja bazy danych

    Utworzenie lokalnej bazy danych

    Ustawienie danych dostępowych

    Połączenie backendu z bazą

    Sprawdzenie poprawności odczytu danych

    Sprawdzenie poprawności zapisu danych

    Weryfikacja działania bazy w kontenerze

    Uporządkowanie ustawień środowiskowych

    Potwierdzenie stabilnego działania połączenia

Testy backendu

    Przygotowanie testów endpointów API

    Testy autoryzacji i dostępu

    Testy logiki wypożyczeń

    Testy rezerwacji i kolejki

    Testy kar i statusów

    Testy walidacji danych wejściowych

    Testy obsługi błędów

    Walidacja poprawności pełnego zestawu testów

Migracje i dane testowe

    Utworzenie pierwszych migracji

    Dodanie przykładowych książek

    Dodanie przykładowych autorów

    Dodanie przykładowych czytelników

    Dodanie przykładowych wypożyczeń

    Dodanie przykładowych rezerwacji

    Dodanie przykładowych kar lub zamówień

    Sprawdzenie poprawności struktury bazy

    Sprawdzenie odtworzenia bazy od zera

Projekt interfejsu

    Ustalenie głównych ekranów aplikacji

    Ustalenie jednego spójnego stylu wizualnego

    Projekt widoku katalogu książek

    Projekt widoku szczegółów książki

    Projekt widoku logowania

    Projekt panelu użytkownika

    Projekt panelu bibliotekarza

    Podstawowa nawigacja

Integracja z backendem

    Podłączenie widoków do API

    Pobieranie danych z backendu

    Wysyłanie danych formularzy do backendu

    Obsługa odpowiedzi sukcesu

    Obsługa odpowiedzi błędów

    Dodanie stanów ładowania

    Dodanie odświeżania danych po zmianach

    Sprawdzenie pełnego przepływu użytkownika

Testy interfejsu

    Sprawdzenie działania nawigacji

    Sprawdzenie WSZYSTKICH formularzy (walidacja, sanityzacja itd.)

    Sprawdzenie widoku katalogu

    Sprawdzenie widoku szczegółów książki

    Sprawdzenie komunikatów błędów

    Sprawdzenie czytelności ekranów

    Sprawdzenie działania przy różnych rozmiarach okna [flex?] (Bez wersji mobilnej)

    Sprawdzenie integracji z API

Konfiguracja API

    Ustalenie głównych endpointów systemu

    Przygotowanie endpointów dla katalogu książek

    Przygotowanie endpointów dla czytelników

    Przygotowanie endpointów dla wypożyczeń

    Przygotowanie endpointów dla rezerwacji

    Przygotowanie endpointów dla rezerwacji

    Przygotowanie endpointów dla zamówień

    Przygotowanie endpointów dla kar i powiadomień

    Ustalenie formatu odpowiedzi API

    Ustalenie sposobu obsługi błędów

    Sprawdzenie spójności API z frontendem
