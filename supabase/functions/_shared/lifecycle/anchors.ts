/**
 * _shared/lifecycle/anchors.ts — Anker-ID-Auflösung des Evaluators (aus index.ts extrahiert, damit
 * vitest die Query-Filter absichern kann).
 *
 * SOFT-DELETE (Fix FUND 4): Der Read-Layer filtert `deleted_at` seit Change 058 systemweit
 * (`getContacts` db.ts:228, dynamische Listen db.ts:2708/2790). Der Lifecycle-Evaluator (089, später
 * gebaut) hat das Muster nicht übernommen und matchte soft-gelöschte Datensätze → Regeln feuerten Tasks/
 * Tags/Meldungen auf gelöschte Anker. Hier wird das 058-Muster nachgezogen: JEDE Anker-/Quell-Lesestelle
 * bekommt `.is("deleted_at", null)`. Alle drei Anker (contacts/deals/companies) haben die Spalte → uniform.
 */
import { compileToPostgrest } from "../filter/compile.ts";
import type { FilterNode } from "../filter/types.ts";
import type { AnchorEntity } from "./eval.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface Group { entity: AnchorEntity; where: FilterNode }

/** Anker-ID-Menge EINER Gruppe: compileToPostgrest (Single Source) + FK-Mapping auf den anchor. */
export async function groupAnchorIds(sb: SupabaseClient, org: string, anchor: AnchorEntity, group: Group): Promise<string[]> {
  const expr = compileToPostgrest({ entity: group.entity, where: group.where }); // dieselbe Lib wie dyn. Listen
  // Quell-Entity-Match: gelöschte Quell-Datensätze zählen nicht (058-Muster).
  const rows = async (table: string, col: string) => {
    const { data, error } = await sb.from(table).select(col).eq("organization_id", org).is("deleted_at", null).or(expr);
    if (error) throw error;
    return (data ?? []).map((r) => (r as unknown as Record<string, string | null>)[col]).filter((v): v is string => !!v);
  };
  const uniq = (a: string[]) => [...new Set(a)];
  // FK-Mapping auf den ANKER: der gemappte Anker darf nicht gelöscht sein (058-Muster).
  const via = async (table: string, col: string, ids: string[]) => {
    if (ids.length === 0) return [];
    const { data, error } = await sb.from(table).select("id").eq("organization_id", org).is("deleted_at", null).in(col, ids);
    if (error) throw error;
    return (data ?? []).map((r) => (r as unknown as { id: string }).id);
  };

  // WICHTIG (FUND 4b): Bei direkten FK-Mappings (contact_id/company_id) filtert `rows` nur die QUELLE
  // auf deleted_at — der ANKER (auf den die Regel wirkt) muss NOCHMAL über `via(anchor,"id",…)` gegen
  // deleted_at, sonst schlüpft ein gelöschter Anker mit lebendem verknüpftem Datensatz durch.
  if (group.entity === anchor) return uniq(await rows(anchor, "id"));
  if (anchor === "contacts") {
    if (group.entity === "deals") return await via("contacts", "id", uniq(await rows("deals", "contact_id")));
    return await via("contacts", "primary_company_id", uniq(await rows("companies", "id"))); // companies → contacts
  }
  if (anchor === "deals") {
    if (group.entity === "contacts") return await via("deals", "contact_id", uniq(await rows("contacts", "id")));
    return await via("deals", "company_id", uniq(await rows("companies", "id")));
  }
  // anchor === "companies" — Firmen-Anker via id nachfiltern (nicht-gelöschte Firma)
  if (group.entity === "contacts") return await via("companies", "id", uniq(await rows("contacts", "primary_company_id")));
  return await via("companies", "id", uniq(await rows("deals", "company_id")));
}

/** Owner des Ankers (contacts.assigned_to / deals.owner_id). Defensiv ebenfalls deleted_at-gefiltert. */
export async function resolveOwner(sb: SupabaseClient, org: string, anchor: AnchorEntity, entityId: string): Promise<string | null> {
  if (anchor === "contacts") {
    const { data } = await sb.from("contacts").select("assigned_to").eq("organization_id", org).is("deleted_at", null).eq("id", entityId).maybeSingle();
    return (data?.assigned_to as string | null) ?? null;
  }
  if (anchor === "deals") {
    const { data } = await sb.from("deals").select("owner_id").eq("organization_id", org).is("deleted_at", null).eq("id", entityId).maybeSingle();
    return (data?.owner_id as string | null) ?? null;
  }
  return null; // companies: kein Owner → Fallback Regel-Ersteller
}
