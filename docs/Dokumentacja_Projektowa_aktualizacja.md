# Gotowe Fragmenty Do Wklejenia Do Dokumentacja_Projektowa.docx

Ten plik zawiera gotowe bloki tekstu do wklejenia do dokumentu projektowego na podstawie aktualnego stanu repozytorium.

- Rozdział 6. Projekt interfejsu użytkownika został pominięty zgodnie z prośbą.
- Warto poprawić numerację sekcji `2.3` na `2.2`.
- Jeżeli spis treści jest utrzymywany ręcznie, warto dopisać sekcje `3.9. Moduł zamówień` oraz `3.10. Moduł profilu, panelu operacyjnego i administracji`.

## 1.1. Cel projektu

```text
Celem projektu jest zaprojektowanie i zaimplementowanie webowego systemu bibliotecznego, który łączy publicznie dostępny katalog książek z modułami obsługi czytelnika, panelem operacyjnym bibliotekarza oraz administracyjnym modułem zarządzania użytkownikami i książkami. System ma umożliwiać anonimowym użytkownikom przeglądanie zbiorów, zarejestrowanym czytelnikom samodzielne zarządzanie rezerwacjami, wypożyczeniami, karami i powiadomieniami, bibliotekarzom bieżącą obsługę obiegu książek, a administratorom dodatkowo zarządzanie kluczowymi danymi systemowymi.

Projekt rozwiązuje problem rozproszenia informacji o dostępności książek, kolejce oczekujących, lokalizacji egzemplarzy oraz statusie bieżących zobowiązań czytelnika. Zamiast tradycyjnego, ręcznie prowadzonego obiegu danych użytkownik otrzymuje jeden spójny system, w którym może sprawdzić dostępność pozycji, założyć konto, utworzyć rezerwację, śledzić własne wypożyczenia i przeglądać powiadomienia, bibliotekarz może obsługiwać zwroty, kary, zamówienia i kolejkę, a administrator może dodatkowo zarządzać listą użytkowników oraz bazą książek bezpośrednio z poziomu interfejsu webowego.

Cele szczegółowe projektu są następujące:
1. Dla gościa: zapewnienie publicznego dostępu do katalogu, kategorii i szczegółów książek bez konieczności logowania.
2. Dla czytelnika: udostępnienie samoobsługowego modułu rezerwacji, kolejki oczekujących, profilu, kar, wypożyczeń i powiadomień.
3. Dla bibliotekarza: zapewnienie operacyjnego panelu pracy obejmującego wypożyczenia, realizację rezerwacji, rozliczanie kar, zamówienia oraz przegląd danych systemowych.
4. Dla administratora: zapewnienie administracyjnego dostępu do zarządzania kontami użytkowników i bazą książek z poziomu strony internetowej.

Końcowym efektem projektu jest aplikacja internetowa, której backend udostępnia REST API dla modułów katalogowych, obiegowych i administracyjnych, a frontend zapewnia publiczny katalog oraz dostęp do funkcji czytelnika, bibliotekarza i administratora zależnie od roli użytkownika.
```

## 1.2. Zakres systemu

```text
Zakres projektu obejmuje internetowy system biblioteczny złożony z warstwy frontendowej i backendowego REST API. Aktualne repozytorium obejmuje następujące funkcjonalności:

1. Konta użytkowników i autoryzacja:
- rejestracja nowych kont czytelnika,
- logowanie, wylogowanie i odświeżanie sesji,
- pobieranie danych bieżącego użytkownika,
- edycja własnego profilu oraz podgląd aktualnego podsumowania aktywności konta.

2. Publiczne przeglądanie katalogu:
- przeglądanie katalogu książek bez logowania,
- wyszukiwanie tekstowe w katalogu po tytule, EAN, autorze, wydawcy, opisie i kategorii,
- przeglądanie książek według kategorii,
- podgląd szczegółów książki, w tym autorów, wydawcy, kategorii, lokalizacji egzemplarzy oraz bieżącej dostępności.

3. Rezerwacje, kolejka i estymacja czasu:
- tworzenie rezerwacji przez czytelnika,
- anulowanie własnej rezerwacji,
- podgląd pozycji w kolejce i szacowanej daty gotowości,
- realizacja rezerwacji przez pracownika biblioteki poprzez utworzenie 7-dniowego wypożyczenia.

4. Cykl życia wypożyczenia:
- tworzenie wypożyczeń przez pracownika biblioteki,
- automatyczne ustawianie domyślnego terminu zwrotu na 7 dni,
- oznaczanie wypożyczeń jako przeterminowane,
- przedłużanie wypożyczeń o pełne tygodnie,
- rejestracja zwrotu oraz zwolnienie egzemplarza.

5. Kary i powiadomienia:
- automatyczne naliczanie kary za spóźniony zwrot według stawki dziennej,
- oznaczanie kary jako rozliczonej przez pracownika biblioteki,
- przegląd własnych kar przez czytelnika,
- przeglądanie powiadomień, filtrowanie ich, oznaczanie jako przeczytane, oznaczanie wszystkich jako przeczytane oraz usuwanie własnych powiadomień.

6. Zamówienia, panel operacyjny i administracja:
- tworzenie zamówień przez bibliotekarza lub administratora dla książek istniejących w katalogu oraz dla nowych tytułów spoza katalogu,
- obsługa statusów zamówień,
- operacyjny dashboard z licznikami i listami danych systemowych dla bibliotekarza i administratora,
- przegląd listy użytkowników i ich aktywności,
- graficzny CRUD użytkowników dostępny wyłącznie dla administratora,
- graficzny CRUD książek dostępny wyłącznie dla administratora.

7. Dane katalogowe i egzemplarze:
- backend udostępnia operacje CRUD dla książek, autorów, wydawców, kategorii, lokalizacji i egzemplarzy,
- frontend aktywnie wykorzystuje te dane w trybie przeglądania i raportowania, a dla administratora udostępnia pełny moduł CRUD dla użytkowników i książek.

Poza zakresem aktualnego repozytorium pozostają:
- osobna aplikacja mobilna,
- integracja z zewnętrznymi bibliotekami lub zewnętrznymi katalogami bibliograficznymi,
- obsługa e-booków i audiobooków,
- zewnętrzna bramka płatności dla kar,
- powiadomienia e-mail lub SMS,
- wbudowany czat z bibliotekarzem,
- automatyczne blokowanie kont użytkowników,
- zaawansowana analityka i raportowanie eksportowe,
- wielojęzyczność interfejsu.
```

