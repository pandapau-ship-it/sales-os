#!/bin/sh
# Schlägt fehl wenn Komponenten falsch platziert sind
echo "=== Structure Check ==="

# Keine .tsx Dateien direkt in shared/ die panel-blocks sein sollten
WRONG=$(find src/components/shared -maxdepth 1 -name "*.tsx" | grep -v -E "(Avatar|LinkedinIcon|Toast|EmptyState|CommandPalette|ICPDonut|BrandLogo|BrandIcons|CommunicationChain|CustomerDrawer|Badge|TooltipLayer|DataTableCard|ColumnConfigPopover|TableSearch|Stepper|ErrorBoundary|RequiresPermission)")

if [ -n "$WRONG" ]; then
  echo "FAIL: Komponenten falsch in shared/ platziert:"
  echo "$WRONG"
  exit 1
fi

# Performance-Hinweis (WARN, blockt NICHT): Migration mit CREATE TABLE, aber ohne CREATE INDEX
# (Pflicht-Indizes: organization_id + created_at + FK-Felder + deleted_at bei Soft-Delete).
if [ -d supabase/migrations ]; then
  MISSING_IDX=""
  for f in supabase/migrations/*.sql; do
    [ -f "$f" ] || continue
    if grep -qi "create table" "$f" && ! grep -qi "create index" "$f"; then
      MISSING_IDX="$MISSING_IDX $f"
    fi
  done
  if [ -n "$MISSING_IDX" ]; then
    echo "WARN: CREATE TABLE ohne CREATE INDEX (org_id/created_at/FK/deleted_at indizieren):"
    for f in $MISSING_IDX; do echo "  - $f"; done
  fi
fi

echo "PASS: Struktur korrekt"
exit 0
