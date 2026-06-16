#!/bin/sh
# Schlägt fehl wenn Komponenten falsch platziert sind
echo "=== Structure Check ==="

# Keine .tsx Dateien direkt in shared/ die panel-blocks sein sollten
WRONG=$(find src/components/shared -maxdepth 1 -name "*.tsx" | grep -v -E "(Avatar|LinkedinIcon|Toast|EmptyState|CommandPalette|ICPDonut|BrandLogo|BrandIcons|CommunicationChain|CustomerDrawer|Badge)")

if [ -n "$WRONG" ]; then
  echo "FAIL: Komponenten falsch in shared/ platziert:"
  echo "$WRONG"
  exit 1
fi

echo "PASS: Struktur korrekt"
exit 0