## 2.1.1. Gość

```text
Gość to anonimowy użytkownik odwiedzający aplikację bez logowania. W aktualnym repozytorium ma on dostęp do publicznej części systemu, czyli do katalogu książek, przeglądu kategorii oraz szczegółów wybranej pozycji. Może wyszukiwać książki, sprawdzać ich opis, autorów, wydawcę, numer EAN, lokalizację egzemplarzy i aktualny status dostępności.

Gość nie ma dostępu do profilu, powiadomień, wypożyczeń, kar, kolejki rezerwacji ani panelu operacyjnego. Jeżeli spróbuje wejść do widoków wymagających autoryzacji, zostaje przekierowany do ekranu logowania. Z poziomu interfejsu może natomiast przejść do logowania albo rejestracji i po założeniu konta stać się czytelnikiem.
```

## 2.1.2. Czytelnik (Klient)

```text
Czytelnik to zarejestrowany i zalogowany użytkownik końcowy systemu. Korzysta z tych samych funkcji publicznych co gość, a dodatkowo otrzymuje dostęp do modułów samoobsługowych: własnego profilu, listy wypożyczeń, kolejki rezerwacji, kar oraz powiadomień.

W aktualnym repozytorium czytelnik może tworzyć rezerwacje książek, anulować własne rezerwacje, śledzić pozycję w kolejce i szacowaną datę gotowości, przeglądać własne wypożyczenia, przedłużać własne aktywne wypożyczenia o pełne tygodnie, przeglądać własne kary, a także zarządzać własną listą powiadomień. Może również edytować własne dane profilowe i przeglądać aktualne podsumowanie konta.

Czytelnik nie ma dostępu do panelu operacyjnego, listy wszystkich użytkowników, modułu zamówień ani do operacji zastrzeżonych dla pracownika biblioteki, takich jak tworzenie wypożyczeń, realizacja rezerwacji czy rozliczanie kar.
```

## 2.1.3. Bibliotekarz

```text
Bibliotekarz to pracownik biblioteki odpowiedzialny za operacyjną obsługę obiegu książek. Ma on dostęp do wszystkich funkcji czytelnika oraz do modułów pracowniczych związanych z wypożyczeniami, realizacją rezerwacji, karami, zamówieniami i panelem operacyjnym.

Bibliotekarz może przeglądać listy użytkowników, wypożyczeń, rezerwacji, kar, zamówień, powiadomień i danych katalogowych z poziomu panelu operacyjnego. Może tworzyć wypożyczenia, rejestrować zwroty, oznaczać wypożyczenia jako przeterminowane, wydłużać terminy zwrotu, realizować rezerwacje, rozliczać kary oraz obsługiwać zamówienia książek.

Bibliotekarz nie ma prawa tworzyć, modyfikować ani usuwać kont użytkowników oraz rekordów książek z poziomu interfejsu administracyjnego. Te operacje są zastrzeżone dla administratora.
```

## 2.1.4. Administrator

```text
Administrator to uprzywilejowany pracownik biblioteki, który posiada wszystkie możliwości bibliotekarza, a dodatkowo odpowiada za utrzymanie spójności danych użytkowników i bazy książek. Jest to osobny aktor systemowy z własnym zakresem uprawnień.

Administrator ma dostęp do operacyjnego dashboardu, modułu zamówień, list użytkowników oraz administracyjnych ekranów CRUD dostępnych pod dedykowanymi trasami. Z poziomu aplikacji webowej może tworzyć, edytować i usuwać konta użytkowników, a także tworzyć, edytować i usuwać rekordy książek.

Na poziomie backendu wyłącznie administrator może wykonywać operacje zapisu i usuwania dotyczące użytkowników oraz katalogu książek. Dzięki temu bibliotekarz pozostaje pracownikiem operacyjnym, a administrator przejmuje funkcje zarządzania danymi systemu.
```

## 2.2. Założenia i zależności

```text
Założenia:
1. System jest aplikacją webową i do poprawnej pracy wymaga nowoczesnej przeglądarki oraz dostępu do sieci.
2. Poprawność informacji o dostępności książek zależy od bieżącego utrzymania danych katalogowych, lokalizacji egzemplarzy, statusów wypożyczeń i rezerwacji przez pracowników biblioteki.
3. Powiadomienia w aktualnej wersji projektu są powiadomieniami wewnętrznymi w aplikacji. Repozytorium nie zawiera integracji e-mail, SMS ani zewnętrznego kanału push.
4. W środowisku projektowym wykorzystywane są dane demo przygotowywane komendą seedującą, co pozwala odtwarzać powtarzalny stan testowy.

Zależności:
1. Warstwa frontendowa jest oparta na Angularze i komunikuje się z backendem wyłącznie przez REST API.
2. Warstwa backendowa jest oparta na Django i Django REST Framework oraz wymaga działającej relacyjnej bazy PostgreSQL.
3. Środowisko uruchomieniowe projektu jest przygotowane pod Docker Compose, który orkiestruje kontenery `db`, `backend` i `web`.
4. Uwierzytelnianie zależy od podpisywanych tokenów dostępu i odświeżania oraz od ciasteczek HTTP-only utrzymywanych przez backend.
5. Projekt nie jest zależny od zewnętrznej bramki płatności, zewnętrznego katalogu bibliograficznego ani systemu poczty elektronicznej.
6. System powinien być prowadzony zgodnie z zasadami ochrony danych osobowych, ponieważ przetwarza dane użytkowników, historię wypożyczeń, rezerwacji, kar i powiadomień.
```

## 3.1. Moduł przeglądania katalogu książek

