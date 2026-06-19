/**
 * org.ts — aktuelle Organization-ID (Übergangslösung).
 *
 * ⚠️ TODO (Auth→Org, Phase 2): Diese Konstante durch die `organization_id` aus
 * der Auth-Session ersetzen — User-Login → `users`-Tabelle → `organization_id`
 * (JWT Custom Claim). Bis dahin nutzen die Screens die Demo-Org aus dem
 * settings-Seed (Migration 012). Hängt mit dem offenen `useModules`-Punkt
 * zusammen (siehe CHECKLIST.md).
 */

export const DEMO_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";
