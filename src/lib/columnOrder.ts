/**
 * reorderColumns — drag-sichere Spalten-Reihenfolge für die geteilte DataTable.
 *
 * Problem: die persistierte `columnOrder` (user_preferences) kann UNVOLLSTÄNDIG sein — z.B.
 * gespeichert, bevor die Set-B-Spalten existierten. Eine nachträglich sichtbar geschaltete Spalte
 * fehlt dann in der gespeicherten Order; ein Drag-Reorder, der direkt auf der gespeicherten Order
 * `indexOf` macht, findet die Spalte nicht (-1) und bricht ab → die Spalte lässt sich nicht ziehen.
 *
 * Lösung: vor dem Verschieben IMMER eine vollständige Reihenfolge über den AKTUELLEN Spaltensatz
 * bilden — gespeicherte, noch existierende IDs zuerst (Reihenfolge erhalten), danach alle übrigen
 * aktuellen IDs in Definitionsreihenfolge. So ist jede aktuell vorhandene Spalte verschiebbar,
 * egal ob Standard oder nachträglich eingeblendet. Das Ergebnis ist wieder vollständig → beim
 * Speichern heilt sich eine veraltete Order selbst.
 *
 * Gibt `null` zurück, wenn nichts zu tun ist (gleiche Spalte, unbekannte IDs) — dann kein setState.
 */
export function completeColumnOrder(currentIds: string[], savedOrder: string[]): string[] {
  return [
    ...savedOrder.filter((id) => currentIds.includes(id)),
    ...currentIds.filter((id) => !savedOrder.includes(id)),
  ];
}

export function reorderColumns(
  currentIds: string[],
  savedOrder: string[],
  draggedId: string,
  targetId: string,
): string[] | null {
  if (draggedId === targetId) return null;
  const order = completeColumnOrder(currentIds, savedOrder);
  const from = order.indexOf(draggedId);
  const to = order.indexOf(targetId);
  if (from < 0 || to < 0) return null;
  order.splice(to, 0, order.splice(from, 1)[0]);
  return order;
}