```text
Moduł przeglądania katalogu książek jest dostępny publicznie, także dla gościa. W aktualnym repozytorium umożliwia on przeglądanie listy książek, wyszukiwanie tekstowe po metadanych oraz przechodzenie do szczegółów wybranej pozycji. Frontend udostępnia również osobny widok przeglądania książek według kategorii.

Na poziomie backendu wyszukiwarka obsługuje tytuł, numer EAN, opis, nazwę wydawcy, imię i nazwisko autora oraz nazwę kategorii. W aktualnym interfejsie użytkownika aktywnie wykorzystywane są przede wszystkim wyszukiwanie tekstowe i przeglądanie po kategorii. Repozytorium nie zawiera rozbudowanego formularza filtrowania po roku wydania, języku ani złożonego sortowania wielokryterialnego.

Szczegóły książki obejmują opis, autorów, wydawcę, rok wydania, EAN, liczbę egzemplarzy, status dostępności, pozycje zajęte przez kolejkę oraz lokalizacje egzemplarzy. Dla książek z aktywną kolejką system rozróżnia egzemplarze fizycznie dostępne od egzemplarzy, które są już zarezerwowane dla oczekujących czytelników.
```

## 3.2. Moduł autoryzacji operacji

```text
Moduł autoryzacji operacji obejmuje rejestrację, logowanie, wylogowanie, odświeżanie sesji, pobieranie danych bieżącego użytkownika oraz ochronę widoków i endpointów zależnie od roli. Frontend wykorzystuje cztery guardy: `guestGuard`, `authGuard`, `staffGuard` oraz `adminGuard`, natomiast backend kontroluje dostęp za pomocą klas uprawnień i sprawdzania roli użytkownika.

Nowy użytkownik może zarejestrować wyłącznie konto czytelnika. Role bibliotekarza i administratora nie są nadawane przez publiczny formularz rejestracji. Mogą zostać przypisane wyłącznie w ramach administracyjnego modułu zarządzania użytkownikami. Po zalogowaniu użytkownik otrzymuje token dostępu i token odświeżania oraz odpowiednie ciasteczka HTTP-only, które służą do utrzymania sesji.

W aktualnym repozytorium czytelnik ma dostęp tylko do własnych danych, bibliotekarz do modułów operacyjnych całego systemu, a administrator dodatkowo do zapisu i usuwania użytkowników oraz książek. Rozdzielenie tych ról jest egzekwowane zarówno na poziomie routingu frontendu, jak i klas uprawnień backendu.
```

## 3.3. Moduł lokalizacji zbiorów

```text
Moduł lokalizacji zbiorów przechowuje informacje o położeniu egzemplarzy w bibliotece w postaci półki, sekcji i piętra. Każdy egzemplarz może być powiązany z konkretną lokalizacją, a etykieta lokalizacji jest prezentowana w szczegółach książki oraz w panelu operacyjnym.

Backend udostępnia katalog lokalizacji oraz możliwość powiązania ich z egzemplarzami. Frontend aktywnie wykorzystuje te dane do prezentacji użytkownikowi informacji o miejscu przechowywania egzemplarza, ale nie zawiera osobnego, pełnego edytora lokalizacji z poziomu publicznego interfejsu.

Moduł ma charakter wspierający wobec katalogu i egzemplarzy. Jego główną funkcją w aktualnym repozytorium jest zapewnienie wiarygodnej informacji o tym, gdzie w bibliotece znajduje się dany egzemplarz.
```

## 3.4. Moduł cyklu życia wypożyczenia

```text
Moduł cyklu życia wypożyczenia obsługuje utworzenie wypożyczenia, jego przedłużenie, oznaczanie jako przeterminowane oraz rejestrację zwrotu. Utworzenie nowego wypożyczenia jest operacją pracownika biblioteki i powoduje oznaczenie egzemplarza jako niedostępnego. Jeżeli termin zwrotu nie zostanie podany jawnie, system ustawia domyślnie okres 7 dni.

Czytelnik może przeglądać własne wypożyczenia i przedłużać własne aktywne pozycje, natomiast pracownik biblioteki może wykonywać te operacje dla całego systemu. Przedłużenia są realizowane wyłącznie o pełne tygodnie. Repozytorium nie zawiera mechanizmu samoobsługowego wypożyczenia przez czytelnika bez udziału pracownika biblioteki.

Zwrot wypożyczenia zwalnia egzemplarz, aktualizuje status wypożyczenia oraz w razie spóźnienia uruchamia proces naliczenia kary i wygenerowania powiadomienia. Dzięki temu moduł wypożyczeń jest ściśle powiązany z modułem kar i powiadomień.
```

## 3.5. Moduł kolejkowania i estymacji czasu

```text
Moduł kolejkowania i estymacji czasu odpowiada za tworzenie rezerwacji, wyznaczanie pozycji w kolejce oraz obliczanie szacowanej daty gotowości książki. Czytelnik może zarezerwować książkę i śledzić jej status w widoku kolejki. System wylicza pozycję w kolejce oraz estymację gotowości z krokiem 7 dni.

W aktualnym repozytorium egzemplarz może być fizycznie dostępny, ale jednocześnie logicznie zajęty przez wcześniejszą pozycję w kolejce. Z tego powodu frontend prezentuje takie egzemplarze jako zajęte, a nie jako dostępne od ręki. Pracownik biblioteki może zrealizować rezerwację dopiero wtedy, gdy jest ona gotowa do wydania i znajduje się na właściwym miejscu w kolejce.

Repozytorium nie zawiera osobnego harmonogramu, który automatycznie wygasza rezerwacje lub przesuwa kolejkę w tle. Status `expired` jest obsługiwany w modelu i interfejsie, ale aktualna logika biznesowa koncentruje się na tworzeniu, anulowaniu i ręcznej realizacji rezerwacji.
```

## 3.6. Moduł systemu powiadomień

