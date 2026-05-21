#!/usr/bin/env bash
# Install Pagila into a local PostgreSQL (no Docker).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PAGILA_SRC="${PAGILA_SRC:-$EXAMPLES_DIR/.pagila-src}"
PAGILA_DB="${PAGILA_DB:-pagila}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"

RESET=false
if [[ "${1:-}" == "--reset" ]]; then
  RESET=true
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql nicht gefunden. PostgreSQL installieren, z. B.:"
  echo "  brew install postgresql@16"
  echo "  brew services start postgresql@16"
  exit 1
fi

export PGPASSWORD PGHOST PGPORT

echo "==> Pagila-Quellen holen (GitHub) …"
if [[ ! -f "$PAGILA_SRC/pagila-schema.sql" ]]; then
  rm -rf "$PAGILA_SRC"
  if command -v git >/dev/null 2>&1; then
    git clone --depth 1 https://github.com/devrimgunduz/pagila.git "$PAGILA_SRC"
  else
    tmp="$(mktemp -d)"
    curl -fsSL https://github.com/devrimgunduz/pagila/archive/refs/heads/master.tar.gz \
      | tar -xz -C "$tmp"
    mv "$tmp"/pagila-master "$PAGILA_SRC"
    rm -rf "$tmp"
  fi
fi

echo "==> Rolle $PGUSER (falls nötig) …"
if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  if psql -h "$PGHOST" -p "$PGPORT" -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
    # Peer-/Trust-Auth als aktueller OS-User
    psql -h "$PGHOST" -p "$PGPORT" -d postgres -v ON_ERROR_STOP=1 <<-SQL
      DO \$\$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$PGUSER') THEN
          CREATE ROLE $PGUSER WITH LOGIN SUPERUSER PASSWORD '$PGPASSWORD';
        END IF;
      END
      \$\$;
      ALTER ROLE $PGUSER WITH PASSWORD '$PGPASSWORD';
SQL
  else
    echo "Konnte nicht mit psql verbinden. Läuft PostgreSQL? (brew services start postgresql@16)"
    exit 1
  fi
else
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 \
    -c "ALTER ROLE $PGUSER WITH PASSWORD '$PGPASSWORD';" 2>/dev/null || true
fi

if $RESET; then
  echo "==> Datenbank $PAGILA_DB löschen …"
  dropdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" --if-exists "$PAGILA_DB" 2>/dev/null \
    || psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "DROP DATABASE IF EXISTS $PAGILA_DB;" 2>/dev/null \
    || psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "DROP DATABASE IF EXISTS $PAGILA_DB;"
fi

echo "==> Datenbank $PAGILA_DB anlegen …"
createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PAGILA_DB" 2>/dev/null \
  || psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE $PAGILA_DB;" 2>/dev/null \
  || psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "CREATE DATABASE $PAGILA_DB OWNER $PGUSER;"

echo "==> Schema laden …"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PAGILA_DB" -v ON_ERROR_STOP=1 \
  -f "$PAGILA_SRC/pagila-schema.sql"

echo "==> Daten laden (kann eine Minute dauern) …"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PAGILA_DB" -v ON_ERROR_STOP=1 \
  -f "$PAGILA_SRC/pagila-data.sql"

echo ""
echo "Pagila ist bereit:"
echo "  postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PAGILA_DB"
echo "Prüfen: npm run db:psql  →  \\dt"
