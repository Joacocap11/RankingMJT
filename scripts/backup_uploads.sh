#!/usr/bin/env sh
# Tars the RankingMJT uploads named volume to a timestamped archive.
# Works whether the volume is a plain named volume or has been recreated;
# does not require stopping the api container.
#
# Usage: ./scripts/backup_uploads.sh [volume_name]
set -eu

VOLUME=${1:-rankingmjt_uploads}
BACKUP_DIR=${BACKUP_DIR:-backups}
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${VOLUME}_$(date +%Y%m%d_%H%M%S).tar.gz"

docker run --rm \
  -v "${VOLUME}:/data:ro" \
  -v "$(pwd)/${BACKUP_DIR}:/backup" \
  alpine:3.20 \
  tar czf "/backup/$(basename "$file")" -C /data .

printf 'Backup written to %s\n' "$file"