```text
Moduł powiadomień służy do prezentowania użytkownikowi komunikatów systemowych związanych z działaniem biblioteki. W aktualnym repozytorium użytkownik może przeglądać listę powiadomień, filtrować je według stanu przeczytania, oznaczać pojedyncze pozycje jako przeczytane, oznaczać wszystkie jako przeczytane oraz usuwać własne powiadomienia.

Powiadomienia są generowane wewnątrz systemu przy wybranych zdarzeniach biznesowych, przede wszystkim przy naliczeniu kary po spóźnionym zwrocie, rozliczeniu kary oraz realizacji rezerwacji jako wypożyczenia. Model danych i interfejs przewidują typy takie jak `loan_due`, `reservation_ready`, `fine_issued`, `order_update` i `system`, jednak aktualne repozytorium nie zawiera osobnego harmonogramu automatycznie tworzącego przypomnienia o zbliżającym się terminie zwrotu.

Pracownik biblioteki widzi w widokach operacyjnych pełną pulę powiadomień systemowych, a czytelnik tylko własne powiadomienia. Dzięki temu moduł pełni funkcję informacyjną zarówno dla użytkownika końcowego, jak i dla obsługi systemu.
```

## 3.7. Moduł kontroli stanu fizycznego

```text
Moduł kontroli stanu fizycznego dotyczy egzemplarzy książek, a nie abstrakcyjnych tytułów. W aktualnym repozytorium stan egzemplarza opisują pola `condition` oraz `available`. System obsługuje stany `new`, `good`, `worn` i `damaged`, a dodatkowo rozróżnia egzemplarze dostępne i niedostępne.

Frontend prezentuje stan egzemplarzy w szczegółach książki i w panelu operacyjnym. Backend udostępnia operacje CRUD dla egzemplarzy i pozwala filtrować je po książce, lokalizacji, stanie i dostępności. Repozytorium nie zawiera osobnego workflow zgłaszania uszkodzeń przez czytelnika, statusu `lost` ani statusu `w renowacji`, dlatego te pojęcia nie powinny być opisywane jako aktywnie zaimplementowane funkcje.

W praktyce moduł wspiera ocenę, czy egzemplarz może wejść do obiegu. Egzemplarze uszkodzone nie mogą zostać wypożyczone, a ich stan jest brany pod uwagę przy prezentowaniu informacji o dostępności.
```

## 3.8. Moduł zarządzania karami

```text
Moduł zarządzania karami jest ściśle związany z obsługą spóźnionych zwrotów. W aktualnym repozytorium kara jest naliczana automatycznie podczas rejestracji zwrotu przeterminowanego wypożyczenia. Kwota kary wynika z liczby dni opóźnienia i stawki dziennej 2,50 PLN.

Czytelnik może przeglądać własne kary oraz ich status. Pracownik biblioteki widzi pełną listę kar, może filtrować je według statusu opłacenia i oznaczać daną karę jako rozliczoną. Rozliczenie kary nie jest zintegrowane z zewnętrzną płatnością online, tylko polega na zmianie statusu w systemie.

Aktualne repozytorium nie zawiera mechanizmu automatycznego blokowania wypożyczeń lub rezerwacji przy nieopłaconej karze. Dokumentacja nie powinna więc opisywać takiego ograniczenia jako gotowej funkcji systemu.
```

## 3.9. Moduł zamówień

```text
Moduł zamówień jest przeznaczony dla pracownika biblioteki i służy do planowania zakupu książek. W aktualnym repozytorium pracownik może utworzyć zamówienie zarówno dla książki istniejącej w katalogu, jak i dla zupełnie nowego tytułu spoza katalogu, podając metadane takie jak tytuł, autorzy, wydawca, EAN, rok wydania i opis.

System obsługuje statusy zamówień `draft`, `submitted`, `processing`, `received` i `cancelled`. Z poziomu aktualnego interfejsu użytkownika pracownik może tworzyć zamówienia, składać je, oznaczać jako odebrane oraz anulować. Dodatkowo lista zamówień wspiera filtrowanie po statusie i prezentuje podstawowe dane zamawianej pozycji.

Repozytorium nie zawiera publicznego modułu zgłaszania propozycji zakupu przez czytelnika. W dokumentacji moduł zamówień należy więc opisywać jako narzędzie operacyjne pracownika biblioteki, a nie jako funkcję samoobsługową czytelnika.
```

## 3.10. Moduł profilu, panelu operacyjnego i administracji

```text
Aktualne repozytorium zawiera trzy dodatkowe obszary funkcjonalne, które nie powinny być pomijane w opisie przypadków użycia: profil użytkownika, panel operacyjny pracownika biblioteki oraz administracyjne widoki zarządzania użytkownikami i książkami.

Moduł profilu pozwala zalogowanemu użytkownikowi pobrać i zaktualizować własne dane oraz sprawdzić aktualne podsumowanie konta. Dla czytelnika obejmuje ono własne aktywne wypożyczenia, rezerwacje, kary i powiadomienia. Dla bibliotekarza i administratora podsumowanie odzwierciedla widoczny zakres danych systemowych.

Panel operacyjny pracownika biblioteki agreguje liczniki i listy dla książek, wypożyczeń, zaległości, użytkowników, zamówień, kar i powiadomień. Dodatkowo repozytorium udostępnia listę użytkowników z podsumowaniem aktywności oraz osobne ekrany zarządzania użytkownikami i książkami. Widoki administracyjne są dostępne wyłącznie dla administratora i umożliwiają tworzenie, edycję oraz usuwanie użytkowników i książek. Te obszary stanowią aktywnie używaną część aplikacji i powinny być wymienione w dokumentacji jako osobne przypadki użycia.
```

## 4.1. Wymagania dotyczące wydajności

```text
W aktualnej implementacji system wykorzystuje paginację w głównych listach danych po stronie frontendowej i backendowej, co ogranicza rozmiar pojedynczych odpowiedzi API i poprawia responsywność interfejsu. Dotyczy to między innymi katalogu, wypożyczeń, rezerwacji, kar, powiadomień, użytkowników oraz sekcji panelu operacyjnego.

Wymaganiem wydajnościowym dla obecnej wersji projektu jest utrzymanie płynnej obsługi typowych operacji katalogowych i obiegowych przy pracy na danych demo oraz przy standardowym obciążeniu uczelnianego projektu zespołowego. Wyszukiwanie i filtrowanie powinny zwracać wynik bez zauważalnego opóźnienia dla użytkownika końcowego, a przeładowanie kluczowych widoków nie powinno wymagać ręcznej synchronizacji danych poza przewidzianymi przyciskami odświeżania.

Repozytorium nie zawiera osobnej warstwy cache ani mechanizmów skalowania poziomego. Dokumentacja wydajnościowa powinna więc odwoływać się do bieżącego rozmiaru i architektury projektu, a nie do założeń systemu wysokiego obciążenia.
```

