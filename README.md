# System Biblioteczny — Projekt Zespołowy

System do zarządzania biblioteką: katalogowanie książek, wypożyczenia, rezerwacje, kary za przetrzymanie, powiadomienia i panel administracyjny.

**Backend:** Django + Django REST Framework + PostgreSQL
**Frontend:** Angular 20
**Uruchomienie:** Docker Compose

## Uruchomienie

Najprościej przez skrypt `start.ahk` (wymaga zainstalowanego [AutoHotkey v2](https://www.autohotkey.com/) oraz Docker Desktop).

Skrypt automatycznie:

1. Uruchomi kontenery (baza PostgreSQL, backend Django, frontend Angular).
2. Otworzy terminal z logami backendu.
3. Wypełnia bazę przykładowymi danymi ze skryptu *seed_demo_data.py*

### Ręcznie (bez AHK)

```bash
docker compose up --build
```

Backend będzie dostępny na `http://localhost:8000/api/`, frontend na `http://localhost:4200/`.

### Demo

Aby ręcznie wypełnić bazę przykładowymi danymi:

```bash
docker compose exec backend python manage.py seed_demo_data
```
