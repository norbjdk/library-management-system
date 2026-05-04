# Scenariusz integracji API

## Zakres

Scenariusz znajduje się w pliku `web/e2e/live-api.spec.ts` i wykonuje pełny przepływ przez żywe API:

1. otwiera ekran logowania w aplikacji Angular,
2. tworzy nowego czytelnika przez rzeczywisty endpoint `POST /api/auth/register/`,
3. czeka na przejście do katalogu po zapisaniu sesji,
4. potwierdza odpowiedź `200` z rzeczywistego endpointu `GET /api/catalog/books/`.

## Uruchomienie

Aby uruchomić test integracyjny na żywym API, należy włączyć zmienną środowiskową:

```bash
cd /workspace/web
E2E_LIVE_API=1 npm run e2e -- live-api.spec.ts
```

Przy włączonym `E2E_LIVE_API=1` konfiguracja Playwright automatycznie podnosi także backend Django przez `manage.py runserver` i testuje realną komunikację między frontendem oraz backendem.