## 4.2. Wymagania dotyczące bezpieczeństwa

```text
Bezpieczeństwo dostępu do systemu opiera się na uwierzytelnianiu tokenowym i kontroli ról. Backend wystawia endpointy logowania, odświeżania sesji, wylogowania i pobierania danych użytkownika, a frontend chroni widoki za pomocą guardów zależnych od statusu sesji i roli użytkownika.

Aktualna implementacja wykorzystuje podpisywane tokeny dostępu i odświeżania oraz ciasteczka HTTP-only. Role `reader`, `librarian` i `admin` ograniczają dostęp do wybranych operacji zarówno w warstwie frontendowej, jak i backendowej. Czytelnik pracuje wyłącznie na własnych danych, bibliotekarz na modułach operacyjnych całego systemu, a administrator dodatkowo na administracyjnych modułach CRUD użytkowników i książek.

Jednocześnie należy uczciwie zaznaczyć, że obecna wersja repozytorium korzysta z uproszczonego modelu haseł odpowiedniego dla środowiska projektowego. Przed wdrożeniem produkcyjnym mechanizm ten powinien zostać zastąpiony bezpiecznym hashowaniem haseł, polityką złożoności oraz dodatkowymi zabezpieczeniami transportu i sesji.
```

## 4.3. Wymagania dotyczące niezawodności i dostępności

```text
System opiera się na trzech współpracujących usługach: bazie PostgreSQL, backendzie Django oraz frontendzie Angular. W środowisku projektowym są one uruchamiane i nadzorowane przez Docker Compose. Dostępność aplikacji jest więc bezpośrednio zależna od poprawnego działania tych usług oraz komunikacji między nimi.

Stan biznesowy systemu jest przechowywany w relacyjnej bazie danych. Dotyczy to użytkowników, katalogu, egzemplarzy, wypożyczeń, rezerwacji, kar, zamówień i powiadomień. Repozytorium zawiera również komendę seedującą dane demo, dzięki której można odtworzyć powtarzalne środowisko testowe.

Aktualna wersja projektu nie implementuje architektury wysokiej dostępności, kolejek komunikatów, mechanizmów failover ani osobnych workerów tła. Wymagania niezawodnościowe powinny więc opisywać pojedynczą instancję aplikacji webowej wspartą przez bazę danych, a nie system rozproszony.
```

## 4.4. Wymagania dotyczące użyteczności i interfejsu użytkownika

```text
Interfejs użytkownika jest responsywną aplikacją webową dostosowaną do pracy na komputerach i urządzeniach mobilnych. Główna nawigacja opiera się na publicznym katalogu, widokach czytelnika, panelu operacyjnym bibliotekarza oraz administracyjnych modułach CRUD dla użytkowników i książek. Układ aplikacji jest spójny dla wszystkich ról, a dostęp do poszczególnych tras zależy od guardów i stanu sesji.

Istotnym wymaganiem użytecznościowym jest zachowanie prostych, jednoznacznych przepływów: wyszukiwania książki, przejścia do szczegółów, utworzenia rezerwacji, przeglądu kolejki, przedłużenia wypożyczenia, sprawdzenia kar i zarządzania powiadomieniami. Z poziomu logowania możliwa jest także rejestracja, a interfejs wspiera przekierowanie użytkownika z powrotem do docelowej strony po zalogowaniu.

W aktualnym repozytorium nie ma modułu prowadzenia użytkownika po trasie do regału ani złożonego kreatora obsługi biblioteki. Opis użyteczności powinien więc opierać się na rzeczywiście dostępnych widokach: katalogu, kolejce, wypożyczeniach, karach, powiadomieniach, profilu, zamówieniach, panelu operacyjnym oraz administracyjnych ekranach zarządzania użytkownikami i książkami.
```

## 5.1. Diagram przypadków użycia (ogólny)

### Opis sekcji do wklejenia

```text
Diagram przypadków użycia dla aktualnej wersji systemu powinien pokazywać czterech aktorów: Gościa, Czytelnika, Bibliotekarza oraz Administratora. Gość korzysta wyłącznie z części publicznej, Czytelnik z modułów samoobsługowych, Bibliotekarz z funkcji operacyjnych, a Administrator z funkcji operacyjnych i administracyjnych.

Diagram powinien obejmować nie tylko katalog, wypożyczenia, rezerwacje i kary, ale również publiczne przeglądanie systemu przez gościa, obsługę profilu, powiadomienia, zamówienia, panel operacyjny oraz administracyjne CRUD użytkowników i książek. To właśnie te obszary są aktywnie obecne w repozytorium i są widoczne w trasach frontendu oraz w endpointach backendu.
```

### Lista aktorów i dymków do narysowania w DPU

```text
Aktorzy:
1. Gość
2. Czytelnik
3. Bibliotekarz
4. Administrator

Dymki (przypadki użycia) rekomendowane do diagramu:
1. Przeglądanie katalogu i kategorii
2. Wyświetlanie szczegółów książki i dostępności egzemplarzy
3. Rejestracja i logowanie
4. Zarządzanie profilem użytkownika
5. Tworzenie i anulowanie rezerwacji
6. Przeglądanie kolejki i estymacji gotowości
7. Przeglądanie i przedłużanie wypożyczeń
8. Przeglądanie i rozliczanie kar
9. Obsługa powiadomień
10. Zarządzanie zamówieniami
11. Panel operacyjny i przegląd użytkowników
12. Zarządzanie użytkownikami
13. Zarządzanie książkami

Powiązania aktorów z przypadkami użycia:
- Gość: 1, 2, 3
- Czytelnik: 1, 2, 3, 4, 5, 6, 7, 8, 9
- Bibliotekarz: 1, 2, 4, 5, 6, 7, 8, 9, 10, 11
- Administrator: 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
```

