from __future__ import annotations

import os
from pathlib import Path

import django
from django.core.management import call_command
from django.db import connection, transaction


def _load_sql_seed_file(sql_path: Path) -> int:
    sql_content = sql_path.read_text(encoding="utf-8")
    statements = [statement.strip() for statement in sql_content.split(";")]

    executed = 0
    with transaction.atomic():
        with connection.cursor() as cursor:
            for statement in statements:
                if not statement:
                    continue
                cursor.execute(statement)
                executed += 1

    return executed


def main() -> int:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    django.setup()

    project_root = Path(__file__).resolve().parent
    seed_sql = project_root.parent / "db" / "data.sql"
    if not seed_sql.exists():
        raise FileNotFoundError(f"Nie znaleziono pliku seed: {seed_sql}")

    call_command("migrate", interactive=False)
    call_command("flush", interactive=False, verbosity=0)
    executed = _load_sql_seed_file(seed_sql)
    print(f"Seed completed. Executed SQL statements: {executed}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
