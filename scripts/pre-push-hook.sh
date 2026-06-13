#!/bin/sh
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   SALES OS — PRE-PUSH CHECKLISTE         ║"
echo "╠══════════════════════════════════════════╣"
echo "║  □ activity_log Eintrag geschrieben?     ║"
echo "║  □ audit_log Eintrag geschrieben?        ║"
echo "║  □ knowledge_base Eintrag angelegt?      ║"
echo "║  □ system_config statt hardcodiert?      ║"
echo "║  □ org_id + RLS + CASCADE gesetzt?       ║"
echo "║  □ api_usage vor AI Calls geprüft?       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Hinweis: git übergibt dem pre-push-Hook die Ref-Liste auf stdin. Die Bestätigung
# muss daher vom Terminal (/dev/tty) gelesen werden, nicht von stdin. Steht KEIN
# Terminal zur Verfügung (automatisierter Push durch Claude Code / CI), wird die
# Checkliste nur angezeigt und der Push NICHT blockiert.
if { true >/dev/tty; } 2>/dev/null; then
  printf "Alles geprüft? (j/n): " > /dev/tty
  read answer < /dev/tty
  if [ "$answer" != "j" ]; then
    echo "Push abgebrochen. Erst Checkliste abarbeiten." > /dev/tty
    exit 1
  fi
fi
exit 0