### Wypełnienie placeholderów „Przypadek użycia nr 1-13”

```text
Przypadek użycia nr 1: Przeglądanie katalogu i kategorii przez gościa lub zalogowanego użytkownika.
Przypadek użycia nr 2: Wyświetlanie szczegółów książki wraz z lokalizacją egzemplarzy, dostępnością i informacją o kolejce.
Przypadek użycia nr 3: Rejestracja nowego konta czytelnika oraz logowanie do systemu.
Przypadek użycia nr 4: Zarządzanie profilem użytkownika i podglądem aktualnego podsumowania konta.
Przypadek użycia nr 5: Tworzenie rezerwacji i anulowanie własnej rezerwacji.
Przypadek użycia nr 6: Przeglądanie kolejki rezerwacji oraz szacowanej daty gotowości.
Przypadek użycia nr 7: Przeglądanie wypożyczeń i przedłużanie aktywnych wypożyczeń.
Przypadek użycia nr 8: Obsługa zwrotu, oznaczanie wypożyczenia jako przeterminowanego i naliczanie kary.
Przypadek użycia nr 9: Przeglądanie, oznaczanie i usuwanie powiadomień.
Przypadek użycia nr 10: Tworzenie i obsługa zamówień książek przez bibliotekarza lub administratora.
Przypadek użycia nr 11: Korzystanie z panelu operacyjnego i przeglądu użytkowników przez pracownika biblioteki.
Przypadek użycia nr 12: Zarządzanie użytkownikami przez administratora.
Przypadek użycia nr 13: Zarządzanie książkami przez administratora.
```

## 5.2. Diagramy klas

```text
Diagram klas i diagram encji powinny zostać rozszerzone względem obecnego opisu. Oprócz encji `books`, `authors`, `publishers`, `categories`, `copies`, `locations`, `users`, `loans`, `reservations` i `fines` należy obowiązkowo uwzględnić także encje `orders` oraz `notifications`, ponieważ są one aktywnie wykorzystywane w aktualnym repozytorium.

Centralną rolę pełni encja użytkownika (`LibraryUser`) z polem roli (`reader`, `librarian`, `admin`). Książka (`Book`) ma relację wiele-do-jednego z wydawcą (`Publisher`), relacje wiele-do-wielu z autorami (`Author`) i kategoriami (`Category`) realizowane przez tabele pośrednie `book_authors` i `book_categories`, a także relację jeden-do-wielu z egzemplarzami (`Copy`). Egzemplarz może być powiązany z lokalizacją (`Location`) i stanowi podstawę dla wypożyczenia (`Loan`).

Rezerwacja (`Reservation`) wiąże użytkownika z książką i przechowuje status, datę ważności, pozycję w kolejce i estymowaną gotowość. Kara (`Fine`) jest powiązana jednocześnie z wypożyczeniem i użytkownikiem. Zamówienie (`Order`) jest powiązane z książką i opcjonalnie z użytkownikiem, który je utworzył jako pracownik biblioteki. Powiadomienie (`Notification`) jest powiązane z użytkownikiem i posiada opcjonalne pola `related_object_type` oraz `related_object_id`, które pozwalają odnieść je do innych obiektów systemu.

W diagramie warto również pokazać najważniejsze stany domenowe jako wyliczenia: role użytkownika, statusy wypożyczeń, statusy rezerwacji, statusy zamówień, typy powiadomień oraz stan egzemplarza. To właśnie te wyliczenia sterują logiką biznesową backendu i widokami frontendu.
```

## 5.3. Diagramy sekwencji (dla kluczowych procesów)

```text
Diagramy sekwencji powinny opisywać najważniejsze przepływy między aktorem, frontendem Angular, backendem Django REST API oraz bazą PostgreSQL. W aktualnej wersji systemu szczególnie istotne są następujące procesy:

1. Rejestracja i logowanie użytkownika:
Gość otwiera ekran logowania, przechodzi do formularza rejestracji, wypełnia dane, frontend wysyła żądanie do endpointu rejestracji, backend tworzy konto czytelnika, zwraca profil i tokeny sesji, a następnie frontend przekierowuje użytkownika do katalogu.

2. Utworzenie rezerwacji i wejście do kolejki:
Czytelnik otwiera szczegóły książki, wybiera rezerwację, frontend wysyła żądanie do endpointu rezerwacji, backend zapisuje rezerwację, oblicza pozycję w kolejce i datę gotowości, po czym frontend odświeża widok książki i kolejki.

3. Realizacja rezerwacji przez pracownika biblioteki:
Pracownik biblioteki otwiera widok kolejki, wybiera gotową rezerwację, frontend wysyła żądanie realizacji, backend sprawdza kolejność w kolejce i dostępność egzemplarza, tworzy wypożyczenie, zmienia status rezerwacji, generuje powiadomienie i odsyła zaktualizowane dane.

4. Zwrot przeterminowanego wypożyczenia i naliczenie kary:
Pracownik wybiera wypożyczenie do zwrotu, frontend wysyła żądanie zwrotu, backend zwalnia egzemplarz, oblicza kwotę kary, zapisuje rekord kary, generuje powiadomienie i zwraca zaktualizowany stan wypożyczenia.

5. Utworzenie zamówienia dla nowego tytułu spoza katalogu:
Pracownik otwiera formularz zamówienia, wpisuje metadane książki, frontend wysyła żądanie utworzenia zamówienia, backend tworzy lub uzupełnia rekord książki, zapisuje autorów i wydawcę, a następnie tworzy rekord zamówienia w statusie szkicu.

6. Odczyt i aktualizacja profilu z bieżącym podsumowaniem:
Zalogowany użytkownik otwiera profil, frontend pobiera dane z endpointu profilu, backend wylicza aktualne agregaty widoczne dla tej roli, a po zapisaniu zmian zwraca ponownie świeże dane wraz z aktualnym podsumowaniem.

7. Administracyjne zarządzanie użytkownikiem lub książką:
Administrator otwiera ekran zarządzania, frontend pobiera aktualne listy i słowniki pomocnicze, administrator zapisuje formularz tworzenia albo edycji, frontend wysyła żądanie do endpointu administracyjnego, backend sprawdza rolę `admin`, zapisuje zmiany i zwraca odświeżony rekord, a następnie frontend aktualizuje listę bez zmiany kontekstu pracy.

Właśnie te procesy najlepiej oddają logikę repozytorium i powinny stanowić podstawę diagramów sekwencji w dokumentacji.
```

