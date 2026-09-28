#!/usr/bin/env sh
# Dumps the RankingMJT Postgres database to a timestamped custom-format
# pg_dump file. Run from the project root (where docker-compose*.yml live).
#
# Usage:
#   POSTGRES_DB=rankingmjt POSTGRES_USER=rankingmjt POSTGRES_PASSWORD=*** \
#     ./scripts/backup_postgres.sh
#
# Or, simpler, sourcing the server-local .env first:
#   set -a; . ./.env; set +a; ./scripts/backup_postgres.sh
set -eu
umask 077

: "${POSTGRES_DB:?Set POSTGRES_DB}"
: "${POSTGRES_USER:?Set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"

BACKUP_DIR=${BACKUP_DIR:-backups}
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).dump"

docker compose exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  db pg_dump --format=custom --no-owner --no-privileges \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$file"

[ -s "$file" ]
printf 'Backup written to %s\n' "$file"