## 7. Plan testów

### 7.1. Testy jednostkowe i komponentowe

```text
Plan testów dla aktualnego repozytorium powinien uwzględniać trzy warstwy: testy backendowe Django/DRF, testy frontendowe Angular oraz scenariusze end-to-end Playwright. W samym repozytorium znajdują się obecnie:
- 53 backendowe przypadki testowe w katalogu `backend/library/tests`,
- 56 scenariuszy frontendowych w plikach `*.spec.ts` w katalogu `web/src/app`,
- 5 scenariuszy Playwright w katalogu `web/e2e`.

Backendowe testy automatyczne obejmują przede wszystkim:
1. `test_authentication.py`:
- rejestrację użytkownika,
- logowanie i odświeżanie sesji,
- obsługę ciasteczek sesyjnych,
- pobieranie danych bieżącego użytkownika,
- poprawność agregatów w profilu i ich odświeżanie po zmianach,
- administracyjne tworzenie użytkownika oraz blokadę tej operacji dla bibliotekarza.

2. `test_catalog_api.py`:
- poprawność endpointu root API,
- listowanie książek z metadanymi katalogowymi,
- snapshot dostępności książki,
- tworzenie i usuwanie książki przez administratora,
- odrzucenie tworzenia książki przez bibliotekarza,
- kontrolę uprawnień dla operacji katalogowych.

3. `test_circulation_api.py`:
- tworzenie wypożyczenia i oznaczanie egzemplarza jako niedostępnego,
- odrzucenie wypożyczenia uszkodzonego egzemplarza,
- zwrot z automatycznym naliczeniem kary,
- przedłużanie wypożyczeń,
- pozycję w kolejce rezerwacji i estymowaną datę gotowości,
- realizację rezerwacji przez pracownika,
- oznaczanie powiadomień jako przeczytane,
- usuwanie własnych powiadomień,
- obsługę statusów zamówień,
- tworzenie zamówienia dla tytułu spoza katalogu,
- rozliczanie kar.

4. `test_validation_and_errors.py`:
- walidację brakujących pól,
- odrzucenie duplikatu rezerwacji,
- odrzucenie niepoprawnej ilości zamówienia,
- ochronę endpointów wymagających autoryzacji lub roli pracownika.

5. `test_demo_data_restore.py`:
- odtworzenie pełnego zestawu danych demo,
- poprawność liczby książek, egzemplarzy, rezerwacji, kar i zamówień,
- kompletność wydawców i numerów EAN,
- zgodność przykładowych rekordów ze scenariuszem seedowania.

Frontendowe testy komponentowe obejmują między innymi:
- formularz logowania i rejestracji,
- widok katalogu i szczegółów książki,
- kolejkę rezerwacji,
- listę wypożyczeń,
- listę kar,
- listę powiadomień,
- profil użytkownika,
- listę zamówień,
- dashboard, listę użytkowników i ekran zarządzania książkami,
- współdzielone komponenty takie jak modal, paginacja, tabela, alert, input i button.

Szczególnie ważne scenariusze frontendowe obecne w repozytorium to:
- walidacja daty rezerwacji i obsługa błędów rezerwacji,
- poprawne oznaczanie egzemplarza jako `Zajęty`, gdy fizycznie wolny egzemplarz jest już zajęty przez kolejkę,
- oznaczanie powiadomień jako przeczytane i usuwanie ich po potwierdzeniu,
- tworzenie zamówienia zarówno dla książki z katalogu, jak i dla nowego tytułu spoza katalogu,
- odświeżanie profilu z aktualnym podsumowaniem po zapisie zmian,
- separację ścieżek administratora i bibliotekarza,
- administracyjne formularze CRUD użytkowników i książek.
```

### 7.2. Testy systemowe i testy manualne

```text
Testy systemowe dla aktualnej wersji projektu powinny łączyć scenariusze automatyczne Playwright z ręczną weryfikacją pracy całego systemu na danych demo. W repozytorium znajdują się następujące scenariusze end-to-end:

1. `smoke.spec.ts`:
- rejestracja nowego czytelnika z poziomu ekranu logowania,
- przejście do katalogu po udanej rejestracji,
- wyświetlenie szczegółów książki i utworzenie rezerwacji,
- załadowanie kolejki rezerwacji i anulowanie pozycji,
- wyrenderowanie dashboardu pracownika na danych API.

2. `live-api.spec.ts`:
- rejestracja czytelnika i załadowanie katalogu z rzeczywistego backendu,
- test uruchamiany warunkowo przy włączonym środowisku live API.

W ramach testów manualnych, wykonanych na środowisku z danymi demo, przeprowadzono następujące scenariusze:

1. Test publicznego katalogu przez gościa:
Gość otworzył stronę `/catalog`, wyszukał książkę po fragmencie tytułu i sprawdził, że bez logowania może przejść do szczegółów książki oraz do widoku kategorii. Wynik: pozytywny.

2. Test ochrony tras wymagających autoryzacji:
Gość próbował wejść na `/profile` i `/notifications`. System przekierował go na ekran logowania z zachowaniem adresu docelowego. Wynik: pozytywny.

3. Test rejestracji i logowania czytelnika:
Utworzono nowe konto, a następnie wykonano logowanie przy użyciu przycisku Enter. Po zalogowaniu użytkownik został przekierowany do katalogu i otrzymał dostęp do własnych modułów. Wynik: pozytywny.

4. Test rezerwacji i kolejki:
Czytelnik otworzył szczegóły książki, utworzył rezerwację i sprawdził, że pozycja pojawiła się na stronie kolejki wraz z prawidłową estymacją gotowości. Następnie anulował rezerwację. Wynik: pozytywny.

5. Test spójności powiadomień:
Czytelnik otworzył stronę powiadomień i profil użytkownika. Licznik powiadomień w podsumowaniu profilu odpowiadał liczbie powiadomień widocznych dla tej roli. Po oznaczeniu pozycji jako przeczytanej i po usunięciu powiadomienia dane zostały odświeżone poprawnie. Wynik: pozytywny.

6. Test przedłużenia wypożyczenia:
Czytelnik otworzył listę własnych wypożyczeń, przedłużył aktywną pozycję o 7 dni i potwierdził zmianę terminu zwrotu w widoku listy i szczegółów. Wynik: pozytywny.

7. Test zwrotu przeterminowanego wypożyczenia:
Pracownik biblioteki zwrócił przeterminowane wypożyczenie. System zwolnił egzemplarz, utworzył karę według stawki 2,50 PLN za dzień opóźnienia i wygenerował powiadomienie dla czytelnika. Wynik: pozytywny.

8. Test realizacji rezerwacji tylko wtedy, gdy jest gotowa:
Pracownik biblioteki otworzył kolejkę. Dla rezerwacji niegotowej do wydania system pokazał komunikat `Oczekuje na egzemplarz`, a nie przycisk wydania. Dla rezerwacji gotowej system pozwolił utworzyć 7-dniowe wypożyczenie. Wynik: pozytywny.

9. Test tworzenia zamówienia dla nowego tytułu:
Pracownik biblioteki utworzył zamówienie dla książki spoza katalogu, podając tytuł, autorów, wydawcę, EAN, rok wydania i opis. System utworzył zamówienie i powiązany rekord książki. Wynik: pozytywny.

10. Test rozliczenia kary:
Pracownik biblioteki oznaczył karę jako rozliczoną. Po odświeżeniu widoku status kary zmienił się na opłacony, a czytelnik zobaczył aktualny stan w swoim module kar. Wynik: pozytywny.

11. Test dashboardu operacyjnego:
Pracownik biblioteki porównał liczniki i tabele w dashboardzie z listami danych w systemie. Liczby książek, wypożyczeń, kar, zamówień i powiadomień odpowiadały stanowi danych widocznemu w modułach szczegółowych. Wynik: pozytywny.

12. Test rozdzielenia bibliotekarza i administratora:
Bibliotekarz zalogował się do systemu i nie otrzymał pozycji menu prowadzących do administracyjnego CRUD użytkowników oraz książek. Próba wejścia na trasy `/admin/users` i `/admin/books` zakończyła się przekierowaniem do panelu operacyjnego. Wynik: pozytywny.

13. Test administracyjnego CRUD użytkownika i książki:
Administrator utworzył tymczasowe konto użytkownika, zmienił mu rolę, a następnie usunął je z poziomu ekranu zarządzania użytkownikami. W analogiczny sposób utworzył, zedytował i usunął tymczasową książkę z poziomu ekranu zarządzania książkami. Wynik: pozytywny.

Środowisko testowe do testów manualnych przygotowano na danych demo dostarczanych przez komendę `seed_demo_data`, która odtwarza między innymi 100 książek, 110 egzemplarzy, 5 wypożyczeń, 6 rezerwacji, 2 kary i 4 zamówienia.
```

## 8.1. Specyfikacja technologii

```text
Frontend (interfejs użytkownika):
- Język: TypeScript
- Framework: Angular 20
- Routing: Angular Router z lazy loading
- Formularze: Angular Forms
- Stylowanie: Tailwind CSS 4 oraz własne style komponentów
- SSR / serwer frontendowy: Angular SSR + Express
- Testy frontendowe: Jasmine + Karma oraz Playwright

Backend (logika serwera):
- Język: Python
- Framework: Django
- API: Django REST Framework
- Dokumentacja API: drf-spectacular / OpenAPI / Swagger UI
- Uwierzytelnianie: własny mechanizm podpisywanych tokenów oparty o `django.core.signing` oraz ciasteczka HTTP-only
- Dodatkowe biblioteki: django-cors-headers, psycopg2-binary

Baza danych:
- System: PostgreSQL 17

Infrastruktura i uruchomienie:
- Konteneryzacja: Docker
- Orkiestracja lokalna: Docker Compose
- Dane startowe i seed: pliki SQL w katalogu `db` oraz komenda `seed_demo_data` po stronie backendu

Jakość kodu i narzędzia pomocnicze:
- Formatowanie i porządkowanie importów backendu: black, isort
- Testy backendowe: Django test runner
- Testy end-to-end: Playwright
```

## 8.2. Bibliografia

```text
1. Django Software Foundation, Django documentation: https://docs.djangoproject.com/en/5.2/
2. Encode OSS, Django REST Framework documentation: https://www.django-rest-framework.org/
3. Django Software Foundation, Cryptographic signing: https://docs.djangoproject.com/en/5.2/topics/signing/
4. Angular Team, Angular documentation: https://angular.dev/
5. Angular Team, Angular Router documentation: https://angular.dev/guide/routing
6. Angular Team, Angular Forms documentation: https://angular.dev/guide/forms
7. Tailwind Labs, Tailwind CSS documentation: https://tailwindcss.com/docs
8. Playwright Team, Playwright documentation: https://playwright.dev/docs/intro
9. Docker Inc., Docker Compose documentation: https://docs.docker.com/compose/
10. PostgreSQL Global Development Group, PostgreSQL documentation: https://www.postgresql.org/docs/
11. drf-spectacular documentation: https://drf-spectacular.readthedocs.io/
12. Wolski.pro, Diagram przypadków użycia: https://wolski.pro/diagramy-uml/diagram-przypadkw-uzycia/
13. Wolski.pro, Dobre praktyki dla diagramów sekwencji: https://wolski.pro/2012/04/kilka-dobrych-praktyk-dotyczacych-diagramw-sekwencji/
```
